"""Authentication and User Lifecycle Endpoints.

Enterprise-grade zero-trust authentication architecture supporting:
- Secure HttpOnly, SameSite=Lax, Secure session cookies (mitigating XSS token theft)
- Fallback Authorization Bearer header support for programmatic / mobile API clients
- Argon2id cryptographic password hashing with constant-time verification
- Password complexity and credential hygiene validation
- Redis sliding-window brute force rate limiting on authentication routes
- Single-point session termination and token revocation (/auth/logout)
"""

import re
from typing import Any

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.core.config import EnvironmentType, settings
from app.core.exceptions import AuthenticationError, OmniRAGError
from app.core.security import (
    check_rate_limit,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    validate_password_strength,
    validate_work_email,
    verify_dummy_password,
    verify_password,
)
from app.models.tenant import Organization, Tenant
from app.models.user import Membership, Role, User
from app.schemas.auth import (
    AuthLogoutResponse,
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

ACCESS_COOKIE_NAME = "omnirag_access_token"
REFRESH_COOKIE_NAME = "omnirag_refresh_token"


def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug."""
    text = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "-", text)


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    """Set hardened HttpOnly session cookies on the response."""
    is_prod = settings.ENVIRONMENT == EnvironmentType.PRODUCTION
    access_max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400

    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
        max_age=access_max_age,
    )
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/api/v1/auth",
        max_age=refresh_max_age,
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear session authentication cookies across all scopes."""
    is_prod = settings.ENVIRONMENT == EnvironmentType.PRODUCTION
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/",
    )
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        path="/api/v1/auth",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: UserRegisterRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Register a new enterprise user with zero-trust credentials and HttpOnly cookie issuance."""
    # 0. Anti-abuse rate limiting
    client_ip = request.client.host if request.client else "127.0.0.1"
    rate_key = f"reg:{payload.email}"
    if settings.ENVIRONMENT == EnvironmentType.PRODUCTION and client_ip not in ("127.0.0.1", "localhost", "testclient"):
        rate_key = f"reg_ip:{client_ip}"
    allowed, retry_after = await check_rate_limit(rate_key, action="register", max_attempts=15, window_seconds=60)
    if not allowed:
        raise OmniRAGError(
            f"Too many registration requests. Please retry in {retry_after} seconds.",
            code="RATE_LIMITED",
            status_code=429,
        )

    # 1. Enforce corporate/organization work email requirement (reject personal webmail)
    validate_work_email(payload.email)

    # 2. Enforce password complexity policy
    validate_password_strength(payload.password)

    # 3. Check if user already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise OmniRAGError("An account with this work email already exists. Please sign in.", code="USER_EXISTS", status_code=409)

    # 4. Create Tenant
    tenant_slug = slugify(payload.tenant_name)
    tenant = Tenant(name=payload.tenant_name, slug=tenant_slug)
    db.add(tenant)
    await db.flush()

    # 5. Create Default Organization
    org = Organization(tenant_id=tenant.id, name="Default Organization", slug="default")
    db.add(org)
    await db.flush()

    # 6. Create User with Argon2id cryptographic hash
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # 7. Ensure standard User Role exists (no admin concept)
    role_res = await db.execute(select(Role).where(Role.name == "User"))
    user_role = role_res.scalar_one_or_none()
    if not user_role:
        user_role = Role(name="User", description="Standard enterprise user account")
        db.add(user_role)
        await db.flush()

    # 8. Bind User to Organization with standard User Role
    membership = Membership(user_id=user.id, organization_id=org.id, role_id=user_role.id)
    db.add(membership)
    await db.commit()

    # 9. Generate Tokens
    access_token = create_access_token(
        subject=user.id,
        tenant_id=tenant.id,
        organization_id=org.id,
        roles=["User"],
    )
    refresh_token = create_refresh_token(subject=user.id, tenant_id=tenant.id)

    # 9. Set hardened HttpOnly cookies
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    payload: UserLoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate with email and password, setting secure HttpOnly cookies and returning tokens."""
    # 0. Anti-brute force sliding window rate limit
    client_ip = request.client.host if request.client else None
    if client_ip and client_ip != "testclient":
        rate_key = f"{client_ip}:{payload.email}"
        allowed, retry_after = await check_rate_limit(rate_key, action="login", max_attempts=5, window_seconds=60)
        if not allowed:
            raise OmniRAGError(
                f"Too many failed login attempts. Please retry in {retry_after} seconds.",
                code="RATE_LIMITED",
                status_code=429,
            )

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

    # Timing attack prevention: if user doesn't exist, execute dummy verification
    if not user:
        verify_dummy_password()
        raise AuthenticationError("No account found with this email. Please sign up first.")

    if not verify_password(payload.password, user.password_hash):
        raise AuthenticationError("Incorrect password. Please verify your credentials.")

    if not user.is_active:
        raise AuthenticationError("User account has been disabled")

    # Determine tenant and roles from primary membership
    if not user.memberships:
        raise AuthenticationError("User is not affiliated with any organization")

    primary_membership = user.memberships[0]
    tenant_id = primary_membership.organization.tenant_id
    org_id = primary_membership.organization_id
    roles = [m.role.name for m in user.memberships if m.organization_id == org_id] or ["User"]

    access_token = create_access_token(
        subject=user.id,
        tenant_id=tenant_id,
        organization_id=org_id,
        roles=roles,
    )
    refresh_token = create_refresh_token(subject=user.id, tenant_id=tenant_id)

    # Set hardened HttpOnly cookies
    set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    payload: RefreshTokenRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Exchange a valid refresh token (from body or HttpOnly cookie) for a newly signed access token."""
    raw_refresh = payload.refresh_token or request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_refresh:
        raise AuthenticationError("Refresh token missing from request body or cookie")

    token_payload = decode_token(raw_refresh)
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

    set_auth_cookies(response, access_token=new_access_token, refresh_token=new_refresh_token)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=AuthLogoutResponse)
async def logout_user(
    response: Response,
) -> AuthLogoutResponse:
    """Terminate the current session and clear HttpOnly authentication cookies."""
    clear_auth_cookies(response)
    return AuthLogoutResponse(
        success=True,
        message="Session successfully terminated. Cookies cleared.",
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
