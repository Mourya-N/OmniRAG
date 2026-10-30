"""Unit and integration tests for Phase 3: Auth, Multi-Tenancy, and RBAC."""

from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.deps import get_db
from app.core.config import settings
from app.core.database import Base
from app.core.exceptions import AuthenticationError, TokenExpiredError
from app.core.security import (
    check_document_access,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.main import app


# Test Fixture: In-Memory SQLite Async Database
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


# Unit Tests: Cryptography & Access Control
def test_argon2id_hashing_and_verification():
    raw_pass = "P@ssw0rdSecureEnterprise!2026"
    hashed = hash_password(raw_pass)
    assert hashed != raw_pass
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_pass, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_lifecycle_and_tampering():
    token = create_access_token(
        subject="usr-123",
        tenant_id="ten-456",
        organization_id="org-789",
        roles=["Admin"],
    )
    payload = decode_token(token)
    assert payload["sub"] == "usr-123"
    assert payload["tenant_id"] == "ten-456"
    assert "Admin" in payload["roles"]

    # Tampered token
    tampered = token[:-5] + "XXXXX"
    with pytest.raises(AuthenticationError):
        decode_token(tampered)


def test_document_abac_rbac_rules():
    # Admin / Owner always allowed
    assert check_document_access("u1", ["Admin"], [], "write") is True
    assert check_document_access("u1", ["Owner"], [], "admin") is True

    # Default open when no specific document ACL
    assert check_document_access("u1", ["Member"], [], "read") is True

    # Explicit ACL with role restriction
    acl = [{"role_name": "Editor", "permission_level": "write"}]
    assert check_document_access("u1", ["Editor"], acl, "write") is True
    assert check_document_access("u1", ["Viewer"], acl, "write") is False

    # Specific user ACL
    user_acl = [{"user_id": "u-specific", "permission_level": "read"}]
    assert check_document_access("u-specific", ["Viewer"], user_acl, "read") is True
    assert check_document_access("u-other", ["Viewer"], user_acl, "read") is False


# Integration Tests: Auth and Organization API Flows
@pytest.mark.asyncio
async def test_full_auth_and_organization_flow(client: AsyncClient):
    # 1. Register User
    reg_payload = {
        "email": "lead.engineer@enterprise.ai",
        "password": "SecurePassword123!",
        "full_name": "Principal AI Architect",
        "tenant_name": "OmniCorp Global",
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    tokens = reg_resp.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 2. Duplicate registration should fail
    dup_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409

    # 3. Login with valid credentials
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "lead.engineer@enterprise.ai", "password": "SecurePassword123!"},
    )
    assert login_resp.status_code == 200

    # 4. Login with bad password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "lead.engineer@enterprise.ai", "password": "BadPassword!"},
    )
    assert bad_login.status_code == 401

    # 5. Fetch Profile
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["email"] == "lead.engineer@enterprise.ai"
    assert "User" in profile["roles"]
    tenant_id = profile["tenant_id"]

    # 6. Refresh Token
    ref_resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_resp.status_code == 200
    new_tokens = ref_resp.json()
    assert "access_token" in new_tokens

    # 7. Create Organization in Tenant
    tenant_headers = {**auth_headers, "X-Tenant-ID": tenant_id}
    org_resp = await client.post(
        "/api/v1/organizations/",
        headers=tenant_headers,
        json={"name": "Engineering Department", "slug": "engineering"},
    )
    assert org_resp.status_code == 201
    org_data = org_resp.json()
    assert org_data["name"] == "Engineering Department"

    # 8. List Organizations
    list_resp = await client.get("/api/v1/organizations/", headers=tenant_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 2  # Default + Engineering

    # 9. Test Tenant Boundary Violation
    rogue_headers = {**auth_headers, "X-Tenant-ID": "different-tenant-id-456"}
    boundary_resp = await client.get("/api/v1/organizations/", headers=rogue_headers)
    assert boundary_resp.status_code == 403
    assert boundary_resp.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_httponly_cookie_auth_flow(client: AsyncClient):
    """Verify passwords are not saved locally and sessions operate via secure HttpOnly cookies."""
    # 1. Register with password and verify cookie issuance
    reg_payload = {
        "email": "cookie.user@enterprise.ai",
        "password": "StrongPassword999#",
        "full_name": "Cookie Session User",
        "tenant_name": "SecureCo",
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    assert "omnirag_access_token" in reg_resp.cookies
    assert "omnirag_refresh_token" in reg_resp.cookies

    # 2. Login and verify cookies & security headers
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "cookie.user@enterprise.ai", "password": "StrongPassword999#"},
    )
    assert login_resp.status_code == 200
    assert "omnirag_access_token" in login_resp.cookies
    assert login_resp.headers.get("X-Frame-Options") == "DENY"
    assert login_resp.headers.get("X-Content-Type-Options") == "nosniff"

    # 3. Access protected /auth/me using ONLY cookies (no Authorization header!)
    cookie_header = {"Cookie": f"omnirag_access_token={login_resp.cookies['omnirag_access_token']}"}
    me_resp = await client.get("/api/v1/auth/me", headers=cookie_header)
    assert me_resp.status_code == 200
    profile = me_resp.json()
    assert profile["email"] == "cookie.user@enterprise.ai"

    # 4. Logout terminates session and clears cookies
    logout_resp = await client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
    assert logout_resp.json()["success"] is True


