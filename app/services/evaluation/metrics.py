"""Evaluation Metrics Engine: Retrieval (Recall@K, MRR, NDCG) and Generation (RAG Triad)."""

import math
from typing import Any
from pydantic import BaseModel, Field

from app.services.vector_store.schema import ScoredChunk


class EvaluationMetrics(BaseModel):
    """Aggregate benchmark results across an evaluation dataset."""

    sample_count: int
    recall_at_5: float
    precision_at_5: float
    mrr: float
    ndcg_at_10: float
    faithfulness: float
    citation_accuracy: float
    abstention_accuracy: float
    latency_p50_ms: float
    latency_p95_ms: float
    total_cost_usd: float


def calculate_recall_at_k(retrieved_ids: list[str], gold_ids: set[str], k: int = 5) -> float:
    """Computes Recall@K: fraction of relevant gold chunks retrieved in top-K."""
    if not gold_ids:
        return 1.0
    top_k_retrieved = set(retrieved_ids[:k])
    return len(top_k_retrieved & gold_ids) / len(gold_ids)


def calculate_precision_at_k(retrieved_ids: list[str], gold_ids: set[str], k: int = 5) -> float:
    """Computes Precision@K: fraction of retrieved top-K chunks that are relevant."""
    if not retrieved_ids or k <= 0:
        return 0.0
    top_k = retrieved_ids[:k]
    return len(set(top_k) & gold_ids) / len(top_k)


def calculate_mrr(retrieved_ids: list[str], gold_ids: set[str]) -> float:
    """Computes Mean Reciprocal Rank: reciprocal of the rank of the first relevant chunk."""
    if not gold_ids:
        return 1.0
    for rank, cid in enumerate(retrieved_ids, start=1):
        if cid in gold_ids:
            return 1.0 / rank
    return 0.0


def calculate_ndcg_at_k(retrieved_ids: list[str], gold_ids: set[str], k: int = 10) -> float:
    """Computes Normalized Discounted Cumulative Gain at K."""
    if not gold_ids:
        return 1.0

    dcg = 0.0
    for i, cid in enumerate(retrieved_ids[:k]):
        rel = 1.0 if cid in gold_ids else 0.0
        dcg += rel / math.log2(i + 2)

    # Ideal DCG
    idcg = sum(1.0 / math.log2(i + 2) for i in range(min(len(gold_ids), k)))
    return dcg / idcg if idcg > 0 else 0.0


def estimate_query_cost_usd(
    prompt_tokens: int,
    completion_tokens: int,
    input_rate_per_million: float = 0.15,
    output_rate_per_million: float = 0.60,
) -> float:
    """Calculate query financial cost in USD using model provider pricing tiers."""
    in_cost = (prompt_tokens / 1_000_000.0) * input_rate_per_million
    out_cost = (completion_tokens / 1_000_000.0) * output_rate_per_million
    return round(in_cost + out_cost, 6)

