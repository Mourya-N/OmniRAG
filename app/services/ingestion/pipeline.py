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
from app.models.document import Document, DocumentChunk, DocumentVersion
from app.models.job import IngestionJob, IngestionStage
from app.models.tenant import Organization
from app.services.chunking import HierarchicalChunker
from app.services.embeddings import get_embedding_provider
from app.services.parser.registry import parse_document_content
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
            canonical_doc = parse_document_content(
                content=raw_bytes,
                filename=doc.filename,
                mime_type=doc.mime_type,
                document_id=doc.id,
            )

            # Update document version metadata with extracted structural metrics
            ver_stmt = (
                select(DocumentVersion)
                .where(DocumentVersion.document_id == doc.id)
                .order_by(DocumentVersion.version_number.desc())
            )
            ver_res = await self.db.execute(ver_stmt)
            latest_version = ver_res.scalars().first()
            if latest_version:
                latest_version.total_pages = canonical_doc.total_pages
                latest_version.metadata_json = canonical_doc.metadata
                await self.db.flush()

            # Stage 3: EXTRACTING
            await self.update_job_stage(job, IngestionStage.EXTRACTING)

            # Stage 4: CHUNKING
            await self.update_job_stage(job, IngestionStage.CHUNKING)
            # Fetch tenant_id via organization
            org_stmt = select(Organization).where(Organization.id == doc.organization_id)
            org_res = await self.db.execute(org_stmt)
            org = org_res.scalar_one_or_none()
            tenant_id = org.tenant_id if org else "default"

            chunker = HierarchicalChunker()
            chunk_payloads = chunker.chunk(
                canonical_doc=canonical_doc,
                tenant_id=tenant_id,
                version_id=latest_version.id if latest_version else "v1",
            )

            # Stage 5: EMBEDDING
            await self.update_job_stage(job, IngestionStage.EMBEDDING)
            embedder = get_embedding_provider()
            texts_to_embed = [c.raw_text for c in chunk_payloads]
            embeddings = await embedder.embed_documents(texts_to_embed)

            # Stage 6: INDEXING
            await self.update_job_stage(job, IngestionStage.INDEXING)
            # Persist chunks into database
            if latest_version:
                latest_version.total_chunks = len(chunk_payloads)

            for payload, vector in zip(chunk_payloads, embeddings, strict=False):
                db_chunk = DocumentChunk(
                    id=payload.chunk_id,
                    version_id=latest_version.id if latest_version else "v1",
                    parent_chunk_id=payload.parent_chunk_id,
                    chunk_index=payload.chunk_index,
                    content_type=payload.content_type,
                    raw_text=payload.raw_text,
                    page_number=payload.page_number,
                    section_heading=payload.section_heading,
                    bounding_box_json=payload.bounding_box.model_dump() if payload.bounding_box else None,
                    qdrant_point_id=payload.chunk_id,
                    token_count=payload.token_count,
                )
                self.db.add(db_chunk)

            await self.db.flush()

            # Update document status and complete job
            doc.status = "INDEXED"
            await self.update_job_stage(job, IngestionStage.COMPLETED)
            return job

        except Exception as e:
            logger.error("ingestion_pipeline_failed", job_id=job.id, error=str(e))
            doc.status = "FAILED"
            await self.update_job_stage(job, IngestionStage.FAILED, str(e))
            return job
