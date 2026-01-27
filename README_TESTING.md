# Testing Guide for InsightExtract

This document describes the testing setup and how to run tests for the InsightExtract application.

## Overview

The project includes comprehensive integration tests for both backend and frontend components, designed to work in CI/CD pipelines.

## Backend Testing

### Prerequisites

1. **Test Database**: PostgreSQL database for testing
2. **Redis**: Redis server for background tasks
3. **Python Dependencies**: Install test dependencies

```bash
cd backend
pip install pytest pytest-asyncio pytest-cov httpx
```

### Running Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html --cov-report=term

# Run specific test file
pytest tests/test_documents_api.py

# Run specific test
pytest tests/test_documents_api.py::test_extract_text_from_pdf

# Run with verbose output
pytest -v

# Run and stop on first failure
pytest -x
```

### Test Database Setup

Create a test database:

```bash
createdb insightextract_test
```

Set the test database URL in your environment:

```bash
export TEST_DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/insightextract_test"
```

### Test Structure

```
backend/tests/
├── __init__.py
├── conftest.py              # Pytest fixtures and configuration
├── test_documents_api.py    # Document API endpoint tests
├── test_decks_api.py        # Deck and card API tests
└── test_health.py          # Health check tests
```

### Test Coverage

The tests cover:

- ✅ PDF text extraction
- ✅ Document text analysis
- ✅ Summary document creation and retrieval
- ✅ Flashcard CSV creation
- ✅ Deck management (CRUD operations)
- ✅ Card management (CRUD operations)
- ✅ Card review and SRS updates
- ✅ Document deletion
- ✅ Health check endpoints

## Frontend Testing

### Prerequisites

```bash
npm install
```

### Running Frontend Tests

```bash
# Run type checking
npm run type-check

# Run linter
npm run lint

# Build (validates compilation)
npm run build
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. **Backend Tests**: Runs all backend integration tests with PostgreSQL and Redis
2. **Frontend Tests**: Runs linting, type checking, and builds
3. **Integration Tests**: Tests the full stack together
4. **Docker Build**: Validates Docker images can be built

### Required GitHub Secrets

Configure these secrets in your GitHub repository:

- `OPENAI_API_KEY`: Your OpenAI API key for testing

### Running CI Locally

You can run similar tests locally using Docker Compose:

```bash
# Start services
docker-compose up -d postgres redis

# Run backend tests
cd backend
export TEST_DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/insightextract_test"
export REDIS_URL="redis://localhost:6379"
pytest

# Stop services
docker-compose down
```

## Writing New Tests

### Backend Test Example

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_my_endpoint(client: AsyncClient):
    """Test description."""
    response = await client.get("/api/my-endpoint")

    assert response.status_code == 200
    data = response.json()
    assert "expected_field" in data
```

### Using Fixtures

Available fixtures in `conftest.py`:

- `client`: Async HTTP client with database session
- `db_session`: Async database session
- `sample_pdf_content`: Minimal valid PDF for testing
- `sample_text`: Sample text for analysis

## Test Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Database is automatically cleaned after each test
3. **Meaningful Names**: Use descriptive test names
4. **Documentation**: Add docstrings to test functions
5. **Assertions**: Use clear, specific assertions
6. **Coverage**: Aim for >80% code coverage

## Debugging Tests

### Run with detailed output

```bash
pytest -vv --tb=long
```

### Run with print statements

```bash
pytest -s
```

### Run specific markers

```bash
pytest -m integration
pytest -m "not slow"
```

## Continuous Integration

The CI pipeline runs automatically on:

- Push to `main` or `dev` branches
- Pull requests to `main` or `dev` branches

View test results in the GitHub Actions tab of your repository.

## Test Maintenance

- Update tests when API changes
- Add tests for new features
- Remove tests for deprecated features
- Keep test dependencies up to date

## Troubleshooting

### Database connection errors

Ensure PostgreSQL is running and test database exists:

```bash
psql -l | grep insightextract_test
```

### Redis connection errors

Ensure Redis is running:

```bash
redis-cli ping
```

### Import errors

Ensure you're in the correct directory and dependencies are installed:

```bash
cd backend
pip install -r requirements.txt
```

### Async test errors

Make sure `pytest-asyncio` is installed:

```bash
pip install pytest-asyncio
```

## Additional Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio documentation](https://pytest-asyncio.readthedocs.io/)
- [HTTPX documentation](https://www.python-httpx.org/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
