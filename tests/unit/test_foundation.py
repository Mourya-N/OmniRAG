"""Unit tests verifying Phase 2: Project Foundation, Configuration, and System Health."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.exceptions import (
    AuthenticationError,
    DocumentNotFoundError,
    FileSizeLimitExceededError,
    OmniRAGError,
)
from app.main import app


def test_settings_initialization():
    """Verify settings defaults and property calculations."""
    test_settings = Settings(
        PROJECT_NAME="Test OmniRAG",
        POSTGRES_USER="test_user",
        POSTGRES_PASSWORD="test_password",
        POSTGRES_SERVER="db.internal",
        POSTGRES_PORT=5433,
        POSTGRES_DB="test_db",
    )
    assert test_settings.PROJECT_NAME == "Test OmniRAG"
    assert "postgresql+asyncpg://test_user:test_password@db.internal:5433/test_db" in test_settings.async_database_uri


def test_custom_exception_hierarchy():
    """Verify domain exceptions carry correct HTTP status codes and error payloads."""
    doc_err = DocumentNotFoundError("doc-123")
    assert isinstance(doc_err, OmniRAGError)
    assert doc_err.status_code == 404
    assert doc_err.code == "DOCUMENT_NOT_FOUND"
    assert doc_err.details["document_id"] == "doc-123"

    auth_err = AuthenticationError("Invalid signature")
    assert auth_err.status_code == 401
    assert auth_err.code == "UNAUTHENTICATED"

    size_err = FileSizeLimitExceededError(file_size=2000, max_size=1000)
    assert size_err.status_code == 413
    assert size_err.details["file_size"] == 2000


@pytest.mark.asyncio
async def test_health_and_readiness_endpoints():
    """Verify FastAPI application liveness/readiness probes and timing middleware."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Test Health
        health_resp = await client.get("/api/v1/system/health")
        assert health_resp.status_code == 200
        health_data = health_resp.json()
        assert health_data["status"] == "healthy"
        assert "X-Request-ID" in health_resp.headers
        assert "X-Process-Time-MS" in health_resp.headers

        # Test Readiness
        ready_resp = await client.get("/api/v1/system/readiness")
        assert ready_resp.status_code == 200
        ready_data = ready_resp.json()
        assert ready_data["status"] == "ready"

