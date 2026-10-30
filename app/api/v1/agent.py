"""Agentic Search and Multi-Hop Reasoning API Controller."""

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, verify_tenant_boundary
from app.api.v1.search import global_bm25_retriever
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse
from app.services.agent import AgenticSearchOrchestrator
from app.services.retrieval.hybrid import HybridRetriever

router = APIRouter(prefix="/agent", tags=["Agentic Search"])


@router.post("/query", response_model=AgentQueryResponse)
async def query_agent(
    payload: AgentQueryRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> AgentQueryResponse:
    """Execute bounded multi-hop agentic reasoning with intent classification and decomposition."""
    target_org_id = payload.organization_id or current_user.get("organization_id")
    hybrid = HybridRetriever(bm25_retriever=global_bm25_retriever)
    orchestrator = AgenticSearchOrchestrator(hybrid_retriever=hybrid)

    result = await orchestrator.execute_agentic_query(
        query=payload.query,
        tenant_id=tenant_id,
        organization_id=target_org_id,
    )

    return AgentQueryResponse(
        query=result.query,
        intent=result.intent,
        answer=result.answer,
        has_abstained=result.has_abstained,
        confidence_score=result.confidence_score,
        reasoning_trail=result.reasoning_trail,
        citations=result.citations,
        verification=result.verification,
        total_steps=result.total_steps,
        total_tool_calls=result.total_tool_calls,
        total_duration_ms=result.total_duration_ms,
    )
