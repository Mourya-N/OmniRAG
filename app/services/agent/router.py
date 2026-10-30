"""Query Understanding, Intent Classification, and Query Rewriting."""

import re
from enum import Enum
from pydantic import BaseModel, Field


class QueryIntent(str, Enum):
    DIRECT_RETRIEVAL = "DIRECT_RETRIEVAL"
    MULTI_HOP = "MULTI_HOP"
    TABLE_NUMERIC = "TABLE_NUMERIC"
    COMPARISON = "COMPARISON"
    CLARIFICATION = "CLARIFICATION"


class QueryClassification(BaseModel):
    """Result of analyzing and categorizing user intent."""

    original_query: str
    intent: QueryIntent
    sub_queries: list[str] = Field(default_factory=list)
    confidence: float = 0.90
    rewritten_queries: list[str] = Field(default_factory=list)


class QueryRouter:
    """Classifies user queries to route them either to direct fast-path or agentic reasoning."""

    def classify_and_route(self, query: str) -> QueryClassification:
        q_lower = query.lower()

        # 1. Check for Table / Numeric questions
        if any(w in q_lower for w in ["total", "sum", "average", "mean", "highest", "lowest", "revenue", "cost"]):
            return QueryClassification(
                original_query=query,
                intent=QueryIntent.TABLE_NUMERIC,
                sub_queries=[query],
                rewritten_queries=[query],
            )

        # 2. Check for Comparison questions
        if any(w in q_lower for w in ["compare", "difference between", "versus", "vs", "better than"]):
            parts = re.split(r"\b(?:compare|versus|vs|and)\b", q_lower)
            sub_q = [p.strip() for p in parts if len(p.strip()) > 3]
            return QueryClassification(
                original_query=query,
                intent=QueryIntent.COMPARISON,
                sub_queries=sub_q if len(sub_q) >= 2 else [query],
                rewritten_queries=[query],
            )

        # 3. Check for Multi-Hop / Complex conjunction questions
        if any(w in q_lower for w in ["how does", "how", "explain", "why", "first", "then"]) and any(conj in q_lower for conj in [" and ", " then ", " as well as "]):
            # Decompose into sub-queries
            sub_queries = [s.strip() for s in re.split(r"\band\b|\bthen\b|\bas well as\b", query, flags=re.IGNORECASE) if len(s.strip()) > 5]
            return QueryClassification(
                original_query=query,
                intent=QueryIntent.MULTI_HOP,
                sub_queries=sub_queries if len(sub_queries) > 1 else [query],
                rewritten_queries=[query, f"{query} enterprise architecture details"],
            )

        # 4. Default: Fast-path direct retrieval
        return QueryClassification(
            original_query=query,
            intent=QueryIntent.DIRECT_RETRIEVAL,
            sub_queries=[query],
            rewritten_queries=[query],
        )
