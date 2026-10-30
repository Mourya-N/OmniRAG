"""Abstract Embedding Provider Interface."""

from abc import ABC, abstractmethod


class EmbeddingProvider(ABC):
    """Abstract interface for dense embedding generation."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector dimensionality."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name and version identifier of the embedding model."""
        pass

    @abstractmethod
    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        """Compute dense vector embeddings for a batch of documents."""
        pass

    @abstractmethod
    async def embed_query(self, query: str) -> list[float]:
        """Compute dense vector embedding for a single search query."""
        pass
