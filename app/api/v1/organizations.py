"""Organization & Membership Management API."""

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_roles, verify_tenant_boundary
from app.core.exceptions import AuthorizationError, OmniRAGError
from app.models.tenant import Organization
from app.models.user import Membership, Role, User
from app.schemas.auth import (
    MemberAssignRoleRequest,
    OrganizationCreateRequest,
    OrganizationResponse,
)

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.post("/", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrganizationCreateRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(require_roles(["Owner", "Admin"])),
) -> OrganizationResponse:
    """Create a new Organization in the current tenant."""
    # Check slug within tenant
    existing = await db.execute(
        select(Organization).where(
            Organization.tenant_id == tenant_id, Organization.slug == payload.slug
        )
    )
    if existing.scalar_one_or_none():
        raise OmniRAGError(
            "An organization with this slug already exists in this tenant",
            code="ORGANIZATION_EXISTS",
            status_code=409,
        )

    org = Organization(tenant_id=tenant_id, name=payload.name, slug=payload.slug)
    db.add(org)
    await db.flush()

    # Automatically grant creator Owner role on the new org
    role_res = await db.execute(select(Role).where(Role.name == "Owner"))
    owner_role = role_res.scalar_one_or_none()
    if not owner_role:
        owner_role = Role(name="Owner", description="Owner")
        db.add(owner_role)
        await db.flush()

    membership = Membership(
        user_id=current_user["user_id"],
        organization_id=org.id,
        role_id=owner_role.id,
    )
    db.add(membership)
    await db.commit()

    return OrganizationResponse.model_validate(org)


@router.get("/", response_model=list[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[OrganizationResponse]:
    """List all organizations belonging to the current tenant."""
    stmt = select(Organization).where(Organization.tenant_id == tenant_id)
    res = await db.execute(stmt)
    orgs = res.scalars().all()
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.post("/{org_id}/members", status_code=status.HTTP_200_OK)
async def assign_member_role(
    org_id: str,
    payload: MemberAssignRoleRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(require_roles(["Owner", "Admin"])),
) -> dict[str, str]:
    """Assign or update a user's role in an organization."""
    # Verify organization belongs to tenant
    org_res = await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.tenant_id == tenant_id)
    )
    if not org_res.scalar_one_or_none():
        raise OmniRAGError("Organization not found in this tenant", code="ORG_NOT_FOUND", status_code=404)

    # Find target user
    user_res = await db.execute(select(User).where(User.email == payload.user_email))
    target_user = user_res.scalar_one_or_none()
    if not target_user:
        raise OmniRAGError("User not found", code="USER_NOT_FOUND", status_code=404)

    # Find requested role
    role_res = await db.execute(select(Role).where(Role.name == payload.role_name))
    role = role_res.scalar_one_or_none()
    if not role:
        role = Role(name=payload.role_name, description=f"{payload.role_name} role")
        db.add(role)
        await db.flush()

    # Upsert membership
    mem_res = await db.execute(
        select(Membership).where(
            Membership.user_id == target_user.id, Membership.organization_id == org_id
        )
    )
    membership = mem_res.scalar_one_or_none()
    if membership:
        membership.role_id = role.id
    else:
        membership = Membership(user_id=target_user.id, organization_id=org_id, role_id=role.id)
        db.add(membership)

    await db.commit()
    return {"status": "success", "message": f"Role '{payload.role_name}' assigned to {payload.user_email}"}

