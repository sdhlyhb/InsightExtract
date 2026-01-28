# InsightExtract


https://github.com/user-attachments/assets/318b957f-f6f5-4322-a441-66f98136cb9b


A full-stack AI-powered learning platform that transforms PDFs and documents into structured knowledge, intelligent summaries, and study-ready flashcards with spaced repetition.

**Built with AI-assisted development** - See [AI_ASSISTED_DEV_DOC.md](./AI_ASSISTED_DEV_DOC.md) for details on AI tools and workflows used.

## ✨ Core Features

- 📄 **Smart Document Processing**: Upload PDFs, DOCX, or text files with automatic OCR support for scanned documents
- 🧠 **AI-Powered Analysis**: GPT-4o-mini generates hierarchical outlines, key takeaways, and cited main points
- 🎴 **Intelligent Flashcard Generation**: Automatically creates Q&A, cloze deletion, and true/false cards with source citations
- 📚 **Spaced Repetition Study**: SM-2 algorithm optimizes learning with 4-level rating system (Again/Hard/Good/Easy)
- 🔍 **Vector Search Ready**: pgvector integration for semantic search and retrieval-augmented generation
- ⚡ **Real-time Progress Tracking**: Server-Sent Events provide live updates during document processing
- 📱 **Responsive Design**: Mobile-first UI with dark mode support
- 🐳 **Production Ready**: Dockerized stack with CI/CD pipeline

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Radix UI
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (with pgvector) + Redis
- **AI**: OpenAI GPT-4o-mini for summarization, embeddings, and flashcard generation
- **Background Jobs**: Arq worker for async document processing
- **PDF Processing**: pdfplumber + PyMuPDF + pytesseract for OCR
- **Deployment**: Docker + Docker Compose, Render-ready with render.yaml

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Local Development with Docker

1. **Clone the repository**

```bash
git clone <repository-url>
cd InsightExtract
```

2. **Create environment file**

```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. **Start all services**

```bash
# Option 1: Using the helper script (recommended)
./docker-dev.sh up -d

# Option 2: Using docker compose directly
docker compose up -d
```

This will start:

- Frontend (Nginx): http://localhost
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Background Worker

4. **Manage services**

```bash
# Using the helper script from any directory
./docker-dev.sh ps              # Check status
./docker-dev.sh logs -f         # View logs (Ctrl+C to exit)
./docker-dev.sh restart api     # Restart specific service
./docker-dev.sh down            # Stop all services
```

5. **View logs**

```bash
docker-compose logs -f
```

5. **Stop services**

```bash
docker-compose down
```

### Local Development (Without Docker)

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start PostgreSQL and Redis (via Docker)
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start the API
uvicorn app.main:app --reload --port 8000

# In another terminal, start the worker
python worker.py
```

#### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173

## 📦 Deployment to Render

### Option 1: Using Blueprint (Recommended)

1. **Fork/Push this repository to GitHub**

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Configure Environment Variables**
   - Add your `OPENAI_API_KEY` in the Render dashboard
   - Other variables are auto-configured from databases

4. **Deploy**
   - Render will automatically build and deploy all services
   - Your app will be available at `https://your-app-name.onrender.com`

### Option 2: Manual Setup

1. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Name: `insightextract-db`
   - Plan: Free or Starter

2. **Create Redis Instance**
   - New → Redis
   - Name: `insightextract-redis`
   - Plan: Free or Starter

3. **Create Web Service**
   - New → Web Service
   - Connect your repository
   - Environment: Docker
   - Build Command: (auto-detected from Dockerfile)
   - Health Check Path: `/health`
   - Environment Variables:
     - `OPENAI_API_KEY`: Your OpenAI key
     - `DATABASE_URL`: Link to PostgreSQL database
     - `REDIS_URL`: Link to Redis instance
     - `ENVIRONMENT`: production

4. **Create Background Worker**
   - New → Background Worker
   - Same repository
   - Docker Command: `python worker.py`
   - Environment Variables: Same as web service

## 🧪 Testing

### Running Tests Locally

```bash
# Backend integration tests (22 tests, 56% coverage)
cd backend
pytest tests/ -v

# With coverage report
pytest tests/ -v --cov=app --cov-report=html
# Open htmlcov/index.html to view coverage

# Run specific test file
pytest tests/test_documents_api.py -v

# Frontend tests
npm run test

# Lint and type check
npm run lint
tsc --noEmit
```

### Test Structure

- **Backend Integration Tests**: `backend/tests/` - 22 tests covering all API endpoints
  - `test_documents_api.py` - Document upload, parsing, summarization, flashcard generation
  - `test_decks_api.py` - Deck and flashcard CRUD, SRS review logic
  - `test_health.py` - Health check endpoints and dependency validation
- **Frontend Tests**: `src/**/*.test.ts` - Component and utility tests
  - Current: Basic utility tests
  - Planned: Component tests for study session, flashcard editor, PDF preview

