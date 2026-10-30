"""Chunking Data Structures and Canonical Chunk Schema."""

import uuid
from typing import Any, Literal
from pydantic import BaseModel, Field

from app.services.parser.schema import BoundingBox


class ChunkPayload(BaseModel):
    """Canonical chunk representation prepared for relational and vector storage."""

    chunk_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    tenant_id: str
    version_id: str
    chunk_index: int = 0
    content_type: Literal["text", "table", "code", "image", "chart"] = "text"
    raw_text: str
    page_number: int = 1
    section_heading: str | None = None
    bounding_box: BoundingBox | None = None
    parent_chunk_id: str | None = None
    token_count: int = 0
    embedding_model_version: str = "mock-embed-v1"
    metadata: dict[str, Any] = Field(default_factory=dict)

