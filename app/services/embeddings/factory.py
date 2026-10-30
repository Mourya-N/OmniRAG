"""Embedding Provider Factory and Singleton Accessor."""

from app.core.config import settings
from app.services.embeddings.base import EmbeddingProvider
from app.services.embeddings.mock import MockEmbeddingProvider
from app.services.embeddings.openai import OpenAIEmbeddingProvider

_provider_instance: EmbeddingProvider | None = None


def get_embedding_provider() -> EmbeddingProvider:
    """Return configured embedding provider."""
    global _provider_instance
    if _provider_instance is None:
        if settings.DEFAULT_EMBEDDING_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            _provider_instance = OpenAIEmbeddingProvider()
        else:
            _provider_instance = MockEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
    return _provider_instance
