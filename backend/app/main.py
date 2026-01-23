"""FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import cards, decks, documents, jobs, search

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 Starting InsightExtract API...")
    
    # Initialize database tables
    from app.database import engine
    from app.models import Base
    
    async with engine.begin() as conn:
        # Create pgvector extension
        from sqlalchemy import text
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down InsightExtract API...")
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="InsightExtract API",
    description="API for PDF-to-flashcard conversion with spaced repetition",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix="/api")
app.include_router(decks.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(search.router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "InsightExtract API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "message": "Internal server error",
            "detail": str(exc) if settings.debug else None,
        },
    )
