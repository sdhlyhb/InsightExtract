#!/bin/bash
set -e

echo "🚀 Starting InsightExtract services..."

# Start the FastAPI application only
# Worker will be started separately via docker-compose
echo "🌐 Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
echo "🌐 Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
