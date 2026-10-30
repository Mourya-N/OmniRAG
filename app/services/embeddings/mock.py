"""Deterministic Offline Mock Embedding Provider for Testing and Benchmarking."""

import hashlib
import math

from app.services.embeddings.base import EmbeddingProvider


class MockEmbeddingProvider(EmbeddingProvider):
    """Produces deterministic unit-normalized dense vectors without external network calls."""

    def __init__(self, dimension: int = 1536, model_name: str = "mock-embed-v1") -> None:
        self._dim = dimension
        self._model_name = model_name

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def model_name(self) -> str:
        return self._model_name

    def _generate_vector(self, text: str) -> list[float]:
        # Hash text to seed pseudo-random components across dimensions
        words = text.lower().split()
        vec = [0.0] * self._dim

        for i, word in enumerate(words):
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            for d in range(self._dim):
                slot_val = ((h >> (d % 32)) & 0xFF) / 255.0 - 0.5
                vec[d] += slot_val * (1.0 / (1.0 + i * 0.1))

        # L2-normalize vector for Cosine distance
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            return [x / norm for x in vec]
        # Fallback unit vector
        vec[0] = 1.0
        return vec

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._generate_vector(t) for t in texts]

    async def embed_query(self, query: str) -> list[float]:
        return self._generate_vector(query)

