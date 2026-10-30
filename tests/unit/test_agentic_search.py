"""Unit and Integration Tests for Phase 13 & 14: Query Intelligence and Agentic Search."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.api.v1.search import global_bm25_retriever
from app.core.database import Base
from app.main import app
from app.services.agent import (
    AgenticSearchOrchestrator,
    QueryIntent,
    QueryRouter,
)


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


def test_query_router_intent_classification():
    router = QueryRouter()

    # Table / Numeric
    c1 = router.classify_and_route("What was the total revenue in Q3?")
    assert c1.intent == QueryIntent.TABLE_NUMERIC

    # Comparison
    c2 = router.classify_and_route("Compare PostgreSQL versus Qdrant architecture")
    assert c2.intent == QueryIntent.COMPARISON
    assert len(c2.sub_queries) >= 2

    # Multi-hop / Conjunction
    c3 = router.classify_and_route("How does chunking work and why did we choose hierarchical parent-child?")
    assert c3.intent == QueryIntent.MULTI_HOP
    assert len(c3.sub_queries) >= 2

    # Direct factual
    c4 = router.classify_and_route("What is the token limit for JWT?")
    assert c4.intent == QueryIntent.DIRECT_RETRIEVAL
    assert len(c4.sub_queries) == 1


@pytest.mark.asyncio
async def test_agentic_search_orchestration():
    orchestrator = AgenticSearchOrchestrator()
    tenant_id = "agent-tenant"

    # Seed BM25 index with multi-hop information
    global_bm25_retriever.index_chunks(
        tenant_id=tenant_id,
        chunks=[
            {
                "chunk_id": "chunk-ingest",
                "document_id": "doc-arch",
                "raw_text": "The ingestion pipeline extracts layout-aware blocks, bounding boxes, and tables.",
                "page_number": 1,
            },
            {
                "chunk_id": "chunk-retrieval",
                "document_id": "doc-arch",
                "raw_text": "The hybrid retrieval engine combines dense vectors and BM25 using Reciprocal Rank Fusion.",
                "page_number": 2,
            },
        ],
    )

    query = "Explain how ingestion works and how hybrid retrieval is implemented"
    result = await orchestrator.execute_agentic_query(query=query, tenant_id=tenant_id)

    assert result.intent == QueryIntent.MULTI_HOP.value
    assert result.total_steps >= 4
    assert len(result.reasoning_trail) >= 4
    assert result.has_abstained is False
    assert len(result.citations) >= 1
    assert result.total_duration_ms > 0.0


@pytest.mark.asyncio
async def test_agent_query_api_endpoint(client: AsyncClient):
    # Register user
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "agent.lead@enterprise.ai",
            "password": "SecurePassword123!",
            "full_name": "Agent Lead",
            "tenant_name": "AgentCorp",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    tenant_id = me_resp.json()["tenant_id"]
    org_id = me_resp.json()["organization_id"]
    auth_headers = {**headers, "X-Tenant-ID": tenant_id}

    # Seed BM25 index
    global_bm25_retriever.index_chunks(
        tenant_id=tenant_id,
        chunks=[
            {
                "chunk_id": "c-rag-1",
                "document_id": "d-rag-1",
                "organization_id": org_id,
                "raw_text": "OmniRAG enforces bounded agent execution with maximum step and tool call budgets.",
                "page_number": 1,
            }
        ],
    )

    # Call agent endpoint
    agent_resp = await client.post(
        "/api/v1/agent/query",
        headers=auth_headers,
        json={"query": "Explain how agent execution bounds and tool calls are handled"},
    )
    assert agent_resp.status_code == 200
    data = agent_resp.json()
    assert data["total_steps"] >= 3
    assert len(data["reasoning_trail"]) >= 3
    assert data["confidence_score"] >= 0.90
    assert len(data["citations"]) >= 1

