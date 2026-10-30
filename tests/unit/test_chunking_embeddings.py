"""Unit Tests for Phase 7: Chunking Engine and Embedding Infrastructure."""

import math
import fitz
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base
from app.models.document import Document, DocumentChunk, DocumentVersion
from app.models.job import IngestionJob, IngestionStage
from app.models.tenant import Organization, Tenant
from app.services.chunking import HierarchicalChunker
from app.services.embeddings import MockEmbeddingProvider, get_embedding_provider
from app.services.ingestion.pipeline import IngestionPipelineRunner
from app.services.parser import parse_document_content
from app.services.storage import get_storage_backend


def test_mock_embedding_provider():
    provider = MockEmbeddingProvider(dimension=1536)
    assert provider.dimension == 1536
    assert provider.model_name == "mock-embed-v1"

    # Deterministic generation
    vec1 = provider._generate_vector("enterprise retrieval augmented generation")
    vec2 = provider._generate_vector("enterprise retrieval augmented generation")
    assert vec1 == vec2
    assert len(vec1) == 1536

    # Unit-norm check: sum(v_i^2) ~= 1.0
    magnitude = math.sqrt(sum(x * x for x in vec1))
    assert pytest.approx(magnitude, 0.001) == 1.0


def test_hierarchical_chunking_parent_child():
    # Build a sample document with large paragraph and a table
    text_content = (
        "# System Architecture\n\n"
        "OmniRAG integrates hybrid retrieval with dense vector indexing and BM25 sparse search. "
        "The reciprocal rank fusion module merges disparate candidate pools without score calibration issues. "
        "Cross-encoder reranking provides fine-grained semantic relevance scoring across top candidates. "
        "Every retrieved chunk is verified against document-level access control permissions before generation."
    )
    canonical = parse_document_content(text_content.encode("utf-8"), "doc.md", "text/markdown")

    chunker = HierarchicalChunker(parent_max_tokens=400, child_max_tokens=25)
    chunks = chunker.chunk(canonical, tenant_id="tenant-1", version_id="ver-1")

    assert len(chunks) > 1
    # Check parent-child relation
    child_chunks = [c for c in chunks if c.parent_chunk_id is not None]
    parent_chunks = [c for c in chunks if c.parent_chunk_id is None]

    assert len(parent_chunks) >= 1
    assert len(child_chunks) >= 1
    # Ensure child references existing parent
    parent_ids = {p.chunk_id for p in parent_chunks}
    for child in child_chunks:
        assert child.parent_chunk_id in parent_ids


@pytest.mark.asyncio
async def test_pipeline_populates_chunks_in_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        # Seed Tenant & Org
        tenant = Tenant(name="ChunkTenant", slug="chunk-tenant")
        session.add(tenant)
        await session.flush()

        org = Organization(tenant_id=tenant.id, name="ChunkOrg", slug="chunk-org")
        session.add(org)
        await session.flush()

        # Create valid PDF
        doc_pdf = fitz.open()
        p = doc_pdf.new_page()
        p.insert_text((50, 72), "OmniRAG Automated Chunking and Indexing Verification.")
        p.insert_text((50, 120), "This is an enterprise document containing detailed system specifications for ingestion.")
        pdf_bytes = doc_pdf.tobytes()
        doc_pdf.close()

        storage = get_storage_backend()
        storage_key = f"{tenant.id}/{org.id}/doc.pdf"
        uri = await storage.put_object(storage_key, pdf_bytes, "application/pdf")

        doc = Document(
            organization_id=org.id,
            filename="doc.pdf",
            mime_type="application/pdf",
            storage_uri=uri,
            sha256_checksum="chunktestsha256",
            file_size_bytes=len(pdf_bytes),
            status="UPLOADED",
        )
        session.add(doc)
        await session.flush()

        version = DocumentVersion(document_id=doc.id, version_number=1)
        session.add(version)
        await session.flush()

        job = IngestionJob(document_id=doc.id)
        session.add(job)
        await session.commit()

        # Run pipeline
        runner = IngestionPipelineRunner(session)
        res_job = await runner.execute_pipeline(job.id)

        assert res_job.status == IngestionStage.COMPLETED.value
        assert doc.status == "INDEXED"

        # Verify chunks saved to database
        chunk_res = await session.execute(
            select(DocumentChunk).where(DocumentChunk.version_id == version.id)
        )
        saved_chunks = chunk_res.scalars().all()
        assert len(saved_chunks) >= 1
        assert "OmniRAG Automated Chunking and Indexing Verification" in saved_chunks[0].section_heading
        assert "enterprise document containing detailed system specifications" in saved_chunks[0].raw_text

    await engine.dispose()
