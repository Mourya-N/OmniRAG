"""Vector Store Package and Factory."""

from app.core.config import settings
from app.services.vector_store.base import VectorStore
from app.services.vector_store.qdrant import QdrantVectorStore
from app.services.vector_store.schema import ScoredChunk, VectorPoint

_vector_store_instance: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Return default singleton Vector Store."""
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = QdrantVectorStore()
    return _vector_store_instance


__all__ = [
    "VectorStore",
    "QdrantVectorStore",
    "VectorPoint",
    "ScoredChunk",
    "get_vector_store",
]

