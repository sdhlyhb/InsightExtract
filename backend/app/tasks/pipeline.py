"""Document processing pipeline using Arq background tasks."""
import asyncio
from datetime import datetime
from typing import Dict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models import Card, Chunk, Deck, Document, DocumentStatus, Embedding, FlashcardType, Job, JobStatus
from app.services.embedding import get_embedding_service
from app.services.llm import get_llm_service
from app.services.pdf import chunk_text, extract_text_from_pdf

settings = get_settings()


async def update_job_progress(
    session: AsyncSession,
    job_id: UUID,
    status: str,
    progress: int,
    message: str = "",
):
    """Update job status and progress."""
    result = await session.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    
    if job:
        job.status = status
        job.progress = progress
        job.message = message
        
        if status in ["completed", "failed"]:
            job.completed_at = datetime.utcnow()
        
        await session.commit()


async def process_document(ctx: Dict, document_id: str, file_content: bytes):
    """
    Background task to process uploaded document.
    
    Simplified steps:
    1. Extract text from PDF
    2. Make ONE API call to analyze text and generate outline/key points
    3. Store results in database
    
    Args:
        ctx: Arq context
        document_id: UUID of document to process
        file_content: PDF file bytes
    """
    async with AsyncSessionLocal() as session:
        try:
            doc_uuid = UUID(document_id)
            
            # Get document and associated job
            result = await session.execute(
                select(Document).where(Document.id == doc_uuid)
            )
            document = result.scalar_one_or_none()
            
            if not document:
                print(f"Document {document_id} not found")
                return
            
            # Find the extract job
            result = await session.execute(
                select(Job)
                .where(Job.document_id == doc_uuid)
                .where(Job.type == "extract")
                .order_by(Job.created_at.desc())
            )
            job = result.scalar_one_or_none()
            
            if not job:
                print(f"No extract job found for document {document_id}")
                return
            
            # Update document status
            document.status = DocumentStatus.PROCESSING
            await session.commit()
            
            # Step 1: Extract text based on document type
            if document.source_type == DocumentSourceType.PDF:
                await update_job_progress(session, job.id, "running", 20, "Extracting text from PDF...")
                pdf_data = extract_text_from_pdf(file_content)
                full_text = pdf_data["text"]
                pages_info = pdf_data["pages"]
            elif document.source_type == DocumentSourceType.DOCX:
                await update_job_progress(session, job.id, "running", 20, "Extracting text from DOCX...")
                from app.services.docx import extract_text_from_docx
                docx_data = extract_text_from_docx(file_content)
                full_text = docx_data["text"]
                # For DOCX, create pages_info from paragraphs
                pages_info = [{"page": i+1, "text": para["text"]} for i, para in enumerate(docx_data["paragraphs"])]
            else:
                raise ValueError(f"Unsupported document type: {document.source_type}")
            
            if not full_text:
                raise ValueError(f"No text extracted from {document.source_type.upper()}")
            
            print(f"Extracted {len(full_text)} characters from {document.source_type.upper()}")
            
            # Step 2: Chunk text for storage (but don't generate embeddings yet)
            await update_job_progress(session, job.id, "running", 40, "Processing text...")
            
            chunks = chunk_text(
                full_text,
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap,
                page_info=pages_info,
            )
            
            # Store chunks (without embeddings for now)
            for chunk_data in chunks:
                chunk = Chunk(
                    document_id=doc_uuid,
                    content=chunk_data["content"],
                    token_count=chunk_data["token_count"],
                    page_from=chunk_data["page_from"],
                    page_to=chunk_data["page_to"],
                    chunk_metadata={"chunk_id": chunk_data["chunk_id"]},
                )
                session.add(chunk)
            
            await session.commit()
            
            # Step 3: Make ONE API call to analyze the text
            await update_job_progress(session, job.id, "running", 60, "Analyzing document with AI...")
            
            llm_service = get_llm_service()
            
            # Limit text to avoid token limits (approximately 15000 tokens = 60000 chars)
            text_to_analyze = full_text[:60000]
            if len(full_text) > 60000:
                text_to_analyze += "\n\n[Document truncated for analysis]"
            
            # Generate BOTH outline and main points in ONE API call
            await update_job_progress(session, job.id, "running", 80, "Generating outline and key points...")
            analysis_result = await llm_service.analyze_document(
                text=text_to_analyze,
                max_points=10,
                context={"title": document.title, "source_type": document.source_type.value}
            )
            
            # Extract both results from the single API call
            outline = analysis_result.get("outline", {})
            main_points = analysis_result.get("main_points", [])
            
            # Update document with outline and main points
            document.outline = outline
            document.main_points = main_points
            document.status = DocumentStatus.COMPLETED
            await session.commit()
            
            # Complete job
            await update_job_progress(session, job.id, "completed", 100, "Processing complete")
            
            print(f"Successfully processed document {document_id}")
            
        except Exception as e:
            print(f"Error processing document {document_id}: {str(e)}")
            
            # Update job as failed
            if job:
                await update_job_progress(
                    session,
                    job.id,
                    "failed",
                    0,
                    f"Processing failed: {str(e)}",
                )
            
            # Update document status
            if document:
                document.status = DocumentStatus.FAILED
                await session.commit()


