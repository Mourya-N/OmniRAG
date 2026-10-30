"""Pydantic v2 schemas for Search and Retrieval APIs."""

from typing import Any
from pydantic import BaseModel, Field

from app.services.retrieval.hybrid import FusionDiagnostic


class SearchRequest(BaseModel):
    """Payload for executing dense, lexical, or hybrid search."""

    query: str = Field(min_length=2, max_length=1000, description="Search query string")
    organization_id: str | None = None
    top_k: int = Field(default=10, ge=1, le=100)
    enable_reranking: bool = True
    reranker_score_threshold: float = Field(default=0.35, ge=0.0, le=1.0)
    dense_weight: float = Field(default=1.0, ge=0.0, le=5.0)
    sparse_weight: float = Field(default=1.0, ge=0.0, le=5.0)


class SearchHit(BaseModel):
    """A retrieved chunk hit with score and location."""

    chunk_id: str
    document_id: str
    tenant_id: str
    score: float
    raw_text: str
    page_number: int
    section_heading: str | None = None
    content_type: str = "text"
    parent_chunk_id: str | None = None
    retrieval_source: str


class SearchResponse(BaseModel):
    """Complete search response containing ranked hits and retrieval diagnostics."""

    query: str
    total_hits: int
    hits: list[SearchHit]
    diagnostics: list[FusionDiagnostic] = Field(default_factory=list)
    retrieval_strategy: str
