"""Generation Package and Factory."""

from app.services.generation.base import LLMProvider
from app.services.generation.llm import MockLLMProvider, OpenAILLMProvider, get_llm_provider
from app.services.generation.prompt import SYSTEM_PROMPT, build_grounded_prompt
from app.services.generation.schema import CitationMetadata, GroundedAnswer

__all__ = [
    "LLMProvider",
    "MockLLMProvider",
    "OpenAILLMProvider",
    "get_llm_provider",
    "build_grounded_prompt",
    "SYSTEM_PROMPT",
    "GroundedAnswer",
    "CitationMetadata",
]
