"""Abstract Vector Store Interface."""

from abc import ABC, abstractmethod
from typing import Any

from app.services.vector_store.schema import ScoredChunk, VectorPoint


class VectorStore(ABC):
    """Abstract Vector Store interface."""

    @abstractmethod
    async def create_collection_if_not_exists(
        self,
        collection_name: str,
        dimension: int = 1536,
        distance_metric: str = "Cosine",
    ) -> bool:
        """Create vector collection if it does not already exist."""
        pass

    @abstractmethod
    async def upsert_points(self, collection_name: str, points: list[VectorPoint]) -> int:
        """Upsert a batch of vector points with payloads into the collection."""
        pass

    @abstractmethod
    async def search(
        self,
        collection_name: str,
        query_vector: list[float],
        tenant_id: str,
        top_k: int = 10,
        organization_id: str | None = None,
        allowed_roles: list[str] | None = None,
        score_threshold: float | None = None,
    ) -> list[ScoredChunk]:
        """Execute vector search with strict tenant and ACL payload filters."""
        pass

    @abstractmethod
    async def delete_by_document(self, collection_name: str, document_id: str) -> bool:
        """Delete all points associated with a specific document."""
        pass