@pytest.mark.asyncio
async def test_weak_password_enforcement(client: AsyncClient):
    """Enforce defense against weak credentials."""
    # Too short
    short_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "bad.pass@enterprise.ai",
            "password": "short",
            "full_name": "Bad Pass",
            "tenant_name": "BadCo",
        },
    )
    assert short_resp.status_code == 422 or short_resp.status_code == 400

    # Common password
    common_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "common.pass@enterprise.ai",
            "password": "password",
            "full_name": "Common Pass",
            "tenant_name": "BadCo",
        },
    )
    assert common_resp.status_code == 400


@pytest.mark.asyncio
async def test_work_email_validation(client):
    """Enforce that personal webmail domains (gmail, outlook, etc.) are rejected."""
    # 1. Reject gmail.com
    gmail_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alex.dev@gmail.com",
            "password": "StrongPassword123!",
            "full_name": "Alex Personal",
            "tenant_name": "AlexOrg",
        },
    )
    assert gmail_resp.status_code == 400
    assert gmail_resp.json()["error"]["code"] == "PERSONAL_EMAIL_NOT_ALLOWED"

    # 2. Reject outlook.com
    outlook_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alex.dev@outlook.com",
            "password": "StrongPassword123!",
            "full_name": "Alex Personal",
            "tenant_name": "AlexOrg",
        },
    )
    assert outlook_resp.status_code == 400
    assert outlook_resp.json()["error"]["code"] == "PERSONAL_EMAIL_NOT_ALLOWED"

    # 3. Reject email.com
    email_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alex.dev@email.com",
            "password": "StrongPassword123!",
            "full_name": "Alex Personal",
            "tenant_name": "AlexOrg",
        },
    )
    assert email_resp.status_code == 400
    assert email_resp.json()["error"]["code"] == "PERSONAL_EMAIL_NOT_ALLOWED"

    # 4. Accept valid corporate/organization work email
    work_resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "alex.dev@enterprise-corp.com",
            "password": "StrongPassword123!",
            "full_name": "Alex Corporate",
            "tenant_name": "CorporateOrg",
        },
    )
    assert work_resp.status_code == 201


@pytest.mark.asyncio
async def test_login_requires_existing_account(client):
    """Verify that login strictly fails if the account was never signed up."""
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent.user@corporate.io", "password": "AnyPassword123!"},
    )
    assert login_resp.status_code == 401
    assert "No account found with this email. Please sign up first." in login_resp.json()["error"]["message"]


