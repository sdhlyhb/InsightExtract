"""Flashcard generation background task."""
import asyncio
from datetime import datetime
from typing import Dict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models import Card, Deck, Document, FlashcardType, Job, JobStatus
from app.services.llm import get_llm_service

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
            
            # Use document outline and main points for flashcard generation
            if not document.outline and not document.main_points:
                raise ValueError("Document has no outline or main points to generate flashcards from")
            
            # Generate flashcards
            await update_job_progress(session, job.id, "running", 40, "Generating flashcards...")
            
            llm_service = get_llm_service()
            cards_data = await llm_service.generate_flashcards(
                outline=document.outline or {},
                chunks=[],  # No chunks needed - use outline and main points
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
    
    functions = [generate_flashcards_task]
    redis_settings = settings.redis_url
    job_timeout = 600  # 10 minutes
    max_jobs = 10
