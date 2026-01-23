# InsightExtract Backend

NestJS-based backend API for InsightExtract - transforms PDFs into structured knowledge and flashcards.

## Features

- 📄 **PDF Processing** - Extract text from PDF documents
- 📊 **Document Analysis** - Generate outlines and main points
- 🎴 **Flashcard Generation** - Auto-create study cards with citations
- 🧠 **Spaced Repetition** - SM-2 algorithm implementation
- ⚡ **Background Jobs** - Bull queue for async processing
- 🗄️ **PostgreSQL** - Persistent data storage
- 📡 **SSE** - Real-time job progress updates

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **TypeScript** - Type-safe development
- **TypeORM** - ORM for PostgreSQL
- **Bull** - Redis-based queue
- **PostgreSQL** - Primary database
- **Redis** - Queue and caching
- **pdf-parse** - PDF text extraction

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Database

Create a PostgreSQL database:

```bash
createdb insight_extract
```

Or using psql:

```sql
CREATE DATABASE insight_extract;
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=insight_extract
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using Homebrew on macOS
brew services start redis
```

### 5. Run the Application

Development mode:

```bash
npm run start:dev
```

Production mode:

```bash
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

## Using Docker Compose (Recommended)

The easiest way to run the backend with all dependencies:

```bash
cd backend
docker-compose up -d
```

This starts:

- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000

## API Endpoints

### Documents

- `POST /api/documents` - Upload PDF or create text document
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/outline` - Get document outline
- `GET /api/documents/:id/decks` - Get document flashcard decks
- `POST /api/documents/:id/generate` - Generate flashcards
- `DELETE /api/documents/:id` - Delete document

### Decks

- `GET /api/decks/:id` - Get deck details
- `GET /api/decks/:id/cards` - Get all cards in deck
- `DELETE /api/decks/:id` - Delete deck

### Cards

- `GET /api/cards/:id` - Get card details
- `PATCH /api/cards/:id` - Update card
- `POST /api/cards/:id/review` - Submit card review (SRS)
- `DELETE /api/cards/:id` - Delete card

### Jobs

- `GET /api/jobs/:id` - Get job status
- `GET /api/jobs/:id/stream` - SSE stream for job progress

## Example Usage

### Upload a PDF

```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@document.pdf"
```

Response:

```json
{
  "id": "uuid",
  "title": "document.pdf",
  "sourceType": "pdf",
  "status": "processing",
  "createdAt": "2026-01-23T..."
}
```

### Upload Text

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "Your text content here",
    "sourceType": "text"
  }'
```

### Get Document Outline

```bash
curl http://localhost:3000/api/documents/{id}/outline
```

### Review a Card (SRS)

```bash
curl -X POST http://localhost:3000/api/cards/{id}/review \
  -H "Content-Type: application/json" \
  -d '{"quality": 4}'
```

Quality scale (0-5):

- 0: Complete blackout
- 1-2: Incorrect
- 3: Correct with difficulty
- 4: Correct
- 5: Perfect recall

## Database Schema

### Documents

- Stores uploaded PDFs and text
- Tracks processing status
- Contains outline and main points

### Decks

- Groups flashcards by document
- Stores tags

### Cards

- Individual flashcards (QA, Cloze, True/False)
- SM-2 algorithm fields (ease, interval, repetition)
- Due dates for spaced repetition
- Citations from source document

### Jobs

- Tracks background processing tasks
- Stores progress and results

## Development

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

## Architecture

```
┌─────────────────┐
│   Controllers   │  HTTP endpoints
└────────┬────────┘
         │
┌────────▼────────┐
│    Services     │  Business logic
└────────┬────────┘
         │
┌────────▼────────┐
│  Repositories   │  Data access (TypeORM)
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Database
└─────────────────┘

Background Processing:
┌─────────────────┐
│  Bull Queues    │  Async jobs
└────────┬────────┘
         │
┌────────▼────────┐
│   Processors    │  Job handlers
└─────────────────┘
```

## Modules

- **DocumentModule** - Document upload and management
- **DeckModule** - Flashcard deck operations
- **CardModule** - Individual card CRUD and SRS
- **PipelineModule** - Background processing jobs

## Environment Variables

| Variable          | Description     | Default         |
| ----------------- | --------------- | --------------- |
| PORT              | Server port     | 3000            |
| DATABASE_HOST     | PostgreSQL host | localhost       |
| DATABASE_PORT     | PostgreSQL port | 5432            |
| DATABASE_USERNAME | DB username     | postgres        |
| DATABASE_PASSWORD | DB password     | postgres        |
| DATABASE_NAME     | Database name   | insight_extract |
| REDIS_HOST        | Redis host      | localhost       |
| REDIS_PORT        | Redis port      | 6379            |

## Future Enhancements

- [ ] OpenAI integration for real LLM-based extraction
- [ ] pgvector for embeddings and RAG
- [ ] Azure Blob Storage for file persistence
- [ ] Authentication and authorization
- [ ] Multi-tenancy support
- [ ] Advanced analytics and statistics
- [ ] Export to Anki format
- [ ] OCR for scanned PDFs

## Troubleshooting

### Database Connection Failed

- Ensure PostgreSQL is running
- Check credentials in `.env`
- Verify database exists

### Redis Connection Failed

- Ensure Redis is running
- Check Redis host/port in `.env`

### Port Already in Use

- Change PORT in `.env`
- Kill process using port: `lsof -ti:3000 | xargs kill`

## License

See LICENSE file for details.
