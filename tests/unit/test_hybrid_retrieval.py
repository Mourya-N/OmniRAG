"""Unit and Integration Tests for Phase 9 & 10: BM25, Hybrid Fusion (RRF), and Neural Reranking."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.api.v1.search import global_bm25_retriever
from app.core.database import Base
from app.main import app
from app.services.embeddings.mock import MockEmbeddingProvider
from app.services.reranking.cross_encoder import CrossEncoderReranker
from app.services.retrieval.bm25 import BM25Retriever
from app.services.retrieval.hybrid import HybridRetriever, reciprocal_rank_fusion
from app.services.vector_store.qdrant import QdrantVectorStore
from app.services.vector_store.schema import ScoredChunk, VectorPoint


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


def test_bm25_retriever():
    bm25 = BM25Retriever()
    tenant_id = "tenant-1"
    chunks = [
        {
            "chunk_id": "c1",
            "document_id": "d1",
            "raw_text": "PostgreSQL relational database with ACID transactions and schema migrations.",
            "page_number": 1,
        },
        {
            "chunk_id": "c2",
            "document_id": "d1",
            "raw_text": "Qdrant vector engine for high dimensional dense similarity search.",
            "page_number": 2,
        },
        {
            "chunk_id": "c3",
            "document_id": "d2",
            "raw_text": "Redis caching and Celery asynchronous background task queue.",
            "page_number": 1,
        },
    ]

    bm25.index_chunks(tenant_id, chunks)

    # Search for vector engine
    hits = bm25.search(tenant_id=tenant_id, query="vector similarity engine", top_k=5)
    assert len(hits) >= 1
    assert hits[0].chunk_id == "c2"
    assert "Qdrant vector engine" in hits[0].raw_text

    # Search for non-existent keyword
    empty_hits = bm25.search(tenant_id=tenant_id, query="quantum cryptography", top_k=5)
    assert len(empty_hits) == 0

    # Cross-tenant query returns nothing
    other_tenant_hits = bm25.search(tenant_id="tenant-other", query="PostgreSQL", top_k=5)
    assert len(other_tenant_hits) == 0


def test_reciprocal_rank_fusion_math():
    dense_results = [
        ScoredChunk(chunk_id="c1", document_id="d1", tenant_id="t1", score=0.95, raw_text="Doc 1", page_number=1),
        ScoredChunk(chunk_id="c2", document_id="d1", tenant_id="t1", score=0.85, raw_text="Doc 2", page_number=1),
    ]
    sparse_results = [
        ScoredChunk(chunk_id="c2", document_id="d1", tenant_id="t1", score=12.5, raw_text="Doc 2", page_number=1),
        ScoredChunk(chunk_id="c3", document_id="d1", tenant_id="t1", score=10.1, raw_text="Doc 3", page_number=1),
    ]

    fused_chunks, diagnostics = reciprocal_rank_fusion(
        dense_results=dense_results,
        sparse_results=sparse_results,
        k=60,
        top_k=5,
    )

    # c2 appeared in both ranks (dense rank 2, sparse rank 1):
    # RRF score for c2: (1 / (60 + 2)) + (1 / (60 + 1)) = (1/62) + (1/61) = 0.016129 + 0.016393 = 0.03252
    # RRF score for c1: (1 / (60 + 1)) = 0.016393
    # Therefore c2 MUST be ranked #1
    assert len(fused_chunks) == 3
    assert fused_chunks[0].chunk_id == "c2"
    assert fused_chunks[0].score > fused_chunks[1].score

    # Check diagnostics
    diag_c2 = next(d for d in diagnostics if d.chunk_id == "c2")
    assert diag_c2.dense_rank == 2
    assert diag_c2.sparse_rank == 1
    assert diag_c2.final_rank == 1


@pytest.mark.asyncio
async def test_cross_encoder_reranker():
    reranker = CrossEncoderReranker()
    query = "asynchronous celery queue redis"

    candidates = [
        ScoredChunk(
            chunk_id="c1",
            document_id="d1",
            tenant_id="t1",
            score=0.01,
            raw_text="The system uses Celery with Redis broker for asynchronous background tasks.",
            page_number=1,
        ),
        ScoredChunk(
            chunk_id="c2",
            document_id="d1",
            tenant_id="t1",
            score=0.02,
            raw_text="PostgreSQL handles relational ACID storage.",
            page_number=1,
        ),
        ScoredChunk(
            chunk_id="c3",
            document_id="d1",
            tenant_id="t1",
            score=0.01,
            raw_text="The system uses Celery with Redis broker for asynchronous background tasks.",  # Exact duplicate
            page_number=1,
        ),
    ]

    reranked = await reranker.rerank(
        query=query,
        candidates=candidates,
        top_k=5,
        score_threshold=0.35,
    )

    # c1 should score highest
    assert len(reranked) >= 1
    assert reranked[0].chunk_id == "c1"
    assert reranked[0].score >= 0.5
    # Duplicate c3 must have been eliminated
    assert not any(r.chunk_id == "c3" for r in reranked)


@pytest.mark.asyncio
async def test_search_api_endpoints(client: AsyncClient):
    # Register user
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "search.architect@enterprise.ai",
            "password": "SecurePassword123!",
            "full_name": "Search Architect",
            "tenant_name": "SearchCorp",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    tenant_id = me_resp.json()["tenant_id"]
    org_id = me_resp.json()["organization_id"]
    auth_headers = {**headers, "X-Tenant-ID": tenant_id}

    # Seed global BM25 retriever for this tenant
    global_bm25_retriever.index_chunks(
        tenant_id=tenant_id,
        chunks=[
            {
                "chunk_id": "c-search-1",
                "document_id": "doc-search-1",
                "organization_id": org_id,
                "raw_text": "OmniRAG enterprise multimodal retrieval and reasoning platform.",
                "page_number": 1,
            }
        ],
    )

    # 1. Test BM25 Search Endpoint
    bm25_resp = await client.post(
        "/api/v1/search/bm25",
        headers=auth_headers,
        json={"query": "multimodal retrieval", "top_k": 5},
    )
    assert bm25_resp.status_code == 200
    bm25_data = bm25_resp.json()
    assert bm25_data["total_hits"] == 1
    assert bm25_data["hits"][0]["chunk_id"] == "c-search-1"

    # 2. Test Hybrid Search Endpoint
    hybrid_resp = await client.post(
        "/api/v1/search/hybrid",
        headers=auth_headers,
        json={"query": "multimodal retrieval", "top_k": 5, "enable_reranking": True},
    )
    assert hybrid_resp.status_code == 200
    hybrid_data = hybrid_resp.json()
    assert hybrid_data["retrieval_strategy"] in ("hybrid_rrf", "hybrid_rrf_neural_reranked")