async def generate_flashcards_task(ctx: Dict, document_id: str):
    """
    Background task to generate flashcards from processed document.
    
    Args:
        ctx: Arq context
        document_id: UUID of document
    """
    async with AsyncSessionLocal() as session:
        try:
            doc_uuid = UUID(document_id)
            
            # Get document
            result = await session.execute(
                select(Document).where(Document.id == doc_uuid)
            )
            document = result.scalar_one_or_none()
            
            if not document:
                print(f"Document {document_id} not found")
                return
            
            # Find the cards generation job
            result = await session.execute(
                select(Job)
                .where(Job.document_id == doc_uuid)
                .where(Job.type == "cards")
                .order_by(Job.created_at.desc())
            )
            job = result.scalar_one_or_none()
            
            if not job:
                print(f"No cards job found for document {document_id}")
                return
            
            await update_job_progress(session, job.id, "running", 10, "Preparing content...")
            
            # Get chunks for context
            result = await session.execute(
                select(Chunk)
                .where(Chunk.document_id == doc_uuid)
                .order_by(Chunk.created_at)
                .limit(15)
            )
            chunks = result.scalars().all()
            chunk_texts = [c.content for c in chunks]
            
            # Generate flashcards
            await update_job_progress(session, job.id, "running", 40, "Generating flashcards...")
            
            llm_service = get_llm_service()
            cards_data = await llm_service.generate_flashcards(
                outline=document.outline or {},
                chunks=chunk_texts,
                max_cards=20,
            )
            
            # Create deck
            await update_job_progress(session, job.id, "running", 70, "Creating deck...")
            
            deck = Deck(
                document_id=doc_uuid,
                title=f"{document.title} - Flashcards",
                tags=[],
            )
            session.add(deck)
            await session.flush()
            
            # Create cards
            await update_job_progress(session, job.id, "running", 85, "Saving flashcards...")
            
            for card_data in cards_data:
                card_type = card_data.get("type", "qa")
                try:
                    card_type_enum = FlashcardType(card_type)
                except ValueError:
                    card_type_enum = FlashcardType.QA
                
                card = Card(
                    deck_id=deck.id,
                    type=card_type_enum,
                    front=card_data.get("front", ""),
                    back=card_data.get("back", ""),
                    citations=card_data.get("citations", []),
                    tags=card_data.get("tags", []),
                )
                session.add(card)
            
            await session.commit()
            
            # Complete job
            await update_job_progress(
                session,
                job.id,
                "completed",
                100,
                f"Generated {len(cards_data)} flashcards",
            )
            
            print(f"Successfully generated flashcards for document {document_id}")
            
        except Exception as e:
            print(f"Error generating flashcards for document {document_id}: {str(e)}")
            
            if job:
                await update_job_progress(
                    session,
                    job.id,
                    "failed",
                    0,
                    f"Flashcard generation failed: {str(e)}",
                )


# Arq worker settings
class WorkerSettings:
    """Arq worker configuration."""
    
    functions = [process_document, generate_flashcards_task]
    redis_settings = settings.redis_url
    job_timeout = 600  # 10 minutes
    max_jobs = 10
