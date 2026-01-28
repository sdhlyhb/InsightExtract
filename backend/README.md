# InsightExtract Backend (FastAPI)

FastAPI backend for InsightExtract - PDF-to-flashcard conversion with spaced repetition.

## Setup

### Quick Start with Docker

```bash
# Start services
docker-compose up -d

# API will be available at http://localhost:8000
# Worker will start automatically in the api container
```

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings (OPENAI_API_KEY is required!)

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000

# In another terminal, start the background worker
python worker.py
```

## Environment Variables

Required:

- `OPENAI_API_KEY` - Your OpenAI API key for embeddings and LLM
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string for background jobs

Optional:

- `ANTHROPIC_API_KEY` - Anthropic API key (future use)
- Azure OpenAI settings for Azure-hosted models

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings
│   ├── database.py          # Database connection
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── routers/             # API endpoints
│   │   ├── documents.py     # Document CRUD & upload
│   │   ├── decks.py         # Deck management
│   │   ├── cards.py         # Flashcard & review
│   │   ├── jobs.py          # Job status & SSE streaming
│   │   └── search.py        # Vector similarity search
│   ├── services/            # Business logic
│   │   ├── pdf.py           # PDF extraction & chunking
│   │   ├── embedding.py     # OpenAI embedding generation
│   │   └── llm.py           # Outline & flashcard generation
│   └── tasks/               # Background jobs
│       └── pipeline.py      # Document processing pipeline
├── worker.py                # Arq background worker
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container image
└── docker-compose.yml      # Multi-container setup
```

## How It Works

### Document Processing Pipeline

1. **Upload**: User uploads PDF via `/api/documents`
2. **Extract**: Background worker extracts text using pdfplumber
3. **Chunk**: Text is split into overlapping segments
4. **Embed**: OpenAI generates embeddings for each chunk
5. **Store**: Chunks and embeddings saved to PostgreSQL with pgvector
6. **Analyze**: LLM generates document outline and main points
7. **Generate**: User triggers flashcard generation via `/api/documents/{id}/generate`
8. **Cards**: LLM creates Q/A, cloze, and true/false flashcards with citations

### Background Worker

The Arq worker (`worker.py`) processes long-running tasks:

- `process_document`: Full PDF processing pipeline (steps 2-6)
- `generate_flashcards_task`: Creates flashcard deck from document

Jobs are tracked in the database with real-time progress updates via Server-Sent Events.
│ ├── schemas.py # Pydantic schemas
│ ├── routers/ # API endpoints
│ ├── services/ # Business logic
│ └── tasks/ # Background jobs
├── alembic/ # Database migrations
├── requirements.txt
└── docker-compose.yml

```

## Key Features

- 🚀 Async FastAPI with PostgreSQL + pgvector
- 📝 PDF text extraction
- 🧠 SM-2 spaced repetition algorithm
- 🔍 Vector similarity search (ready for RAG)
- 📊 Server-Sent Events for progress updates
- 🐳 Docker Compose for easy deployment
```
