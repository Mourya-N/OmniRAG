"""Distributed Celery Tasks for Document Ingestion and Reindexing."""

import asyncio

from app.core.database import AsyncSessionLocal
from app.core.logging import get_logger
from app.services.ingestion.pipeline import IngestionPipelineRunner
from app.workers.celery_app import celery_app

logger = get_logger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_document_task(self, job_id: str) -> dict[str, str]:
    """Execute asynchronous document ingestion pipeline inside a Celery worker."""
    logger.info("celery_task_started", task_id=self.request.id, job_id=job_id)

    async def _run():
        async with AsyncSessionLocal() as session:
            runner = IngestionPipelineRunner(session)
            job = await runner.execute_pipeline(job_id)
            return {"job_id": job.id, "status": job.status}

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import nest_asyncio

            nest_asyncio.apply()
            return loop.run_until_complete(_run())
        return asyncio.run(_run())
    except Exception as exc:
        logger.error("celery_task_error", job_id=job_id, error=str(exc))
        raise self.retry(exc=exc)

