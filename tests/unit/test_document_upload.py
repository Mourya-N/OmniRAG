"""Unit and Integration Tests for Phase 4: Document Upload, Validation & Object Storage."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.core.database import Base
from app.core.exceptions import FileSizeLimitExceededError, UnsupportedMediaTypeError
from app.main import app
from app.services.ingestion.validator import calculate_sha256, detect_mime_type
from app.services.storage.local import LocalStorageBackend


# SQLite in-memory test database fixture
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


def test_mime_detection_and_checksum():
    pdf_bytes = b"%PDF-1.4\n%test pdf content"
    assert detect_mime_type("doc.pdf", pdf_bytes) == "application/pdf"

    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    assert detect_mime_type("image.png", png_bytes) == "image/png"

    txt_bytes = b"Hello Enterprise RAG platform"
    assert detect_mime_type("notes.txt", txt_bytes) == "text/plain"

    md_bytes = b"# Enterprise Knowledge Architecture"
    assert detect_mime_type("spec.md", md_bytes) == "text/markdown"

    sha = calculate_sha256(pdf_bytes)
    assert len(sha) == 64
    assert calculate_sha256(pdf_bytes) == sha


@pytest.mark.asyncio
async def test_local_storage_backend(tmp_path):
    storage = LocalStorageBackend(base_dir=tmp_path)
    data = b"Sample document contents for object storage"
    key = "tenant_1/org_1/sample.txt"

    uri = await storage.put_object(key, data, "text/plain")
    assert uri.startswith("file://")

    retrieved = await storage.get_object(key)
    assert retrieved == data

    deleted = await storage.delete_object(key)
    assert deleted is True

    with pytest.raises(FileNotFoundError):
        await storage.get_object(key)


@pytest.mark.asyncio
async def test_document_upload_api_flow(client: AsyncClient):
    # 1. Register User to get Tenant & Org
    reg_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "doc.admin@enterprise.ai",
            "password": "SecurePassword123!",
            "full_name": "Document Admin",
            "tenant_name": "DocCorp",
        },
    )
    assert reg_resp.status_code == 201
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    org_id = me_resp.json()["organization_id"]
    tenant_id = me_resp.json()["tenant_id"]
    auth_headers = {**headers, "X-Tenant-ID": tenant_id}

    # 2. Upload Document
    pdf_content = b"%PDF-1.7\nSample technical report for multimodal retrieval indexing."
    files = {"file": ("report.pdf", pdf_content, "application/pdf")}

    upload_resp = await client.post(
        f"/api/v1/documents/upload?organization_id={org_id}",
        headers=auth_headers,
        files=files,
    )
    assert upload_resp.status_code == 201
    doc_data = upload_resp.json()
    doc_id = doc_data["document_id"]
    assert doc_data["filename"] == "report.pdf"
    assert doc_data["mime_type"] == "application/pdf"
    assert doc_data["status"] == "UPLOADED"

    # 3. Duplicate Upload within same Org should fail with 409
    dup_files = {"file": ("report_copy.pdf", pdf_content, "application/pdf")}
    dup_resp = await client.post(
        f"/api/v1/documents/upload?organization_id={org_id}",
        headers=auth_headers,
        files=dup_files,
    )
    assert dup_resp.status_code == 409

    # 4. List Documents
    list_resp = await client.get(
        f"/api/v1/documents/?organization_id={org_id}", headers=auth_headers
    )
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total_count"] == 1
    assert list_data["items"][0]["id"] == doc_id

    # 5. Get Document Details
    detail_resp = await client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == doc_id

    # 6. Update Document Permissions (ACL)
    perm_resp = await client.post(
        f"/api/v1/documents/{doc_id}/permissions",
        headers=auth_headers,
        json={"role_name": "Viewer", "permission_level": "read"},
    )
    assert perm_resp.status_code == 200

    # 7. Delete Document
    del_resp = await client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verify not found after deletion
    after_del = await client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
    assert after_del.status_code == 404
