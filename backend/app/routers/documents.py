"""Document endpoints."""
from typing import List
from uuid import UUID
from io import BytesIO

from arq import create_pool
from arq.connections import RedisSettings
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Body
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models import Deck, Document, DocumentSourceType, DocumentStatus, DocumentKind, Job
from app.schemas import DeckResponse, DocumentOutline, DocumentResponse, OutlineNode, AnalyzeTextRequest

settings = get_settings()
router = APIRouter(prefix="/documents", tags=["documents"])


# Helper to get Redis pool for Arq
async def get_redis_pool():
    """Get or create Redis connection pool for Arq."""
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    return await create_pool(redis_settings)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    file: UploadFile = File(...),
    source_type: str = Form(...),
    db: AsyncSession = Depends(get_db),
) -> Document:
    """Create a new document by uploading a file."""
    try:
        source_type_enum = DocumentSourceType(source_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid source_type: {source_type}",
        )

    content = await file.read()
    file_size = len(content)

    import hashlib
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Validate file type matches source_type
    filename_lower = file.filename.lower()
    if source_type_enum == DocumentSourceType.PDF and not filename_lower.endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF when source_type is 'pdf'",
        )
    elif source_type_enum == DocumentSourceType.DOCX and not filename_lower.endswith('.docx'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a DOCX when source_type is 'docx'",
        )

    result = await db.execute(
        select(Document).where(Document.file_hash == file_hash)
    )
    existing_doc = result.scalar_one_or_none()
    if existing_doc:
        return existing_doc

    page_count = None
    if source_type_enum == DocumentSourceType.PDF:
        try:
            import pdfplumber
            with pdfplumber.open(BytesIO(content)) as pdf:
                page_count = len(pdf.pages)
        except Exception as e:
            print(f"Error extracting PDF metadata: {e}")
    elif source_type_enum == DocumentSourceType.DOCX:
        try:
            from app.services.docx import extract_text_from_docx
            result = extract_text_from_docx(content)
            page_count = result["paragraph_count"]  # Use paragraph count for DOCX
        except Exception as e:
            print(f"Error extracting DOCX metadata: {e}")

    document = Document(
        title=file.filename or "Untitled",
        source_type=source_type_enum,
        status=DocumentStatus.UPLOADED,
        file_size=file_size,
        page_count=page_count,
        file_hash=file_hash,
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Note: No background processing task is enqueued here
    # Frontend uses direct /extract-text and /analyze-text endpoints instead

    return document


@router.post("/extract-text", status_code=status.HTTP_200_OK)
async def extract_text_only(
    file: UploadFile = File(...),
) -> dict:
    """
    Extract text from PDF or DOCX without any AI processing or database storage.
    Simple endpoint for testing document text extraction only.
    """
    filename_lower = file.filename.lower()
    
    if not (filename_lower.endswith('.pdf') or filename_lower.endswith('.docx')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported",
        )
    
    content = await file.read()
    
    try:
        if filename_lower.endswith('.pdf'):
            from app.services.pdf import extract_text_from_pdf
            result = extract_text_from_pdf(content)
            
            return {
                "filename": file.filename,
                "file_size": len(content),
                "page_count": result["page_count"],
                "text": result["text"],
                "pages": result["pages"],
                "char_count": len(result["text"]),
            }
        else:  # .docx
            from app.services.docx import extract_text_from_docx
            result = extract_text_from_docx(content)
            
            return {
                "filename": file.filename,
                "file_size": len(content),
                "paragraph_count": result["paragraph_count"],
                "text": result["text"],
                "paragraphs": result["paragraphs"],
                "char_count": len(result["text"]),
                "metadata": result["metadata"],
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text: {str(e)}",
        )


@router.post("/analyze-text", status_code=status.HTTP_200_OK)
async def analyze_text(
    request: AnalyzeTextRequest = Body(...),
) -> dict:
    """
    Analyze text with AI to generate outline and main points.
    Makes a single API call to OpenAI.
    """
    if not request.text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text is required",
        )
    
    try:
        from app.services.llm import get_llm_service
        
        llm_service = get_llm_service()
        
        # Use the optimized analyze_document method (1 API call)
        result = await llm_service.analyze_document(
            text=request.text[:60000],  # Limit to ~15k tokens
            max_points=request.max_points,
            context={"source": "direct_text_analysis"}
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze text: {str(e)}",
        )


