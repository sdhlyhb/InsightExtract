"""Pydantic schemas for API requests and responses."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import DocumentSourceType, DocumentStatus, FlashcardType, JobStatus, JobType


# Document Schemas
class DocumentCreate(BaseModel):
    """Document creation schema."""

    title: str = Field(..., min_length=1, max_length=500)
    source_type: DocumentSourceType


class AnalyzeTextRequest(BaseModel):
    """Request schema for text analysis."""
    
    text: str = Field(..., min_length=1)
    max_points: Optional[int] = Field(default=10, ge=1, le=50)


class OutlineNode(BaseModel):
    """Outline node schema."""

    title: str
    page: Optional[int] = None
    children: Optional[List["OutlineNode"]] = None


class Citation(BaseModel):
    """Citation schema."""

    id: str
    page: int
    quote: str
    context: Optional[str] = None


class DocumentOutline(BaseModel):
    """Document outline schema."""

    document_id: UUID
    main_points: List[str]
    outline: List[OutlineNode]
    citations: List[Citation]


class DocumentResponse(BaseModel):
    """Document response schema."""

    id: UUID
    title: str
    source_type: DocumentSourceType
    status: DocumentStatus
    kind: Optional[str] = None
    file_size: Optional[int] = None
    page_count: Optional[int] = None
    mime_type: Optional[str] = None
    content: Optional[str] = None
    source_file_name: Optional[str] = None
    card_count: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Deck Schemas
class CardCreateInput(BaseModel):
    """Card creation input for deck creation."""
    
    front: str = Field(..., min_length=1)
    back: str = Field(..., min_length=1)
    type: FlashcardType = FlashcardType.QA
    tags: List[str] = []


class DeckCreate(BaseModel):
    """Deck creation schema."""
    
    title: str = Field(..., min_length=1, max_length=500)
    documentId: Optional[UUID] = None
    cards: List[CardCreateInput] = []
    tags: List[str] = []


class DeckResponse(BaseModel):
    """Deck response schema."""

    id: UUID
    document_id: Optional[UUID] = None
    title: str
    card_count: int
    due_count: int
    tags: List[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# Card Schemas
class CardUpdate(BaseModel):
    """Card update schema."""

    front: Optional[str] = None
    back: Optional[str] = None
    tags: Optional[List[str]] = None


class CardReview(BaseModel):
    """Card review schema."""

    quality: int = Field(..., ge=0, le=5)


class CardResponse(BaseModel):
    """Card response schema."""

    id: UUID
    deck_id: UUID
    type: FlashcardType
    front: str
    back: str
    citations: List[Dict[str, Any]]
    tags: List[str]
    ease: float
    interval: int
    repetition: int
    due_date: datetime
    last_reviewed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Job Schemas
class JobResponse(BaseModel):
    """Job response schema."""

    id: UUID
    document_id: UUID
    type: JobType
    status: JobStatus
    progress: int
    message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Search Schemas
class SearchQuery(BaseModel):
    """Search query schema."""

    query: str = Field(..., min_length=1)
    k: int = Field(default=10, ge=1, le=100)


class SearchResult(BaseModel):
    """Search result schema."""

    chunk_id: UUID
    document_id: UUID
    document_title: str
    content: str
    page_from: Optional[int]
    page_to: Optional[int]
    score: float
