"""OpenAI Dense Vector Embedding Provider."""

import httpx

from app.core.config import settings
from app.core.exceptions import OmniRAGError
from app.services.embeddings.base import EmbeddingProvider


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """Generates embeddings via OpenAI text-embedding-3-small / text-embedding-3-large."""

    def __init__(
        self,
        api_key: str | None = None,
        model_name: str | None = None,
        dimension: int = 1536,
    ) -> None:
        self.api_key = api_key or settings.OPENAI_API_KEY
        self._model_name = model_name or settings.DEFAULT_EMBEDDING_MODEL
        self._dim = dimension

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def model_name(self) -> str:
        return self._model_name

    async def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not self.api_key:
            raise OmniRAGError("OPENAI_API_KEY is not configured", code="MISSING_API_KEY", status_code=500)

        url = "https://api.openai.com/v1/embeddings"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {"input": texts, "model": self._model_name}

        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=60.0)
            if resp.status_code != 200:
                raise OmniRAGError(
                    f"OpenAI embedding request failed: {resp.text}",
                    code="EMBEDDING_PROVIDER_ERROR",
                    status_code=resp.status_code,
                )
            data = resp.json()
            return [item["embedding"] for item in data["data"]]

    async def embed_query(self, query: str) -> list[float]:
        results = await self.embed_documents([query])
        return results[0]
