"""Database models."""
import enum
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class DocumentSourceType(str, enum.Enum):
    """Document source type enum."""

    PDF = "pdf"
    DOCX = "docx"
    TEXT = "text"
    URL = "url"


class DocumentStatus(str, enum.Enum):
    """Document processing status enum."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobStatus(str, enum.Enum):
    """Job status enum."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class JobType(str, enum.Enum):
    """Job type enum."""

    EXTRACT = "extract"
    EMBED = "embed"
    SUMMARIZE = "summarize"
    CARDS = "cards"


class FlashcardType(str, enum.Enum):
    """Flashcard type enum."""

    QA = "qa"
    CLOZE = "cloze"
    TRUEFALSE = "truefalse"


class Document(Base):
    """Document model."""

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    title = Column(String(500), nullable=False)
    source_type = Column(Enum(DocumentSourceType), nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    file_size = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    file_hash = Column(String(64), nullable=True, index=True)
    outline = Column(JSON, nullable=True)
    main_points = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    decks = relationship("Deck", back_populates="document", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    """Text chunk model for RAG."""

    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, nullable=False)
    page_from = Column(Integer, nullable=True)
    page_to = Column(Integer, nullable=True)
    section_title = Column(String(500), nullable=True)
    chunk_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="chunks")
    embedding = relationship("Embedding", back_populates="chunk", uselist=False, cascade="all, delete-orphan")


class Embedding(Base):
    """Vector embedding model."""

    __tablename__ = "embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey("chunks.id", ondelete="CASCADE"), nullable=False, unique=True)
    vector = Column(Vector(1536), nullable=False)
    model = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    chunk = relationship("Chunk", back_populates="embedding")


class Deck(Base):
    """Flashcard deck model."""

    __tablename__ = "decks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    document = relationship("Document", back_populates="decks")
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")


class Card(Base):
    """Flashcard model."""

    __tablename__ = "cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    deck_id = Column(UUID(as_uuid=True), ForeignKey("decks.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(FlashcardType), nullable=False)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    citations = Column(JSON, default=list, nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    
    # SM-2 algorithm fields
    ease = Column(Float, default=2.5, nullable=False)
    interval = Column(Integer, default=0, nullable=False)
    repetition = Column(Integer, default=0, nullable=False)
    due_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_reviewed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    deck = relationship("Deck", back_populates="cards")
    reviews = relationship("Review", back_populates="card", cascade="all, delete-orphan")


class Review(Base):
    """Card review model for SRS tracking."""

    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False)
    quality = Column(Integer, nullable=False)
    ease = Column(Float, nullable=False)
    interval = Column(Integer, nullable=False)
    repetition = Column(Integer, nullable=False)
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    card = relationship("Card", back_populates="reviews")


class Job(Base):
    """Background job tracking model."""

    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(JobType), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    progress = Column(Integer, default=0, nullable=False)
    message = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="jobs")
