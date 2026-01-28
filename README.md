# InsightExtract

A full-stack application for extracting insights from documents using AI, with automated flashcard generation and study management.

**Built with AI-assisted development** - See [AI_ASSISTED_DEV_DOC.md](./AI_ASSISTED_DEV_DOC.md) for details on AI tools and workflows used.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL + Redis
- **AI**: OpenAI GPT-4o-mini for intelligent document summarization
- **Background Jobs**: Arq worker for async processing
- **Deployment**: Docker + Docker Compose, ready for Render

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

- **Integration Tests**: `backend/tests/` - 22 tests covering all API endpoints
  - `test_documents_api.py` - Document upload, parsing, summarization
  - `test_decks_api.py` - Deck and flashcard management
  - `test_health.py` - Health check endpoints
- **Frontend Tests**: `src/**/*.test.ts` - Component and utility tests

See [README_TESTING.md](./README_TESTING.md) for comprehensive testing documentation.

## 🛠️ Development

### Project Structure

```
InsightExtract/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Backend container
│   ├── requirements.txt    # Python dependencies
│   └── worker.py           # Background worker
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── Dockerfile              # Frontend container
├── nginx.conf              # Nginx configuration
├── docker-compose.yml      # Local development
├── render.yaml             # Render deployment
└── README.md
```

### Key Features

- 📄 **Document Processing**: PDF and text file upload with OCR support
- 🤖 **AI Summarization**: Intelligent document analysis using GPT-4o-mini
- 🎴 **Flashcard Generation**: Automated flashcard creation from summaries
- 📱 **Responsive Design**: Mobile-first UI with Tailwind CSS
- 🔄 **Background Jobs**: Async processing with Redis and Arq
- 🧪 **Comprehensive Tests**: 22 integration tests, 56% coverage
- 🚀 **CI/CD Ready**: GitHub Actions for automated testing and deployment

## 📝 API Documentation

The API follows the OpenAPI 3.1.0 specification. Documentation is available in multiple formats:

- **Interactive Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Specification**: [`openapi.json`](./openapi.json)

### Key API Endpoints

- `POST /api/documents` - Upload and process documents
- `GET /api/documents` - List all documents
- `GET /api/documents/{id}` - Get document details
- `POST /api/documents/{id}/generate` - Generate flashcards
- `GET /api/decks` - List all flashcard decks
- `POST /api/decks` - Create a new deck
- `GET /api/decks/{id}/cards` - Get cards in a deck
- `POST /api/cards/{id}/review` - Review a flashcard

The OpenAPI specification serves as the contract between frontend and backend development.

## 🧪 Testing

### Running Tests Locally

See [README_TESTING.md](./README_TESTING.md) for comprehensive testing documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [AGENTS.md](./AGENTS.md) for information on AI-assisted development workflow.

## 📚 Documentation

- **Setup Guide**: [SETUP.md](./SETUP.md) - Detailed setup instructions for new users
- **Testing Guide**: [README_TESTING.md](./README_TESTING.md) - Comprehensive testing documentation
- **AI Development**: [AGENTS.md](./AGENTS.md) - AI tools and MCP integration
- **API Specification**: [openapi.json](./openapi.json) - OpenAPI 3.1.0 contract

## 📄 License

See [LICENSE](./LICENSE) file for details.
