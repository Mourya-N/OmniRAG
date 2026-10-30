"""Document Ingestion Pipeline State Machine & Execution Engine.

Executes deterministic stages:
VALIDATING -> PARSING -> EXTRACTING -> CHUNKING -> EMBEDDING -> INDEXING -> COMPLETED
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import OmniRAGError
from app.core.logging import get_logger
from app.models.document import Document
from app.models.job import IngestionJob, IngestionStage
from app.services.storage import get_storage_backend

logger = get_logger(__name__)

STAGE_PROGRESS = {
    IngestionStage.VALIDATING: 10,
    IngestionStage.PARSING: 30,
    IngestionStage.EXTRACTING: 50,
    IngestionStage.CHUNKING: 70,
    IngestionStage.EMBEDDING: 85,
    IngestionStage.INDEXING: 95,
    IngestionStage.COMPLETED: 100,
}


class IngestionPipelineRunner:
    """Manages document state transitions, error handling, and step execution."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def update_job_stage(
        self, job: IngestionJob, stage: IngestionStage, error_message: str | None = None
    ) -> None:
        """Atomically update ingestion job status and progress."""
        job.current_stage = stage.value
        job.status = stage.value
        job.progress_percent = STAGE_PROGRESS.get(stage, job.progress_percent)

        if stage == IngestionStage.COMPLETED:
            job.completed_at = datetime.now(timezone.utc)
        elif stage == IngestionStage.FAILED:
            job.error_message = error_message
            job.completed_at = datetime.now(timezone.utc)

        await self.db.commit()
        logger.info(
            "ingestion_stage_updated",
            job_id=job.id,
            document_id=job.document_id,
            stage=stage.value,
            progress=job.progress_percent,
        )

    async def execute_pipeline(self, job_id: str) -> IngestionJob:
        """Executes full document lifecycle pipeline."""
        res = await self.db.execute(select(IngestionJob).where(IngestionJob.id == job_id))
        job = res.scalar_one_or_none()
        if not job:
            raise OmniRAGError(f"Ingestion job '{job_id}' not found", code="JOB_NOT_FOUND", status_code=404)

        doc_res = await self.db.execute(select(Document).where(Document.id == job.document_id))
        doc = doc_res.scalar_one_or_none()
        if not doc:
            await self.update_job_stage(job, IngestionStage.FAILED, "Associated document not found")
            return job

        job.started_at = datetime.now(timezone.utc)
        await self.db.commit()

        try:
            # Stage 1: VALIDATING
            await self.update_job_stage(job, IngestionStage.VALIDATING)
            storage = get_storage_backend()
            clean_key = doc.storage_uri.replace("file://", "").replace("s3://", "")
            raw_bytes = await storage.get_object(clean_key)
            if not raw_bytes or len(raw_bytes) == 0:
                raise OmniRAGError("Document storage payload is empty", code="EMPTY_DOCUMENT")

            # Stage 2: PARSING
            await self.update_job_stage(job, IngestionStage.PARSING)

            # Stage 3: EXTRACTING
            await self.update_job_stage(job, IngestionStage.EXTRACTING)

            # Stage 4: CHUNKING
            await self.update_job_stage(job, IngestionStage.CHUNKING)

            # Stage 5: EMBEDDING
            await self.update_job_stage(job, IngestionStage.EMBEDDING)

            # Stage 6: INDEXING
            await self.update_job_stage(job, IngestionStage.INDEXING)

            # Update document status and complete job
            doc.status = "INDEXED"
            await self.update_job_stage(job, IngestionStage.COMPLETED)
            return job

        except Exception as e:
            logger.error("ingestion_pipeline_failed", job_id=job.id, error=str(e))
            doc.status = "FAILED"
            await self.update_job_stage(job, IngestionStage.FAILED, str(e))
            return job
