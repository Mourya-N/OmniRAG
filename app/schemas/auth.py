"""Pydantic v2 schemas for Authentication, Users, and Organizations."""

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Payload for registering a new user and tenant."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="Strong user password")
    full_name: str = Field(min_length=2, max_length=100)
    tenant_name: str = Field(min_length=2, max_length=100, description="Organization or Enterprise name")


class UserLoginRequest(BaseModel):
    """Payload for authenticating a user."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT response structure."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in_seconds: int


class RefreshTokenRequest(BaseModel):
    """Payload for refreshing an expired access token."""

    refresh_token: str


class UserProfileResponse(BaseModel):
    """User identity and membership details."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    is_superuser: bool
    tenant_id: str
    organization_id: str | None = None
    roles: list[str] = Field(default_factory=list)


class OrganizationCreateRequest(BaseModel):
    """Payload for creating a new Organization within a Tenant."""

    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=100)


class OrganizationResponse(BaseModel):
    """Organization metadata output."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    name: str
    slug: str


class MemberAssignRoleRequest(BaseModel):
    """Assign or update a member's role in an organization."""

    user_email: EmailStr
    role_name: str = Field(description="Owner, Admin, Member, or Viewer")
