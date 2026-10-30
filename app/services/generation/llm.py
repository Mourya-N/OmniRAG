"""Enterprise LLM Provider Implementations (Mock and OpenAI)."""

import re
import uuid
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import OmniRAGError
from app.services.generation.base import LLMProvider
from app.services.generation.prompt import SYSTEM_PROMPT, build_grounded_prompt
from app.services.generation.schema import CitationMetadata, GroundedAnswer
from app.services.vector_store.schema import ScoredChunk


class MockLLMProvider(LLMProvider):
    """Deterministic Mock LLM generator for offline testing and reproducible benchmarks."""

    async def generate_grounded_answer(
        self,
        query: str,
        context_chunks: list[ScoredChunk],
    ) -> GroundedAnswer:
        if not context_chunks:
            return GroundedAnswer(
                answer_text="I cannot find sufficient evidence in the authorized documents to answer this question.",
                citations=[],
                has_abstained=True,
                confidence_score=0.0,
                model_name="mock-llm-v1",
            )

        # Generate direct evidence-grounded statements citing retrieved chunks
        answer_parts: list[str] = []
        citations: list[CitationMetadata] = []

        for chunk in context_chunks[:3]:
            # Take first sentence or meaningful snippet
            snippet = chunk.raw_text.split(".")[0].strip()
            answer_parts.append(f"According to the documentation, {snippet} [{chunk.chunk_id}].")
            citations.append(
                CitationMetadata(
                    citation_id=str(uuid.uuid4()),
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    page_number=chunk.page_number,
                    cited_snippet=snippet,
                    is_valid=True,
                    confidence_score=chunk.score,
                )
            )

        answer_text = " ".join(answer_parts)
        return GroundedAnswer(
            answer_text=answer_text,
            citations=citations,
            has_abstained=False,
            confidence_score=0.95,
            prompt_tokens=len(query) // 4 + sum(len(c.raw_text) // 4 for c in context_chunks),
            completion_tokens=len(answer_text) // 4,
            model_name="mock-llm-v1",
        )


class OpenAILLMProvider(LLMProvider):
    """OpenAI GPT-4o / GPT-4o-mini generation provider."""

    def __init__(self, api_key: str | None = None, model: str = "gpt-4o") -> None:
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model

    async def generate_grounded_answer(
        self,
        query: str,
        context_chunks: list[ScoredChunk],
    ) -> GroundedAnswer:
        if not self.api_key:
            raise OmniRAGError("OPENAI_API_KEY not configured", code="MISSING_API_KEY")

        if not context_chunks:
            return GroundedAnswer(
                answer_text="I cannot find sufficient evidence in the authorized documents to answer this question.",
                citations=[],
                has_abstained=True,
                confidence_score=0.0,
                model_name=self.model,
            )

        user_content = build_grounded_prompt(query, context_chunks)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.0,
                },
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=60.0,
            )
            if resp.status_code != 200:
                raise OmniRAGError(f"OpenAI completion failed: {resp.text}", code="LLM_PROVIDER_ERROR")

            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            # Extract cited IDs: [chunk_id]
            cited_ids = set(re.findall(r"\[([a-zA-Z0-9_-]+)\]", raw_text))
            chunk_lookup = {c.chunk_id: c for c in context_chunks}

            citations: list[CitationMetadata] = []
            for cid in cited_ids:
                if cid in chunk_lookup:
                    c = chunk_lookup[cid]
                    citations.append(
                        CitationMetadata(
                            citation_id=str(uuid.uuid4()),
                            chunk_id=c.chunk_id,
                            document_id=c.document_id,
                            page_number=c.page_number,
                            cited_snippet=c.raw_text[:200],
                            is_valid=True,
                            confidence_score=c.score,
                        )
                    )

            has_abstained = "cannot find sufficient evidence" in raw_text.lower()
            return GroundedAnswer(
                answer_text=raw_text,
                citations=citations,
                has_abstained=has_abstained,
                confidence_score=0.90 if citations else 0.5,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                model_name=self.model,
            )


_llm_instance: LLMProvider | None = None


def get_llm_provider() -> LLMProvider:
    """Return configured LLM provider instance."""
    global _llm_instance
    if _llm_instance is None:
        if settings.DEFAULT_LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            _llm_instance = OpenAILLMProvider()
        else:
            _llm_instance = MockLLMProvider()
    return _llm_instance

