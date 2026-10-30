"""Unit and Integration Tests for Phase 11: Grounded RAG Generation and Citation Validation."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.api.v1.search import global_bm25_retriever
from app.core.database import Base
from app.main import app
from app.models.conversation import Citation, Conversation, Message
from app.models.document import Document, DocumentChunk, DocumentVersion
from app.services.generation import MockLLMProvider
from app.services.vector_store.schema import ScoredChunk
from app.services.verification import CitationValidator


@pytest_asyncio.fixture(scope="function")
async def test_db_session():
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await test_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(test_db_session):
    async def override_get_db():
        yield test_db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def test_citation_validator_valid_and_phantom():
    validator = CitationValidator()
    chunks = [
        ScoredChunk(chunk_id="chunk-1", document_id="doc-1", tenant_id="t1", score=0.9, raw_text="ACID compliance guaranteed.", page_number=1),
        ScoredChunk(chunk_id="chunk-2", document_id="doc-1", tenant_id="t1", score=0.8, raw_text="Multi-tenant isolation enforced.", page_number=2),
    ]

    # Valid answer citing chunk-1
    answer_valid = "PostgreSQL ensures database safety [chunk-1]."
    report = validator.validate_citations(answer_valid, chunks)
    assert report.is_grounded is True
    assert report.citation_accuracy_score == 1.0
    assert len(report.phantom_citations) == 0

    # Answer citing hallucinated phantom chunk
    answer_phantom = "The system uses blockchain consensus [chunk-fake-999]."
    report_phantom = validator.validate_citations(answer_phantom, chunks)
    assert report_phantom.is_grounded is False
    assert "chunk-fake-999" in report_phantom.phantom_citations


@pytest.mark.asyncio
async def test_mock_llm_provider_generation_and_abstention():
    llm = MockLLMProvider()
    chunks = [
        ScoredChunk(chunk_id="c-alpha", document_id="d1", tenant_id="t1", score=0.92, raw_text="High availability failover in 5 seconds.", page_number=4),
    ]

    # 1. Answer with evidence
    grounded = await llm.generate_grounded_answer("What is the failover time?", chunks)
    assert grounded.has_abstained is False
    assert "[c-alpha]" in grounded.answer_text
    assert len(grounded.citations) == 1
    assert grounded.citations[0].chunk_id == "c-alpha"

    # 2. Answer without evidence (Abstention)
    abstain_ans = await llm.generate_grounded_answer("What is quantum computing?", [])
    assert abstain_ans.has_abstained is True
    assert "cannot find sufficient evidence" in abstain_ans.answer_text.lower()


@pytest.mark.asyncio
async def test_full_rag_chat_api_lifecycle(client: AsyncClient, test_db_session: AsyncSession):
    # 1. Register User & Org
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "rag.engineer@enterprise.ai",
            "password": "SecurePassword123!",
            "full_name": "RAG Engineer",
            "tenant_name": "RAGEnterprise",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    tenant_id = me_resp.json()["tenant_id"]
    org_id = me_resp.json()["organization_id"]
    auth_headers = {**headers, "X-Tenant-ID": tenant_id}

    # 2. Insert Document, Version, and Chunk into DB
    doc = Document(
        organization_id=org_id,
        filename="system_spec.pdf",
        mime_type="application/pdf",
        storage_uri="file:///dummy/path",
        sha256_checksum="ragsha256test",
        file_size_bytes=1024,
        status="INDEXED",
    )
    test_db_session.add(doc)
    await test_db_session.flush()

    ver = DocumentVersion(document_id=doc.id, version_number=1, total_pages=1, total_chunks=1)
    test_db_session.add(ver)
    await test_db_session.flush()

    chunk_id = "chunk-rag-spec-01"
    chunk_text = "OmniRAG implements hybrid retrieval combining dense Qdrant vectors and BM25 sparse search."
    chunk = DocumentChunk(
        id=chunk_id,
        version_id=ver.id,
        chunk_index=0,
        content_type="text",
        raw_text=chunk_text,
        page_number=1,
        section_heading="Retrieval Specs",
        token_count=15,
    )
    test_db_session.add(chunk)
    await test_db_session.commit()

    # Seed BM25 index for tenant
    global_bm25_retriever.index_chunks(
        tenant_id=tenant_id,
        chunks=[
            {
                "chunk_id": chunk_id,
                "document_id": doc.id,
                "organization_id": org_id,
                "raw_text": chunk_text,
                "page_number": 1,
            }
        ],
    )

    # 3. Call RAG Chat Endpoint
    chat_resp = await client.post(
        "/api/v1/rag/chat",
        headers=auth_headers,
        json={"query": "How does OmniRAG retrieval work?"},
    )
    assert chat_resp.status_code == 200
    rag_data = chat_resp.json()

    assert rag_data["has_abstained"] is False
    assert rag_data["confidence_score"] >= 0.90
    assert len(rag_data["citations"]) >= 1
    assert rag_data["citations"][0]["chunk_id"] == chunk_id
    assert rag_data["verification"]["is_grounded"] is True

    conv_id = rag_data["conversation_id"]
    assert conv_id is not None

    # Verify Database Persistence
    conv_check = await test_db_session.execute(
        select(Conversation).where(Conversation.id == conv_id)
    )
    assert conv_check.scalar_one_or_none() is not None

    cits_check = await test_db_session.execute(select(Citation))
    assert len(cits_check.scalars().all()) >= 1

