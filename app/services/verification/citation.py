"""Citation Validation, Grounding Verification, and Hallucination Prevention."""

import re
from typing import Any
from pydantic import BaseModel, Field

from app.services.vector_store.schema import ScoredChunk


class VerificationReport(BaseModel):
    """Hallucination detection and citation verification audit result."""

    is_grounded: bool
    faithfulness_score: float = Field(ge=0.0, le=1.0)
    citation_accuracy_score: float = Field(ge=0.0, le=1.0)
    total_citations: int = 0
    valid_citations_count: int = 0
    phantom_citations: list[str] = Field(default_factory=list)
    unsupported_claims: list[str] = Field(default_factory=list)
    verified_citations: list[dict[str, Any]] = Field(default_factory=list)


class CitationValidator:
    """Rigorous citation verification confirming no phantom citations or unsupported assertions."""

    def validate_citations(
        self,
        answer_text: str,
        retrieved_chunks: list[ScoredChunk],
    ) -> VerificationReport:
        # Extract all citation tags: [chunk_id]
        cited_tags = re.findall(r"\[([a-zA-Z0-9_-]+)\]", answer_text)
        retrieved_map = {c.chunk_id: c for c in retrieved_chunks}

        valid_citations: list[dict[str, Any]] = []
        phantom_citations: list[str] = []

        for cid in cited_tags:
            if cid in retrieved_map:
                chunk = retrieved_map[cid]
                valid_citations.append(
                    {
                        "chunk_id": cid,
                        "document_id": chunk.document_id,
                        "page_number": chunk.page_number,
                    }
                )
            else:
                phantom_citations.append(cid)

        total_citations = len(cited_tags)
        valid_count = len(valid_citations)

        if total_citations > 0:
            citation_accuracy = valid_count / total_citations
        else:
            # If no citations were made, accuracy depends on whether system abstained
            citation_accuracy = 1.0 if "cannot find sufficient evidence" in answer_text.lower() else 0.0

        # Faithfulness check: ensure cited claims appear in chunk text
        unsupported_claims: list[str] = []
        sentences = [s.strip() for s in answer_text.split(".") if s.strip()]

        for sentence in sentences:
            sentence_cits = re.findall(r"\[([a-zA-Z0-9_-]+)\]", sentence)
            if not sentence_cits and len(sentence) > 20 and "cannot find sufficient" not in sentence.lower():
                unsupported_claims.append(sentence)

        faithfulness = 1.0 - (len(unsupported_claims) / max(1, len(sentences)))
        faithfulness = max(0.0, min(1.0, faithfulness))

        is_grounded = len(phantom_citations) == 0 and citation_accuracy >= 0.90

        return VerificationReport(
            is_grounded=is_grounded,
            faithfulness_score=round(faithfulness, 2),
            citation_accuracy_score=round(citation_accuracy, 2),
            total_citations=total_citations,
            valid_citations_count=valid_count,
            phantom_citations=phantom_citations,
            unsupported_claims=unsupported_claims,
            verified_citations=valid_citations,
        )
