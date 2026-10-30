"""Vector Store Data Structures and Scored Search Results."""

from typing import Any
from pydantic import BaseModel, Field


class VectorPoint(BaseModel):
    """Normalized point structure for vector database upsert."""

    point_id: str
    vector: list[float]
    payload: dict[str, Any] = Field(default_factory=dict)


class ScoredChunk(BaseModel):
    """Retrieved chunk with relevance score and complete metadata."""

    chunk_id: str
    document_id: str
    tenant_id: str
    score: float
    raw_text: str
    page_number: int
    section_heading: str | None = None
    content_type: str = "text"
    parent_chunk_id: str | None = None
    retrieval_source: str = "dense_vector"
    metadata: dict[str, Any] = Field(default_factory=dict)