### Continuous Integration

GitHub Actions automatically runs:

- Backend tests on every push and PR
- Type checking and linting
- Docker build validation

See [README_TESTING.md](./README_TESTING.md) for comprehensive testing documentation.

## 🛠️ Development

### Project Structure

```
InsightExtract/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app with CORS & routers
│   │   ├── models/         # SQLAlchemy models (Document, Deck, Flashcard, Job)
│   │   ├── routers/        # API endpoints (documents, decks, cards)
│   │   ├── services/       # Business logic (PDF parsing, LLM, embeddings)
│   │   ├── tasks/          # Background tasks (process_document, generate_flashcards)
│   │   └── utils/          # Utilities (chunking, vector ops)
│   ├── tests/              # Integration tests (22 tests, 56% coverage)
│   ├── Dockerfile          # Multi-stage Python backend container
│   ├── requirements.txt    # Python dependencies (FastAPI, OpenAI, pgvector)
│   └── worker.py           # Arq background worker
├── src/                    # React frontend
│   ├── api/                # API client (axios-like wrapper)
│   │   ├── client.ts       # Base HTTP client
│   │   └── endpoints.ts    # Type-safe API endpoints
│   ├── components/         # React components
│   │   ├── ui/             # Radix UI components (Button, Card, Dialog)
│   │   ├── FileDropzone.tsx
│   │   ├── PdfPreview.tsx
│   │   ├── OutlineTree.tsx
│   │   ├── CitationPopover.tsx
│   │   ├── FlashcardEditor.tsx
│   │   └── SrsControls.tsx
│   ├── hooks/              # Custom hooks (useApi, useDeckApi)
│   ├── pages/              # Page components
│   │   ├── LandingPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── DocumentPage.tsx
│   │   ├── DecksListPage.tsx
│   │   ├── DeckPage.tsx
│   │   └── StudySessionPage.tsx
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Frontend utilities
│   └── App.tsx             # React Router configuration
├── Dockerfile              # Multi-stage Node + Nginx frontend container
├── nginx.conf              # Nginx reverse proxy config
├── docker-compose.yml      # 5-service orchestration (postgres, redis, api, worker, frontend)
├── docker-dev.sh           # Portable Docker helper script
├── render.yaml             # Render deployment blueprint
├── .github/workflows/      # GitHub Actions CI/CD
└── README.md
```

### Key Features

- 📄 **Document Processing Pipeline**
  - Multi-format support (PDF, DOCX, TXT)
  - OCR for scanned documents (pytesseract)
  - Automatic text chunking with overlap
  - Duplicate detection via SHA-256 hash
- 🤖 **AI-Powered Analysis**
  - Hierarchical outline generation
  - Key point extraction with page citations
  - Context-aware flashcard creation (Q&A, cloze, true/false)
  - Quality validation and deduplication
- 🎴 **Study System**
  - SM-2 spaced repetition algorithm
  - 4-level rating system (Again: <1m, Hard: <6m, Good: ~1d, Easy: ~4d)
  - Progress tracking with visual feedback
  - Citation display for source reference
- 🔍 **Vector Search**
  - OpenAI embeddings (text-embedding-3-small)
  - pgvector for semantic similarity
  - Ready for retrieval-augmented generation (RAG)
- 🏗️ **Modern Stack**
  - React Query for data fetching
  - Server-Sent Events for real-time updates
  - Async background processing with Arq
  - Type-safe API with OpenAPI 3.1.0 spec
  - 22 integration tests, 56% coverage
  - GitHub Actions CI/CD pipeline

## 📝 API Documentation

The API follows the OpenAPI 3.1.0 specification. Documentation is available in multiple formats:

- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Specification**: [`openapi.json`](./openapi.json)

### Key API Endpoints

#### Documents

- `POST /api/documents` - Upload and process documents (PDF/DOCX/TXT)
- `GET /api/documents` - List all documents with pagination
- `GET /api/documents/{id}` - Get document details and processing status
- `GET /api/documents/{id}/outline` - Get AI-generated outline, main points, and citations
- `POST /api/documents/{id}/generate` - Generate flashcards from document
- `GET /api/documents/{id}/decks` - List flashcard decks for document
- `DELETE /api/documents/{id}` - Delete document and associated data
- `GET /api/documents/{id}/stream` - SSE stream for real-time processing updates

#### Decks & Flashcards

- `GET /api/decks` - List all flashcard decks
- `POST /api/decks` - Create a new deck
- `GET /api/decks/{id}` - Get deck details
- `GET /api/decks/{id}/cards` - Get cards in a deck (supports due card filtering)
- `DELETE /api/decks/{id}` - Delete deck and all cards
- `POST /api/cards` - Create a new flashcard
- `GET /api/cards/{id}` - Get flashcard details
- `PATCH /api/cards/{id}` - Update flashcard (question, answer, tags)
- `POST /api/cards/{id}/review` - Review flashcard with SRS rating (0-5)
- `DELETE /api/cards/{id}` - Delete flashcard

