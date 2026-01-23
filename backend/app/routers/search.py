"""Search endpoints."""
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SearchResult

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=List[SearchResult])
async def search_documents(
    query: str = Query(..., min_length=1),
    k: int = Query(default=10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[SearchResult]:
    """Search across all documents using vector similarity."""
    # TODO: Implement vector search using pgvector
    return []
