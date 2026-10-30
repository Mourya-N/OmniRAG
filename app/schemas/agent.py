"""Pydantic v2 schemas for Agentic Search."""

from typing import Any
from pydantic import BaseModel, Field

from app.services.agent.orchestrator import AgentExecutionStep
from app.services.verification import VerificationReport


class AgentQueryRequest(BaseModel):
    """Payload for invoking the bounded multi-hop agent."""

    query: str = Field(min_length=2, max_length=2000, description="Complex or multi-hop query")
    organization_id: str | None = None


class AgentQueryResponse(BaseModel):
    """Output with full reasoning trail, tool calls, and verified citations."""

    query: str
    intent: str
    answer: str
    has_abstained: bool
    confidence_score: float
    reasoning_trail: list[AgentExecutionStep]
    citations: list[dict[str, Any]]
    verification: VerificationReport
    total_steps: int
    total_tool_calls: int
    total_duration_ms: float