@router.get("/recent", response_model=List[DocumentResponse])
async def get_recent_documents(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
) -> List[Document]:
    """Get recent documents including flashcard CSVs."""
    result = await db.execute(
        select(Document)
        .order_by(Document.created_at.desc())
        .limit(limit)
    )
    documents = result.scalars().all()
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Document:
    """Get document by ID."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> List[Document]:
    """List all documents."""
    result = await db.execute(
        select(Document)
        .order_by(Document.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    documents = result.scalars().all()
    return list(documents)


@router.get("/{document_id}/outline", response_model=DocumentOutline)
async def get_document_outline(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> DocumentOutline:
    """Get document outline and main points."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    if not document.outline:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not yet generated",
        )

    return DocumentOutline(
        document_id=document.id,
        main_points=document.main_points or [],
        outline=[OutlineNode(**node) for node in document.outline or []],
        citations=[],
    )


@router.post("/{document_id}/generate")
async def generate_flashcards(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Trigger flashcard generation for a document."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    job = Job(
        document_id=document.id,
        type="cards",
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Enqueue flashcard generation task
    try:
        redis = await get_redis_pool()
        await redis.enqueue_job(
            "generate_flashcards_task",
            str(document.id),
        )
    except Exception as e:
        print(f"Failed to enqueue flashcard generation task: {e}")
        # Continue anyway - job is created in DB

    return {"job_id": str(job.id), "status": "pending"}


@router.get("/{document_id}/decks", response_model=List[DeckResponse])
async def get_document_decks(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Get all decks for a document."""
    result = await db.execute(
        select(Deck)
        .options(selectinload(Deck.cards))
        .where(Deck.document_id == document_id)
        .order_by(Deck.created_at.desc())
    )
    decks = result.scalars().all()

    from datetime import datetime
    response = []
    for deck in decks:
        card_count = len(deck.cards)
        due_count = sum(1 for card in deck.cards if card.due_date <= datetime.utcnow())
        
        response.append({
            "id": deck.id,
            "document_id": deck.document_id,
            "title": deck.title,
            "card_count": card_count,
            "due_count": due_count,
            "tags": deck.tags,
            "created_at": deck.created_at,
        })

    return response


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a document and all associated data."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    await db.delete(document)
    await db.commit()


@router.post("/flashcards", status_code=status.HTTP_201_CREATED)
async def save_flashcards_csv(
    data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Save flashcards CSV to database."""
    # Validate required fields
    if not data.get("name"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: name",
        )
    if not data.get("content"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required field: content",
        )
    
    # Validate MIME type
    mime_type = data.get("mimeType", "text/csv")
    if mime_type not in ["text/csv", "application/json"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only text/csv and application/json MIME types are supported",
        )
    
    # Validate size
    size = data.get("size", len(data["content"]))
    if size > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file too large (max 10MB)",
        )
    
    # Extract metadata
    meta = data.get("meta", {})
    card_count = meta.get("cardCount", 0)
    step2_digest = meta.get("step2Digest")
    
    # Determine document kind based on MIME type or meta
    if mime_type == "application/json" or meta.get("kind") == "summary":
        doc_kind = DocumentKind.SUMMARY
    else:
        doc_kind = DocumentKind.FLASHCARDS_CSV
    
    # Create document record
    document = Document(
        title=data["name"],
        source_type=DocumentSourceType.TEXT,
        kind=doc_kind,
        mime_type=mime_type,
        file_size=size,
        content=data["content"],
        source_file_name=data.get("sourceFileName"),
        step2_digest=step2_digest,
        card_count=card_count,
        meta=meta,
        status=DocumentStatus.COMPLETED,
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return {
        "id": str(document.id),
        "name": document.title,
        "mimeType": document.mime_type,
        "size": document.file_size,
        "cardCount": document.card_count,
        "createdAt": document.created_at.isoformat(),
    }
