"""Tenant and Organization multi-tenancy models."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.user import Membership


class Tenant(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Top-level enterprise tenant for absolute data segregation."""

    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    settings_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    organizations: Mapped[list["Organization"]] = relationship(
        "Organization", back_populates="tenant", cascade="all, delete-orphan"
    )


class Organization(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Business unit or department within a Tenant."""

    __tablename__ = "organizations"

    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="organizations")
    memberships: Mapped[list["Membership"]] = relationship(
        "Membership", back_populates="organization", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="organization", cascade="all, delete-orphan"
    )
