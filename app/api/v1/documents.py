"""Document Ingestion and Lifecycle Management API."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_roles, verify_tenant_boundary
from app.core.exceptions import (
    DocumentNotFoundError,
    DuplicateDocumentError,
    OmniRAGError,
)
from app.models.document import Document, DocumentPermission, DocumentVersion
from app.models.tenant import Organization
from app.schemas.document import (
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentPermissionUpdateRequest,
    DocumentUploadResponse,
)
from app.services.ingestion.validator import calculate_sha256, detect_mime_type
from app.services.storage import get_storage_backend

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    organization_id: str | None = Query(None, description="Target organization ID"),
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(require_roles(["Owner", "Admin", "Member"])),
) -> DocumentUploadResponse:
    """Upload a document, validate MIME magic bytes, compute SHA-256, and store in blob storage."""
    target_org_id = organization_id or current_user.get("organization_id")
    if not target_org_id:
        raise OmniRAGError("Organization ID must be provided", code="MISSING_ORGANIZATION", status_code=400)

    # Verify organization exists in tenant
    org_res = await db.execute(
        select(Organization).where(
            Organization.id == target_org_id, Organization.tenant_id == tenant_id
        )
    )
    if not org_res.scalar_one_or_none():
        raise OmniRAGError("Organization not found in this tenant", code="ORG_NOT_FOUND", status_code=404)

    content = await file.read()
    filename = file.filename or "uploaded_file"

    # Validate file size and MIME type
    mime_type = detect_mime_type(filename, content)
    sha256 = calculate_sha256(content)

    # Check for duplicate document in this organization
    dup_res = await db.execute(
        select(Document).where(
            Document.organization_id == target_org_id, Document.sha256_checksum == sha256
        )
    )
    existing_doc = dup_res.scalar_one_or_none()
    if existing_doc:
        raise DuplicateDocumentError(sha256, existing_doc.id)

    # Persist file in Object Storage
    storage = get_storage_backend()
    storage_key = f"{tenant_id}/{target_org_id}/{sha256}/{filename}"
    storage_uri = await storage.put_object(storage_key, content, mime_type)

    # Insert Document record into database
    doc = Document(
        organization_id=target_org_id,
        created_by_user_id=current_user["user_id"],
        filename=filename,
        mime_type=mime_type,
        storage_uri=storage_uri,
        sha256_checksum=sha256,
        file_size_bytes=len(content),
        status="UPLOADED",
    )
    db.add(doc)
    await db.flush()

    # Create initial Document Version (v1)
    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        total_pages=0,
        total_chunks=0,
    )
    db.add(version)
    await db.commit()

    return DocumentUploadResponse(
        document_id=doc.id,
        organization_id=doc.organization_id,
        filename=doc.filename,
        mime_type=doc.mime_type,
        sha256_checksum=doc.sha256_checksum,
        file_size_bytes=doc.file_size_bytes,
        status=doc.status,
        storage_uri=doc.storage_uri,
        created_at=doc.created_at,
    )


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    organization_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> DocumentListResponse:
    """List documents for the current tenant/organization with pagination."""
    target_org_id = organization_id or current_user.get("organization_id")

    base_query = (
        select(Document)
        .join(Organization, Document.organization_id == Organization.id)
        .where(Organization.tenant_id == tenant_id)
    )
    if target_org_id:
        base_query = base_query.where(Document.organization_id == target_org_id)

    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total_count = (await db.execute(count_query)).scalar_one()

    # Query page
    items_query = (
        base_query.order_by(Document.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    docs = (await db.execute(items_query)).scalars().all()

    return DocumentListResponse(
        items=[DocumentDetailResponse.model_validate(d) for d in docs],
        total_count=total_count,
        page=page,
        page_size=page_size,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document_detail(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> DocumentDetailResponse:
    """Retrieve document metadata and status."""
    stmt = (
        select(Document)
        .join(Organization, Document.organization_id == Organization.id)
        .where(Document.id == document_id, Organization.tenant_id == tenant_id)
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise DocumentNotFoundError(document_id)

    return DocumentDetailResponse.model_validate(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(require_roles(["Owner", "Admin"])),
) -> None:
    """Delete a document and remove its stored object."""
    stmt = (
        select(Document)
        .join(Organization, Document.organization_id == Organization.id)
        .where(Document.id == document_id, Organization.tenant_id == tenant_id)
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise DocumentNotFoundError(document_id)

    storage = get_storage_backend()
    clean_key = doc.storage_uri.replace("file://", "").replace("s3://", "")
    await storage.delete_object(clean_key)

    await db.delete(doc)
    await db.commit()


@router.post("/{document_id}/permissions", status_code=status.HTTP_200_OK)
async def update_document_permission(
    document_id: str,
    payload: DocumentPermissionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(require_roles(["Owner", "Admin"])),
) -> dict[str, str]:
    """Configure granular ACL on a specific document."""
    stmt = (
        select(Document)
        .join(Organization, Document.organization_id == Organization.id)
        .where(Document.id == document_id, Organization.tenant_id == tenant_id)
    )
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise DocumentNotFoundError(document_id)

    perm = DocumentPermission(
        document_id=doc.id,
        user_id=payload.user_id,
        role_name=payload.role_name,
        permission_level=payload.permission_level,
    )
    db.add(perm)
    await db.commit()

    return {"status": "success", "message": "Document permissions updated successfully"}
