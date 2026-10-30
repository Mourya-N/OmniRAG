"""Abstract LLM Provider Interface."""

from abc import ABC, abstractmethod

from app.services.generation.schema import GroundedAnswer
from app.services.vector_store.schema import ScoredChunk


class LLMProvider(ABC):
    """Abstract interface for LLM answer synthesis."""

    @abstractmethod
    async def generate_grounded_answer(
        self,
        query: str,
        context_chunks: list[ScoredChunk],
    ) -> GroundedAnswer:
        """Synthesize answer with inline citation tags [chunk_id]."""
        pass