#### Health & System

- `GET /health` - Basic health check
- `GET /health/detailed` - Database and Redis connectivity status

The OpenAPI specification serves as the contract between frontend and backend development.

## 🚀 User Workflow

1. **Upload**: Drop a PDF on the landing page or upload from home
2. **Processing**: Watch real-time progress as the AI analyzes the document (extract → chunk → embed → summarize)
3. **Review**: View the generated outline, key points, and citations on the document page
4. **Generate**: Click "Make Flashcards" to create study materials
5. **Study**: Navigate to decks, select a deck, and click "Start Study"
6. **Learn**: Rate each card (Again/Hard/Good/Easy) to optimize future review intervals
7. **Track**: Monitor progress with visual feedback and return for spaced repetition reviews

## 🔮 Future Enhancements

### High Priority

- [ ] **Collaborative Study**: Share decks with other users, study together
- [ ] **Mobile Apps**: Native iOS/Android apps with offline study support
- [ ] **Advanced RAG**: Ask questions about documents with citation-backed answers
- [ ] **Custom Prompts**: User-defined flashcard generation styles and templates
- [ ] **Audio/Video Support**: Process lecture recordings and video transcripts
- [ ] **Bulk Operations**: Import/export multiple decks, batch edit cards

### Medium Priority

- [ ] **Study Analytics**: Detailed statistics (retention rate, weak topics, study streaks)
- [ ] **Gamification**: XP, levels, achievements for consistent study
- [ ] **Tag Management**: Advanced filtering and organization by topics/subjects
- [ ] **Anki Integration**: Two-way sync with Anki desktop/mobile
- [ ] **LaTeX Support**: Math equations in flashcards with MathJax/KaTeX rendering
- [ ] **Image Occlusion**: Generate flashcards from diagrams with selective hiding

### Low Priority

- [ ] **Multi-language**: Support for non-English documents and UI localization
- [ ] **Voice Study**: Hands-free study mode with speech recognition
- [ ] **Community Decks**: Marketplace for sharing public flashcard decks
- [ ] **Browser Extension**: Create flashcards from web articles with one click
- [ ] **Integration APIs**: Webhook support for LMS platforms (Moodle, Canvas)
- [ ] **AI Tutor Chat**: Conversational interface to explain concepts in cards

### Technical Improvements

- [ ] **Increase Test Coverage**: Target 80%+ backend coverage, add frontend tests
- [ ] **Performance Optimization**: Lazy loading, infinite scroll, CDN for assets
- [ ] **Caching Layer**: Redis cache for frequently accessed documents and decks
- [ ] **Monitoring**: OpenTelemetry tracing, Sentry error tracking, Prometheus metrics
- [ ] **Security Enhancements**: Rate limiting, CSRF protection, content security policy
- [ ] **Database Optimization**: Query optimization, connection pooling, read replicas

## 🧪 Testing

### Running Tests Locally

See [README_TESTING.md](./README_TESTING.md) for comprehensive testing documentation.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository** and create a feature branch

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our coding standards:
   - **TypeScript**: Strict mode, prefer `interface` over `type`, no `any`
   - **Python**: PEP 8 style, type hints, docstrings for public functions
   - **Components**: Functional components with hooks, composition over inheritance
   - **Tests**: Add tests for new features, maintain coverage above 50%

3. **Run tests** to ensure everything works

   ```bash
   # Backend
   cd backend && pytest tests/ -v

   # Frontend
   npm run test
   npm run lint
   tsc --noEmit
   ```

4. **Commit your changes** with descriptive messages

   ```bash
   git commit -m 'feat: Add amazing feature with tests'
   ```

5. **Push to your branch** and open a Pull Request
   ```bash
   git push origin feature/amazing-feature
   ```

### Development Guidelines

- Follow the AI-assisted development workflow in [AGENTS.md](./AGENTS.md)
- Use the MCP tools documented in [AI_ASSISTED_DEV_DOC.md](./AI_ASSISTED_DEV_DOC.md)
- Reference the [SETUP.md](./SETUP.md) guide for environment setup
- Check [openapi.json](./openapi.json) for API contract changes

### Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated (README, docstrings, type hints)
- [ ] No console errors or warnings
- [ ] Docker build successful
- [ ] OpenAPI spec updated if API changed

## 📚 Documentation

- **Setup Guide**: [SETUP.md](./SETUP.md) - Detailed setup instructions for new users
- **Testing Guide**: [README_TESTING.md](./README_TESTING.md) - Comprehensive testing documentation
- **AI Development**: [AGENTS.md](./AGENTS.md) - AI tools and MCP integration
- **API Specification**: [openapi.json](./openapi.json) - OpenAPI 3.1.0 contract

## 📄 License

See [LICENSE](./LICENSE) file for details.
