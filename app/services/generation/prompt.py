"""Prompt Templates and Grounded Context Assembly."""

from app.services.vector_store.schema import ScoredChunk

SYSTEM_PROMPT = """You are OmniRAG, an enterprise multimodal knowledge intelligence platform.
Your task is to provide factually accurate, evidence-grounded answers based strictly on the provided documents.

Rules:
1. Every factual statement or claim MUST include an exact inline citation tag using the bracketed chunk ID: [chunk_id].
2. For multiple supporting chunks, cite all relevant IDs: [chunk_1][chunk_2].
3. DO NOT extrapolate, fabricate, or hallucinate information not explicitly contained in the provided evidence.
4. If the provided evidence is completely insufficient to answer the question, you MUST explicitly state:
   "I cannot find sufficient evidence in the authorized documents to answer this question."
5. Never invent chunk IDs, document names, or page numbers.
"""


def build_grounded_prompt(query: str, chunks: list[ScoredChunk]) -> str:
    """Formats retrieved chunks with strict delimiter boundaries to prevent prompt injection."""
    context_sections: list[str] = []

    for chunk in chunks:
        section = (
            f'<evidence id="{chunk.chunk_id}" page="{chunk.page_number}" type="{chunk.content_type}">\n'
            f"{chunk.raw_text}\n"
            f"</evidence>"
        )
        context_sections.append(section)

    context_str = "\n\n".join(context_sections)

    prompt = (
        f"<context>\n"
        f"{context_str}\n"
        f"</context>\n\n"
        f"User Question: {query}\n\n"
        f"Provide a direct, complete, evidence-grounded answer with inline citations [chunk_id]."
    )
    return prompt
