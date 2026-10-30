"""Pydantic v2 schemas for Document Ingestion and Management."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DocumentUploadResponse(BaseModel):
    """Response returned upon successful file upload and registration."""

    document_id: str
    organization_id: str
    filename: str
    mime_type: str
    sha256_checksum: str
    file_size_bytes: int
    status: str
    storage_uri: str
    created_at: datetime


class DocumentDetailResponse(BaseModel):
    """Detailed view of a document including its versions and permissions."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    filename: str
    mime_type: str
    sha256_checksum: str
    file_size_bytes: int
    status: str
    storage_uri: str
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    """Paginated list of organization documents."""

    items: list[DocumentDetailResponse]
    total_count: int
    page: int
    page_size: int


class DocumentPermissionUpdateRequest(BaseModel):
    """Payload to grant or update document permissions."""

    user_id: str | None = None
    role_name: str | None = None
    permission_level: str = Field(
        default="read",
        description="Access level: 'read', 'write', or 'admin'",
    )

