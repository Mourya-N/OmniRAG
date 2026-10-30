"""Conversation, Message, and Citation ORM models."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.document import DocumentChunk
    from app.models.tenant import Organization
    from app.models.user import User


class Conversation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """User conversation thread scoped by Tenant and Organization."""

    __tablename__ = "conversations"

    organization_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), default="New Conversation", nullable=False)

    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """An individual message in a conversation with full audit metadata."""

    __tablename__ = "messages"

    conversation_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sender_role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    citations: Mapped[list["Citation"]] = relationship(
        "Citation", back_populates="message", cascade="all, delete-orphan"
    )


class Citation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Grounding citation linking a message claim directly to an ingested chunk."""

    __tablename__ = "citations"

    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"), index=True, nullable=False
    )
    chunk_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), index=True, nullable=False
    )
    cited_snippet: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    message: Mapped["Message"] = relationship("Message", back_populates="citations")
