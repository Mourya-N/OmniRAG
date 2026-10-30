"""Enterprise Cryptography, Authentication Tokens, and Access Control Evaluator."""

from datetime import datetime, timedelta, timezone
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import AuthenticationError, TokenExpiredError

# Production-grade Argon2id hasher configuration
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _ph.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash with constant-time comparison."""
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False


def create_access_token(
    subject: str,
    tenant_id: str,
    organization_id: str | None = None,
    roles: list[str] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a cryptographically signed JWT access token."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict[str, Any] = {
        "sub": subject,
        "tenant_id": tenant_id,
        "org_id": organization_id,
        "roles": roles or ["Member"],
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str, tenant_id: str) -> str:
    """Generate a long-lived JWT refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": subject,
        "tenant_id": tenant_id,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate signature and expiry of a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError("Access token has expired") from None
    except JWTError:
        raise AuthenticationError("Could not validate credentials token") from None


def check_document_access(
    user_id: str,
    user_roles: list[str],
    document_permissions: list[dict[str, Any]],
    required_permission: str = "read",
) -> bool:
    """Evaluates Document-Level Access Control (ABAC/RBAC).

    Rules:
    1. If document has no explicit permissions, default access is granted to organization members.
    2. If user_id matches an explicit permission with sufficient privilege, grant.
    3. If any user role matches an explicit permission with sufficient privilege, grant.
    4. If 'Owner' or 'Admin' in user_roles, grant.
    """
    if "Owner" in user_roles or "Admin" in user_roles:
        return True

    if not document_permissions:
        return True  # Default open to organization members

    perm_weights = {"read": 1, "write": 2, "admin": 3}
    required_weight = perm_weights.get(required_permission, 1)

    for perm in document_permissions:
        assigned_level = perm.get("permission_level", "read")
        assigned_weight = perm_weights.get(assigned_level, 1)
        if assigned_weight < required_weight:
            continue

        if perm.get("user_id") == user_id:
            return True
        if perm.get("role_name") in user_roles:
            return True

    return False