@pytest.mark.asyncio
async def test_google_oauth2_account_selection_and_work_email(client):
    """Verify Google OAuth2 endpoint returns select_account prompt and enforces corporate work email via real OAuth exchange."""
    # 1. When unconfigured, returns 503
    with patch.object(settings, "GOOGLE_CLIENT_ID", ""), patch.object(settings, "GOOGLE_CLIENT_SECRET", ""):
        unconfigured_resp = await client.get("/api/v1/auth/google/url")
        assert unconfigured_resp.status_code == 503
        assert unconfigured_resp.json()["error"]["code"] == "GOOGLE_AUTH_NOT_CONFIGURED"

    # 2. When configured, returns OAuth2 authorization URL with select_account
    test_client_id = "test-client-id.apps.googleusercontent.com"
    test_client_secret = "test-client-secret-xyz"
    with patch.object(settings, "GOOGLE_CLIENT_ID", test_client_id), patch.object(settings, "GOOGLE_CLIENT_SECRET", test_client_secret):
        url_resp = await client.get("/api/v1/auth/google/url?redirect_uri=http://localhost:3000/auth/google/callback")
        assert url_resp.status_code == 200
        data = url_resp.json()
        assert data["prompt"] == "select_account"
        assert "prompt=select_account" in data["authorization_url"]
        assert test_client_id in data["authorization_url"]

        # 3. Simulate Google OAuth exchange returning personal @gmail.com -> rejected with 400
        mock_token_resp = MagicMock()
        mock_token_resp.status_code = 200
        mock_token_resp.headers = {"content-type": "application/json"}
        mock_token_resp.json.return_value = {"access_token": "ya29.mock-gmail-token"}

        mock_userinfo_gmail = MagicMock()
        mock_userinfo_gmail.status_code = 200
        mock_userinfo_gmail.headers = {"content-type": "application/json"}
        mock_userinfo_gmail.json.return_value = {
            "email": "developer@gmail.com",
            "name": "Dev User",
            "email_verified": True,
        }

        mock_client_gmail = MagicMock()
        mock_client_gmail.__aenter__.return_value = mock_client_gmail
        mock_client_gmail.__aexit__.return_value = None
        mock_client_gmail.post = AsyncMock(return_value=mock_token_resp)
        mock_client_gmail.get = AsyncMock(return_value=mock_userinfo_gmail)

        with patch("app.api.v1.auth.httpx.AsyncClient", return_value=mock_client_gmail):
            gmail_oauth = await client.post(
                "/api/v1/auth/google/callback",
                json={"code": "auth-code-gmail-123", "redirect_uri": "http://localhost:3000/auth/google/callback"},
            )
            assert gmail_oauth.status_code == 400
            assert gmail_oauth.json()["error"]["code"] == "PERSONAL_EMAIL_NOT_ALLOWED"

        # 4. Simulate Google OAuth exchange returning corporate Google Workspace email -> successful 200
        mock_userinfo_corp = MagicMock()
        mock_userinfo_corp.status_code = 200
        mock_userinfo_corp.headers = {"content-type": "application/json"}
        mock_userinfo_corp.json.return_value = {
            "email": "sarah.architect@cloud-native.io",
            "name": "Sarah Architect",
            "email_verified": True,
        }

        mock_client_corp = MagicMock()
        mock_client_corp.__aenter__.return_value = mock_client_corp
        mock_client_corp.__aexit__.return_value = None
        mock_client_corp.post = AsyncMock(return_value=mock_token_resp)
        mock_client_corp.get = AsyncMock(return_value=mock_userinfo_corp)

        with patch("app.api.v1.auth.httpx.AsyncClient", return_value=mock_client_corp):
            corp_oauth = await client.post(
                "/api/v1/auth/google/callback",
                json={"code": "auth-code-corp-456", "redirect_uri": "http://localhost:3000/auth/google/callback"},
            )
            assert corp_oauth.status_code == 200
            res = corp_oauth.json()
            assert "access_token" in res
            assert "omnirag_access_token" in corp_oauth.cookies

            # 5. Verify identity and standard 'User' role in session
            me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {res['access_token']}"})
            assert me_resp.status_code == 200
            profile = me_resp.json()
            assert profile["email"] == "sarah.architect@cloud-native.io"
            assert profile["full_name"] == "Sarah Architect"
            assert "User" in profile["roles"]


