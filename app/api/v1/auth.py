"""Authentication and User Lifecycle Endpoints."""

import re
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.exceptions import AuthenticationError, OmniRAGError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.tenant import Organization, Tenant
from app.models.user import Membership, Role, User
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug."""
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", text)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new enterprise user, bootstrap their tenant, organization, and assign Owner role."""
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise OmniRAGError("User with this email already exists", code="USER_EXISTS", status_code=409)

    # 1. Create Tenant
    tenant_slug = slugify(payload.tenant_name)
    tenant = Tenant(name=payload.tenant_name, slug=tenant_slug)
    db.add(tenant)
    await db.flush()

    # 2. Create Default Organization
    org = Organization(tenant_id=tenant.id, name="Default Organization", slug="default")
    db.add(org)
    await db.flush()

    # 3. Create User
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # 4. Ensure Owner Role exists
    role_res = await db.execute(select(Role).where(Role.name == "Owner"))
    owner_role = role_res.scalar_one_or_none()
    if not owner_role:
        owner_role = Role(name="Owner", description="Full administrative owner of organization")
        db.add(owner_role)
        await db.flush()

    # 5. Bind User to Organization with Owner Role
    membership = Membership(user_id=user.id, organization_id=org.id, role_id=owner_role.id)
    db.add(membership)
    await db.commit()

    # 6. Generate Tokens
    access_token = create_access_token(
        subject=user.id,
        tenant_id=tenant.id,
        organization_id=org.id,
        roles=["Owner"],
    )
    refresh_token = create_refresh_token(subject=user.id, tenant_id=tenant.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with email and password, returning JWT access and refresh tokens."""
    stmt = (
        select(User)
        .where(User.email == payload.email)
        .options(
            selectinload(User.memberships).selectinload(Membership.organization),
            selectinload(User.memberships).selectinload(Membership.role),
        )
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise AuthenticationError("Invalid email or password")

    if not user.is_active:
        raise AuthenticationError("User account has been disabled")

    # Determine tenant and roles from primary membership
    if not user.memberships:
        raise AuthenticationError("User is not affiliated with any organization")

    primary_membership = user.memberships[0]
    tenant_id = primary_membership.organization.tenant_id
    org_id = primary_membership.organization_id
    roles = [m.role.name for m in user.memberships if m.organization_id == org_id]

    access_token = create_access_token(
        subject=user.id,
        tenant_id=tenant_id,
        organization_id=org_id,
        roles=roles,
    )
    refresh_token = create_refresh_token(subject=user.id, tenant_id=tenant_id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange a valid refresh token for a newly signed access token."""
    token_payload = decode_token(payload.refresh_token)
    if token_payload.get("type") != "refresh":
        raise AuthenticationError("Invalid token type. Refresh token required")

    user_id = token_payload.get("sub")
    tenant_id = token_payload.get("tenant_id")

    stmt = (
        select(User)
        .where(User.id == user_id, User.is_active.is_(True))
        .options(
            selectinload(User.memberships).selectinload(Membership.organization),
            selectinload(User.memberships).selectinload(Membership.role),
        )
    )
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User session no longer valid")

    # Match primary membership in the given tenant
    membership = next(
        (m for m in user.memberships if m.organization.tenant_id == tenant_id),
        user.memberships[0] if user.memberships else None,
    )
    org_id = membership.organization_id if membership else None
    roles = [membership.role.name] if membership else ["Member"]

    new_access_token = create_access_token(
        subject=user.id,
        tenant_id=tenant_id,
        organization_id=org_id,
        roles=roles,
    )
    new_refresh_token = create_refresh_token(subject=user.id, tenant_id=tenant_id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> UserProfileResponse:
    """Retrieve profile of the currently authenticated user."""
    user = current_user["user"]
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        tenant_id=current_user["tenant_id"],
        organization_id=current_user.get("organization_id"),
        roles=current_user.get("roles", []),
    )

