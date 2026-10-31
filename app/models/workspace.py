"""Workspace Collections, Saved Queries, and Telemetry ORM Models."""

from typing import Any
from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Collection(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Knowledge collection / document workspace."""

    __tablename__ = "collections"

    tenant_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    organization_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    color: Mapped[str] = mapped_column(String(50), default="from-indigo-600 to-purple-600", nullable=False)
    doc_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    collaborators_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class SavedQuery(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Pinned and saved enterprise prompts."""

    __tablename__ = "saved_queries"

    tenant_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    tag: Mapped[str] = mapped_column(String(50), default="General", nullable=False)
    execution_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    avg_latency: Mapped[str] = mapped_column(String(30), default="1.2s", nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class QueryTelemetry(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Telemetry records for executed queries and accuracy metrics."""

    __tablename__ = "query_telemetry"

    tenant_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), index=True, nullable=True)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="factual", nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, default=1200.0, nullable=False)
    accuracy_score: Mapped[float] = mapped_column(Float, default=0.98, nullable=False)
    token_cost: Mapped[float] = mapped_column(Float, default=0.005, nullable=False)
    model_used: Mapped[str] = mapped_column(String(50), default="gemini-1.5-pro", nullable=False)

