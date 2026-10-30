"""FastAPI Dependency Injection Providers for Database, Auth, and Multi-Tenancy."""

from collections.abc import AsyncGenerator
from typing import Any

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db_session
from app.core.exceptions import AuthenticationError, AuthorizationError, TenantMismatchError
from app.core.security import decode_token
from app.models.tenant import Organization, Tenant
from app.models.user import Membership, Role, User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield database session."""
    async for session in get_db_session():
        yield session


async def get_current_user(
    auth_creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Extract, decode, and validate the current authenticated user context."""
    if not auth_creds:
        raise AuthenticationError("Authorization header is missing or invalid")

    token_payload = decode_token(auth_creds.credentials)
    user_id = token_payload.get("sub")
    tenant_id = token_payload.get("tenant_id")
    org_id = token_payload.get("org_id")
    roles = token_payload.get("roles", ["Member"])

    if not user_id or not tenant_id:
        raise AuthenticationError("Malformed token payload")

    # Fetch user from database to ensure still active
    stmt = (
        select(User)
        .where(User.id == user_id, User.is_active.is_(True))
        .options(selectinload(User.memberships).selectinload(Membership.role))
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User does not exist or has been deactivated")

    return {
        "user": user,
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "tenant_id": tenant_id,
        "organization_id": org_id,
        "roles": roles,
    }


def require_roles(allowed_roles: list[str]):
    """Enforces that the authenticated user possesses at least one of the allowed roles."""

    async def role_checker(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_roles = current_user.get("roles", [])
        if "Owner" in user_roles or "Admin" in user_roles:
            return current_user

        if not any(role in allowed_roles for role in user_roles):
            raise AuthorizationError(
                f"Insufficient permissions. Required one of: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


async def verify_tenant_boundary(
    x_tenant_id: str | None = Header(None, alias="X-Tenant-ID"),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> str:
    """Ensures X-Tenant-ID header matches the authenticated user's token tenant ID."""
    token_tenant_id = current_user["tenant_id"]
    if x_tenant_id and x_tenant_id != token_tenant_id:
        raise TenantMismatchError(
            f"Tenant context mismatch: header '{x_tenant_id}' does not match token '{token_tenant_id}'"
        )
    return token_tenant_id
