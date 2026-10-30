"""Abstract Neural Reranker Interface."""

from abc import ABC, abstractmethod

from app.services.vector_store.schema import ScoredChunk


class Reranker(ABC):
    """Abstract interface for query-passage cross-encoder rerankers."""

    @abstractmethod
    async def rerank(
        self,
        query: str,
        candidates: list[ScoredChunk],
        top_k: int = 10,
        score_threshold: float = 0.35,
    ) -> list[ScoredChunk]:
        """Score and rerank candidate chunks according to cross-attention relevance."""
        pass
