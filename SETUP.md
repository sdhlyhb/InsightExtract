# Setup Guide for New Contributors

## Prerequisites

Before you begin, ensure you have installed:

- **Docker Desktop** (includes Docker Compose)
  - Mac: https://docs.docker.com/desktop/install/mac-install/
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - Linux: https://docs.docker.com/desktop/install/linux-install/
- **Git**
- **OpenAI API Key** - Get one at https://platform.openai.com/api-keys

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/sdhlyhb/InsightExtract.git
cd InsightExtract
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
# On Mac/Linux:
nano .env

# On Windows:
notepad .env
```

**Important:** Replace `your-openai-api-key-here` with your actual OpenAI API key.

### 3. Start the Application

```bash
# Make the helper script executable (Mac/Linux only)
chmod +x docker-dev.sh

# Start all services
./docker-dev.sh up -d

# Or use docker compose directly
docker compose up -d
```

### 4. Wait for Services to Start

The first time you run this, Docker will:

- Download base images (Node.js, Python, PostgreSQL, Redis, Nginx)
- Build the frontend and backend
- This may take 5-10 minutes depending on your internet speed

### 5. Access the Application

Once all containers are running:

- **Frontend**: http://localhost
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

## Managing the Application

### Check Status

```bash
./docker-dev.sh ps
```

### View Logs

```bash
# All services
./docker-dev.sh logs -f

# Specific service
./docker-dev.sh logs -f api
./docker-dev.sh logs -f frontend
./docker-dev.sh logs -f worker
```

### Restart a Service

```bash
./docker-dev.sh restart api
./docker-dev.sh restart frontend
```

### Stop All Services

```bash
./docker-dev.sh down
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
./docker-dev.sh up -d --build

# Or rebuild specific service
./docker-dev.sh up -d --build api
```

## Development Workflow

### Frontend Development

For faster frontend development, you can run the frontend outside Docker:

```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Frontend will be available at http://localhost:5173
```

### Backend Development

The backend can also run outside Docker:

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start only database services
docker compose up -d postgres redis

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload --port 8000

# In another terminal, start worker
python worker.py
```

## Troubleshooting

### Port Already in Use

If you see "port is already allocated" error:

```bash
# Stop all containers
./docker-dev.sh down

# Or if that doesn't work, manually stop containers
docker ps -a | grep -E "insightextract|backend" | awk '{print $1}' | xargs docker stop
docker ps -a | grep -E "insightextract|backend" | awk '{print $1}' | xargs docker rm

# Then start again
./docker-dev.sh up -d
```

### Container Keeps Restarting

```bash
# Check logs for the problematic service
./docker-dev.sh logs api

# Common issues:
# - Missing OPENAI_API_KEY in .env
# - Database not ready (wait a bit longer)
# - File permission issues on Linux
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
./docker-dev.sh down -v
./docker-dev.sh up -d
```

### Build Fails

```bash
# Clean build
./docker-dev.sh down
docker system prune -a --volumes
./docker-dev.sh up -d --build
```

## Running Tests

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
npm run test
```

### Integration Tests

```bash
cd backend
pytest tests/integration/
```

## Project Structure

```
InsightExtract/
├── backend/              # FastAPI backend
│   ├── app/              # Application code
│   ├── tests/            # Backend tests
│   ├── Dockerfile        # Backend container
│   └── requirements.txt  # Python dependencies
├── src/                  # React frontend
├── Dockerfile            # Frontend container (Nginx)
├── nginx.conf            # Nginx configuration
├── docker-compose.yml    # Docker orchestration
├── docker-dev.sh         # Helper script
├── .env.example          # Environment template
└── README.md             # Main documentation
```

## Need Help?

- Check the main [README.md](./README.md)
- View API documentation at http://localhost:8000/docs
- Check logs: `./docker-dev.sh logs -f`
- Open an issue on GitHub

## Contributing

See [README_TESTING.md](./README_TESTING.md) for testing guidelines before submitting PRs.
