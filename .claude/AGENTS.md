# AGENTS Guidelines for InsightExtract

This repository contains a full-stack application with a React + Vite frontend and FastAPI backend, orchestrated with Docker Compose. When working on the project interactively with an agent (e.g. GitHub Copilot), please follow the guidelines below for an optimal development experience.

## 1. Use Docker Compose for Local Development

- **Always use `./docker-dev.sh up -d` or `docker compose up -d`** to start all services (frontend, backend, PostgreSQL, Redis, worker).
- **Use `./docker-dev.sh ps`** to check service status.
- **Use `./docker-dev.sh logs -f [service]`** to view logs (e.g., `./docker-dev.sh logs -f api`).
- **Do _not_ run `docker compose build` repeatedly** unless code changes require rebuilding. Use `./docker-dev.sh restart [service]` for faster iteration.

## 2. Development Workflow

### Frontend Development (React + Vite)

- **For faster iteration**, run frontend outside Docker: `npm run dev` (with hot reload at http://localhost:5173)
- Frontend files: `src/` directory
- TypeScript compilation: `npm run build` checks types but is handled by Docker in production
- API calls use centralized client: `src/api/client.ts` and `src/api/endpoints.ts`

### Backend Development (FastAPI)

- **Backend runs in Docker** at http://localhost:8000
- For local development without Docker:
  ```bash
  cd backend
  source venv/bin/activate  # or create: python -m venv venv
  uvicorn app.main:app --reload --port 8000
  ```
- API documentation: http://localhost:8000/docs
- OpenAPI spec: `openapi.json` (auto-generated, commit when API changes)

### Database & Services

- **PostgreSQL**: Runs in Docker (port 5432)
- **Redis**: Runs in Docker (port 6379)
- **Worker**: Background job processor (Arq) runs in Docker
- **Never manually modify database** - use Alembic migrations: `alembic upgrade head`

## 3. Testing Before Commits

Always run tests before committing:

```bash
# Backend tests (22 integration tests)
cd backend
pytest tests/ -v

# Frontend tests
npm run test

# Linting
npm run lint

# Type checking
tsc --noEmit
```

## 4. Coding Conventions

### Frontend

- **TypeScript required** for all new components and utilities (`.tsx`/`.ts`)
- Use Tailwind CSS for styling (mobile-first responsive: `sm:`, `md:`, `lg:`)
- Centralize API calls in `src/api/endpoints.ts`
- Use React Query hooks from `src/hooks/useApi.ts`
- Component structure: `src/components/` for reusable, `src/pages/` for routes

### Backend

- **Async/await** for all database and external calls
- Use dependency injection for database sessions
- Follow FastAPI router pattern in `app/routers/`
- Add type hints to all functions
- Document endpoints with docstrings (appears in OpenAPI)
- Background jobs go in `worker.py` using Arq

### Database

- SQLAlchemy async models in `app/models/`
- Always use migrations for schema changes
- Test with both SQLite (tests) and PostgreSQL (production)

## 5. Environment Configuration

- **Copy `.env.example` to `.env`** before first run
- Required: `OPENAI_API_KEY` for AI summarization
- Frontend env: `VITE_API_BASE_URL` (default: http://localhost:8000/api)
- Backend env: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`

## 6. Useful Commands Reference

### Docker Management

| Command                         | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `./docker-dev.sh up -d`         | Start all services in background               |
| `./docker-dev.sh down`          | Stop all services                              |
| `./docker-dev.sh ps`            | Check service status                           |
| `./docker-dev.sh logs -f api`   | View API logs (Ctrl+C to exit)                 |
| `./docker-dev.sh restart api`   | Restart specific service                       |
| `./docker-dev.sh up -d --build` | Rebuild and restart (after Dockerfile changes) |

### Development

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start frontend dev server with HMR (port 5173) |
| `npm run build`        | Build frontend for production                  |
| `npm run lint`         | Run ESLint checks                              |
| `npm run test`         | Run frontend tests (Vitest)                    |
| `cd backend && pytest` | Run backend integration tests                  |
| `tsc --noEmit`         | TypeScript type checking (no output)           |

### API & Database

| Command                                   | Purpose                      |
| ----------------------------------------- | ---------------------------- |
| `curl http://localhost:8000/health`       | Check backend health         |
| `curl http://localhost:8000/openapi.json` | Export OpenAPI specification |
| `cd backend && alembic upgrade head`      | Run database migrations      |
| `cd backend && alembic revision -m "msg"` | Create new migration         |

## 7. Common Issues & Solutions

### Port Already in Use

```bash
./docker-dev.sh down
docker ps -a | grep insightextract | awk '{print $1}' | xargs docker stop
docker ps -a | grep insightextract | awk '{print $1}' | xargs docker rm
./docker-dev.sh up -d
```

### Frontend Not Updating

- If using Docker: `./docker-dev.sh restart frontend`
- If using npm: Restart `npm run dev`

### Backend Not Reflecting Changes

- Python code: `./docker-dev.sh restart api` (auto-reload enabled)
- Requirements changed: `./docker-dev.sh up -d --build api`
- Database schema: Run Alembic migration

### TypeScript Errors

- Run `npm install` to ensure dependencies are current
- Check `tsconfig.json` for strict mode settings
- Use type assertions when necessary: `as Type`

### Test Failures

- Ensure Docker services are running: `./docker-dev.sh ps`
- Check environment variables in `.env`
- For OpenAI tests: Set `OPENAI_API_KEY` or skip with pytest markers

## 8. File Structure Quick Reference

```
InsightExtract/
├── src/                      # Frontend React application
│   ├── api/                  # API client & endpoints (centralized)
│   ├── components/           # Reusable UI components
│   ├── pages/                # Route components
│   ├── hooks/                # React Query hooks
│   └── types/                # TypeScript type definitions
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── routers/          # API endpoints (documents, decks, cards)
│   │   ├── models/           # SQLAlchemy models
│   │   ├── services/         # Business logic
│   │   └── main.py           # FastAPI app entry point
│   ├── tests/                # Integration tests (pytest)
│   ├── worker.py             # Background job worker (Arq)
│   └── alembic/              # Database migrations
├── docker-compose.yml        # Orchestrates all services
├── docker-dev.sh             # Helper script for Docker commands
├── Dockerfile                # Frontend container (multi-stage)
├── backend/Dockerfile        # Backend container
├── nginx.conf                # Nginx config for frontend
├── openapi.json              # API specification (OpenAPI 3.1.0)
├── AGENTS.md                 # AI development documentation
└── SETUP.md                  # Setup guide for new users
```

## 9. Best Practices for Agent Sessions

1. **Always check service status** before making changes: `./docker-dev.sh ps`
2. **Run tests after changes**: `pytest` for backend, `npm test` for frontend
3. **Keep OpenAPI spec updated**: Export after API changes with `curl http://localhost:8000/openapi.json > openapi.json`
4. **Use MCP tools when available**: Pylance for Python validation, Context7 for documentation
5. **Commit atomically**: One feature per commit with descriptive messages
6. **Update tests alongside code**: Maintain 50%+ coverage
7. **Document new endpoints**: Add docstrings that appear in OpenAPI docs

## 10. AI-Assisted Development Tips

- **Use specific prompts**: Include tech stack (FastAPI, React Query, SQLAlchemy, Tailwind)
- **Request tests**: Ask for tests alongside implementation
- **Verify generated code**: Always run tests and type checks
- **Leverage MCP**: Use Pylance for syntax validation, Context7 for library docs
- **Iterate incrementally**: Build features step-by-step, test each step

---

Following these practices ensures smooth agent-assisted development while maintaining code quality and system stability. When in doubt, check logs with `./docker-dev.sh logs -f` and restart services rather than rebuilding from scratch.
