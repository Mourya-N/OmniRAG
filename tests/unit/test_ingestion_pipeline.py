"""Unit and Integration Tests for Phase 5: Asynchronous Ingestion Pipeline."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.core.database import Base
from app.main import app
from app.models.document import Document
from app.models.job import IngestionJob, IngestionStage
from app.services.ingestion.pipeline import IngestionPipelineRunner
from app.services.storage import get_storage_backend


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


@pytest.mark.asyncio
async def test_pipeline_runner_success(test_db_session: AsyncSession):
    # Store dummy file in local storage
    storage = get_storage_backend()
    storage_key = "test_tenant/test_org/test_doc.pdf"
    uri = await storage.put_object(storage_key, b"%PDF-1.4 sample content", "application/pdf")

    # Create document
    doc = Document(
        organization_id="org-test",
        filename="test_doc.pdf",
        mime_type="application/pdf",
        storage_uri=uri,
        sha256_checksum="abcdef1234567890",
        file_size_bytes=22,
        status="UPLOADED",
    )
    test_db_session.add(doc)
    await test_db_session.flush()

    job = IngestionJob(
        document_id=doc.id,
        status=IngestionStage.UPLOADED.value,
        progress_percent=0,
        current_stage=IngestionStage.UPLOADED.value,
    )
    test_db_session.add(job)
    await test_db_session.commit()

    runner = IngestionPipelineRunner(test_db_session)
    completed_job = await runner.execute_pipeline(job.id)

    assert completed_job.status == IngestionStage.COMPLETED.value
    assert completed_job.progress_percent == 100
    assert completed_job.completed_at is not None
    assert doc.status == "INDEXED"


@pytest.mark.asyncio
async def test_pipeline_reprocess_api_flow(client: AsyncClient):
    # Register user
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "pipeline.lead@enterprise.ai",
            "password": "SecurePassword123!",
            "full_name": "Pipeline Lead",
            "tenant_name": "PipelineCorp",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    org_id = me_resp.json()["organization_id"]
    tenant_id = me_resp.json()["tenant_id"]
    auth_headers = {**headers, "X-Tenant-ID": tenant_id}

    # Upload document
    pdf_content = b"%PDF-1.4\nTest document for reprocess endpoint"
    files = {"file": ("manual.pdf", pdf_content, "application/pdf")}
    upload_resp = await client.post(
        f"/api/v1/documents/upload?organization_id={org_id}",
        headers=auth_headers,
        files=files,
    )
    doc_id = upload_resp.json()["document_id"]

    # Trigger reprocess
    reprocess_resp = await client.post(
        f"/api/v1/documents/{doc_id}/reprocess", headers=auth_headers
    )
    assert reprocess_resp.status_code == 202
    job_info = reprocess_resp.json()
    assert job_info["status"] == "COMPLETED"
    assert job_info["progress_percent"] == 100

    # Query Status
    status_resp = await client.get(f"/api/v1/documents/{doc_id}/status", headers=auth_headers)
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["document_status"] == "INDEXED"
    assert status_data["latest_job"]["status"] == "COMPLETED"
