"""Job endpoints."""
import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.models import Job
from app.schemas import JobResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Job:
    """Get job status by ID."""
    result = await db.execute(
        select(Job).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    return job


@router.get("/{job_id}/stream")
async def stream_job_progress(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> EventSourceResponse:
    """Stream job progress via Server-Sent Events."""
    result = await db.execute(
        select(Job).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )

    async def event_generator():
        """Generate SSE events for job progress."""
        from app.database import AsyncSessionLocal
        
        while True:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(Job).where(Job.id == job_id)
                )
                current_job = result.scalar_one_or_none()

                if not current_job:
                    break

                data = {
                    "jobId": str(current_job.id),
                    "type": current_job.type,
                    "status": current_job.status,
                    "progress": current_job.progress,
                    "message": current_job.message,
                }
                yield {"data": json.dumps(data)}

                if current_job.status in ["completed", "failed"]:
                    break

                await asyncio.sleep(1)

    return EventSourceResponse(event_generator())
