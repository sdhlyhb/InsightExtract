#!/usr/bin/env python3
"""Arq worker for background task processing."""
import sys
import logging
from arq.worker import run_worker
from arq.connections import RedisSettings

from app.config import get_settings
from app.tasks.pipeline import generate_flashcards_task

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()


class WorkerSettings:
    """Arq worker settings."""
    functions = [generate_flashcards_task]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    job_timeout = 600  # 10 minutes
    max_jobs = 10
    log_results = True
    keep_result = 3600  # Keep results for 1 hour


if __name__ == "__main__":
    logger.info("🚀 Starting Arq worker...")
    logger.info(f"📡 Redis: {settings.redis_url}")
    logger.info(f"📋 Functions: {[f.__name__ for f in WorkerSettings.functions]}")
    
    try:
        # run_worker is a sync function that manages its own event loop
        run_worker(WorkerSettings)
    except Exception as e:
        logger.error(f"❌ Worker failed to start: {e}", exc_info=True)
        sys.exit(1)
