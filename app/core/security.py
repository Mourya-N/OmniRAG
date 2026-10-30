"""Enterprise Cryptography, Authentication Tokens, and Access Control Evaluator."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
import re
import time
from typing import Any

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from jose import JWTError, jwt

from app.core.config import settings
from app.core.exceptions import AuthenticationError, OmniRAGError, TokenExpiredError
from app.core.redis import get_redis_client

# Production-grade Argon2id hasher configuration
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

# Pre-computed dummy hash for timing attack mitigation
_DUMMY_HASH = _ph.hash("dummy_constant_time_mitigation_password_string")

# In-memory sliding window fallback for rate limiting when Redis is unavailable
_memory_rate_limit_store: dict[str, list[float]] = defaultdict(list)

# Disallowed personal, free, and temporary email domains
DISALLOWED_PERSONAL_DOMAINS = {
    # Google
    "gmail.com",
    "googlemail.com",
    # Microsoft
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "passport.com",
    # Yahoo
    "yahoo.com",
    "ymail.com",
    "rocketmail.com",
    "yahoo.co.uk",
    "yahoo.fr",
    "yahoo.in",
    # Apple
    "icloud.com",
    "me.com",
    "mac.com",
    # Generic personal webmail
    "email.com",
    "mail.com",
    "inbox.com",
    "post.com",
    # Privacy / encrypted personal webmail
    "proton.me",
    "protonmail.com",
    "tutanota.com",
    "tuta.io",
    # Regional and other free providers
    "aol.com",
    "aim.com",
    "zoho.com",
    "zohomail.com",
    "gmx.com",
    "gmx.net",
    "yandex.com",
    "yandex.ru",
    "ya.ru",
    "mail.ru",
    "bk.ru",
    "inbox.ru",
    "list.ru",
    "rambler.ru",
    "web.de",
    "freenet.de",
    "t-online.de",
    "fastmail.com",
    "fastmail.fm",
    "hushmail.com",
    "lycos.com",
    # Temporary / disposable mail services
    "mailinator.com",
    "tempmail.com",
    "guerrillamail.com",
    "10minutemail.com",
    "trashmail.com",
    "throwawaymail.com",
    "sharklasers.com",
    "getairmail.com",
    "yopmail.com",
    "dispostable.com",
}


def validate_work_email(email: str) -> None:
    """Validate that the given email is an enterprise or organization work email.

    Rejects personal webmail (gmail.com, outlook.com, email.com, etc.) and disposable domains.
    """
    clean_email = email.strip().lower()
    if "@" not in clean_email:
        raise OmniRAGError(
            "Invalid email address format.",
            code="INVALID_EMAIL_FORMAT",
            status_code=400,
        )

    parts = clean_email.split("@", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise OmniRAGError(
            "Invalid email address format.",
            code="INVALID_EMAIL_FORMAT",
            status_code=400,
        )

    domain = parts[1].strip()

    if domain in DISALLOWED_PERSONAL_DOMAINS or any(domain.endswith(f".{d}") for d in DISALLOWED_PERSONAL_DOMAINS):
        raise OmniRAGError(
            f"Registration is restricted to business and enterprise work emails. "
            f"Personal email addresses (@{domain}) are not permitted. Please sign up using your company or organization work email.",
            code="PERSONAL_EMAIL_NOT_ALLOWED",
            status_code=400,
        )


def validate_password_strength(password: str) -> None:
    """Enforce enterprise password complexity requirements.
    
    Rules:
    - Minimum 8 characters, maximum 128 characters
    - Must contain at least one letter (a-z or A-Z)
    - Must contain at least one digit or symbol
    - Rejects common trivial patterns
    """
    if len(password) < 8:
        raise OmniRAGError(
            "Password must be at least 8 characters long",
            code="WEAK_PASSWORD",
            status_code=400,
        )
    if len(password) > 128:
        raise OmniRAGError(
            "Password must not exceed 128 characters",
            code="PASSWORD_TOO_LONG",
            status_code=400,
        )
    if not re.search(r"[a-zA-Z]", password):
        raise OmniRAGError(
            "Password must contain at least one alphabetical letter",
            code="WEAK_PASSWORD",
            status_code=400,
        )
    if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{};':\",.<>/?\\|`~]", password):
        raise OmniRAGError(
            "Password must contain at least one number or special character",
            code="WEAK_PASSWORD",
            status_code=400,
        )
    common_passwords = {"password", "12345678", "admin123", "qwerty123", "letmein123"}
    if password.lower() in common_passwords:
        raise OmniRAGError(
            "Password is too common and easily compromised",
            code="COMMON_PASSWORD",
            status_code=400,
        )


def verify_dummy_password() -> None:
    """Constant-time verification against a dummy hash to prevent user enumeration timing attacks."""
    try:
        _ph.verify(_DUMMY_HASH, "wrong_attempt_padding")
    except Exception:
        pass


async def check_rate_limit(
    identifier: str,
    action: str = "auth_login",
    max_attempts: int = 5,
    window_seconds: int = 60,
) -> tuple[bool, int]:
    """Sliding window rate-limiter for brute force defense.
    
    Returns:
        (is_allowed: bool, remaining_or_retry_after: int)
    """
    key = f"rate_limit:{action}:{identifier}"
    now = time.time()
    
    try:
        client = get_redis_client()
        pipe = client.pipeline()
        # Remove timestamps older than window
        pipe.zremrangebyscore(key, 0, now - window_seconds)
        # Count current attempts
        pipe.zcard(key)
        # Add current timestamp
        pipe.zadd(key, {str(now): now})
        # Set expire
        pipe.expire(key, window_seconds)
        _, count, _, _ = await pipe.execute()
        
        if count >= max_attempts:
            # Rate limited
            return False, window_seconds
        return True, max(0, max_attempts - (count + 1))
    except Exception:
        # Fallback to local thread-safe in-memory sliding window
        timestamps = _memory_rate_limit_store[key]
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        if len(valid_timestamps) >= max_attempts:
            _memory_rate_limit_store[key] = valid_timestamps
            return False, window_seconds
        valid_timestamps.append(now)
        _memory_rate_limit_store[key] = valid_timestamps
        return True, max(0, max_attempts - len(valid_timestamps))


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

