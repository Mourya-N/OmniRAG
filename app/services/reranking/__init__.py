"""Reranking Package and Factory."""

from app.services.reranking.base import Reranker
from app.services.reranking.cross_encoder import CrossEncoderReranker

_reranker_instance: Reranker | None = None


def get_reranker() -> Reranker:
    """Return default singleton neural reranker."""
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = CrossEncoderReranker()
    return _reranker_instance


__all__ = ["Reranker", "CrossEncoderReranker", "get_reranker"]

