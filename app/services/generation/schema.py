"""Grounded Generation Data Structures and Citation Models."""

from typing import Any
from pydantic import BaseModel, Field


class CitationMetadata(BaseModel):
    """Citation reference linking an answer claim to source evidence."""

    citation_id: str
    chunk_id: str
    document_id: str
    page_number: int
    cited_snippet: str
    is_valid: bool = True
    confidence_score: float = 1.0


class GroundedAnswer(BaseModel):
    """Synthesized answer with verifiable citations and abstention status."""

    answer_text: str
    citations: list[CitationMetadata] = Field(default_factory=list)
    has_abstained: bool = False
    confidence_score: float = 1.0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    model_name: str = "mock-llm"
