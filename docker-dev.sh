#!/bin/bash
# Helper script to manage the root docker-compose from any directory

# Auto-detect project root (directory containing this script)
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "Error: docker-compose.yml not found at $COMPOSE_FILE"
    exit 1
fi

docker compose -f "$COMPOSE_FILE" "$@"
