"""Unit and Integration Tests for Phase 17: RAG Evaluation and Benchmarking."""

from pathlib import Path
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.core.database import Base
from app.main import app
from app.services.evaluation.metrics import (
    calculate_mrr,
    calculate_ndcg_at_k,
    calculate_precision_at_k,
    calculate_recall_at_k,
    estimate_query_cost_usd,
)
from evaluation.run_evaluation import run_benchmark_on_dataset


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


def test_metric_formulas():
    gold = {"doc-1", "doc-2"}
    retrieved = ["doc-1", "doc-3", "doc-2", "doc-4"]

    # Recall@2: only doc-1 in top-2 -> 1/2 = 0.5
    assert calculate_recall_at_k(retrieved, gold, k=2) == 0.5
    # Recall@3: doc-1 and doc-2 in top-3 -> 2/2 = 1.0
    assert calculate_recall_at_k(retrieved, gold, k=3) == 1.0

    # Precision@2: doc-1 in top-2 -> 1/2 = 0.5
    assert calculate_precision_at_k(retrieved, gold, k=2) == 0.5

    # MRR: first hit is at rank 1 -> 1.0
    assert calculate_mrr(retrieved, gold) == 1.0

    # NDCG@10
    ndcg = calculate_ndcg_at_k(retrieved, gold, k=10)
    assert 0.8 <= ndcg <= 1.0

    # Cost calculation: 10,000 prompt tokens + 2,000 completion tokens
    cost = estimate_query_cost_usd(10000, 2000)
    assert cost > 0.0


def test_benchmark_runner_execution():
    dataset_path = Path("evaluation/datasets/golden_qa.json")
    res = run_benchmark_on_dataset(dataset_path)

    metrics = res["metrics"]
    assert metrics["sample_count"] >= 4
    assert metrics["recall_at_5"] >= 0.88
    assert metrics["mrr"] >= 0.85
    assert metrics["abstention_accuracy"] == 1.0
    assert "OmniRAG Benchmark Evaluation Report" in res["report_markdown"]


@pytest.mark.asyncio
async def test_evaluation_api_endpoint(client: AsyncClient):
    # Register owner
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "eval.lead@enterprise.ai",
            "password": "SecurePassword123!",
            "full_name": "Evaluation Director",
            "tenant_name": "EvalCorp",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    tenant_id = me_resp.json()["tenant_id"]
    auth_headers = {**headers, "X-Tenant-ID": tenant_id}

    # Trigger evaluation run
    eval_resp = await client.post("/api/v1/evaluation/run", headers=auth_headers)
    assert eval_resp.status_code == 201
    eval_data = eval_resp.json()
    assert "run_id" in eval_data
    assert eval_data["metrics"]["recall_at_5"] >= 0.88
    assert "PASSED" in eval_data["report_markdown"]
