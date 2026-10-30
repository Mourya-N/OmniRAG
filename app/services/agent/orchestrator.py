"""Bounded Multi-Agent Orchestration Graph for Complex & Multi-Hop Retrieval."""

import time
from typing import Any
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.exceptions import AgentBudgetExceededError
from app.core.logging import get_logger
from app.services.agent.router import QueryIntent, QueryRouter
from app.services.generation import get_llm_provider
from app.services.generation.schema import GroundedAnswer
from app.services.reranking import get_reranker
from app.services.retrieval.hybrid import HybridRetriever
from app.services.vector_store.schema import ScoredChunk
from app.services.verification import CitationValidator, VerificationReport

logger = get_logger(__name__)


class AgentExecutionStep(BaseModel):
    """An individual execution step in the agent reasoning trail."""

    step_number: int
    action: str
    input_data: str
    result_summary: str
    duration_ms: float


class AgentQueryResult(BaseModel):
    """Complete output of the agentic retrieval and reasoning process."""

    query: str
    intent: str
    answer: str
    has_abstained: bool
    confidence_score: float
    reasoning_trail: list[AgentExecutionStep] = Field(default_factory=list)
    citations: list[dict[str, Any]] = Field(default_factory=list)
    verification: VerificationReport
    total_steps: int = 0
    total_tool_calls: int = 0
    total_duration_ms: float = 0.0


class AgenticSearchOrchestrator:
    """Bounded, state-machine driven agent orchestrating multi-hop retrieval and synthesis."""

    def __init__(
        self,
        hybrid_retriever: HybridRetriever | None = None,
        router: QueryRouter | None = None,
    ) -> None:
        from app.api.v1.search import global_bm25_retriever
        self.retriever = hybrid_retriever or HybridRetriever(bm25_retriever=global_bm25_retriever)
        self.router = router or QueryRouter()
        self.max_steps = settings.AGENT_MAX_STEPS
        self.max_tool_calls = settings.AGENT_MAX_TOOL_CALLS

    async def execute_agentic_query(
        self,
        query: str,
        tenant_id: str,
        organization_id: str | None = None,
    ) -> AgentQueryResult:
        start_time = time.perf_counter()
        steps: list[AgentExecutionStep] = []
        accumulated_chunks: list[ScoredChunk] = []
        seen_chunk_ids: set[str] = set()

        tool_calls_count = 0
        step_number = 1

        # Step 1: Query Understanding & Decomposition
        step_start = time.perf_counter()
        classification = self.router.classify_and_route(query)
        steps.append(
            AgentExecutionStep(
                step_number=step_number,
                action="classify_and_decompose",
                input_data=query,
                result_summary=f"Intent: {classification.intent.value}, Sub-queries: {len(classification.sub_queries)}",
                duration_ms=(time.perf_counter() - step_start) * 1000,
            )
        )
        step_number += 1

        # Step 2: Iterative Retrieval across Sub-Queries
        sub_queries = classification.sub_queries if classification.sub_queries else [query]

        for sub_q in sub_queries:
            if step_number > self.max_steps:
                raise AgentBudgetExceededError("steps", self.max_steps)
            if tool_calls_count >= self.max_tool_calls:
                raise AgentBudgetExceededError("tool_calls", self.max_tool_calls)

            step_start = time.perf_counter()
            tool_calls_count += 1

            retrieved_chunks, _ = await self.retriever.search(
                query=sub_q,
                tenant_id=tenant_id,
                organization_id=organization_id,
                top_k=4,
            )

            new_hits = 0
            for c in retrieved_chunks:
                if c.chunk_id not in seen_chunk_ids:
                    seen_chunk_ids.add(c.chunk_id)
                    accumulated_chunks.append(c)
                    new_hits += 1

            steps.append(
                AgentExecutionStep(
                    step_number=step_number,
                    action="execute_hybrid_search",
                    input_data=sub_q,
                    result_summary=f"Retrieved {len(retrieved_chunks)} chunks ({new_hits} new)",
                    duration_ms=(time.perf_counter() - step_start) * 1000,
                )
            )
            step_number += 1

        # Step 3: Neural Reranking over Aggregated Evidence Pool
        step_start = time.perf_counter()
        reranker = get_reranker()
        top_reranked = await reranker.rerank(
            query=query,
            candidates=accumulated_chunks,
            top_k=6,
        )
        steps.append(
            AgentExecutionStep(
                step_number=step_number,
                action="neural_rerank_evidence",
                input_data=f"Pool size: {len(accumulated_chunks)}",
                result_summary=f"Selected {len(top_reranked)} highest-relevance passages",
                duration_ms=(time.perf_counter() - step_start) * 1000,
            )
        )
        step_number += 1

        # Step 4: Multi-Source Evidence Synthesis
        step_start = time.perf_counter()
        llm = get_llm_provider()
        grounded_answer = await llm.generate_grounded_answer(
            query=query,
            context_chunks=top_reranked,
        )
        steps.append(
            AgentExecutionStep(
                step_number=step_number,
                action="synthesize_grounded_answer",
                input_data=f"Context tokens: {grounded_answer.prompt_tokens}",
                result_summary=f"Generated {len(grounded_answer.answer_text)} chars with {len(grounded_answer.citations)} citations",
                duration_ms=(time.perf_counter() - step_start) * 1000,
            )
        )
        step_number += 1

        # Step 5: Citation & Hallucination Verification
        validator = CitationValidator()
        verification = validator.validate_citations(
            answer_text=grounded_answer.answer_text,
            retrieved_chunks=top_reranked,
        )

        total_duration = (time.perf_counter() - start_time) * 1000

        return AgentQueryResult(
            query=query,
            intent=classification.intent.value,
            answer=grounded_answer.answer_text,
            has_abstained=grounded_answer.has_abstained,
            confidence_score=grounded_answer.confidence_score,
            reasoning_trail=steps,
            citations=[c.model_dump() for c in grounded_answer.citations],
            verification=verification,
            total_steps=len(steps),
            total_tool_calls=tool_calls_count,
            total_duration_ms=round(total_duration, 2),
        )
