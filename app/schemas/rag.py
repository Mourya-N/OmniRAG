"""Pydantic v2 schemas for Enterprise RAG Chat and Citations."""

from typing import Any
from pydantic import BaseModel, Field

from app.services.generation.schema import CitationMetadata
from app.services.verification.citation import VerificationReport


class RAGChatRequest(BaseModel):
    """Payload for initiating a grounded RAG generation request."""

    query: str = Field(min_length=2, max_length=2000, description="User question")
    conversation_id: str | None = None
    organization_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)
    enable_reranking: bool = True
    abstain_on_insufficient_evidence: bool = True


class RAGChatResponse(BaseModel):
    """Evidence-grounded response with verifiable citations and audit verification."""

    conversation_id: str
    message_id: str
    query: str
    answer: str
    has_abstained: bool
    confidence_score: float
    citations: list[CitationMetadata]
    verification: VerificationReport
    retrieval_strategy: str

