"""Hybrid Retrieval Engine with Reciprocal Rank Fusion (RRF) and Weighted Fusion."""

from typing import Any
from pydantic import BaseModel, Field

from app.core.config import settings
from app.services.embeddings import EmbeddingProvider, get_embedding_provider
from app.services.retrieval.bm25 import BM25Retriever
from app.services.vector_store import VectorStore, get_vector_store
from app.services.vector_store.schema import ScoredChunk


class FusionDiagnostic(BaseModel):
    """Detailed diagnostic lineage for a fused retrieval result."""

    chunk_id: str
    dense_rank: int | None = None
    sparse_rank: int | None = None
    dense_score: float | None = None
    sparse_score: float | None = None
    rrf_score: float = 0.0
    final_rank: int = 0


def reciprocal_rank_fusion(
    dense_results: list[ScoredChunk],
    sparse_results: list[ScoredChunk],
    k: int = 60,
    dense_weight: float = 1.0,
    sparse_weight: float = 1.0,
    top_k: int = 10,
) -> tuple[list[ScoredChunk], list[FusionDiagnostic]]:
    """Merges dense and sparse rankings using Reciprocal Rank Fusion (RRF).

    Formula:
        RRF_Score(doc) = (dense_weight / (k + rank_dense)) + (sparse_weight / (k + rank_sparse))
    """
    scores: dict[str, float] = {}
    chunk_map: dict[str, ScoredChunk] = {}
    dense_ranks: dict[str, int] = {}
    dense_scores: dict[str, float] = {}
    sparse_ranks: dict[str, int] = {}
    sparse_scores: dict[str, float] = {}

    # 1. Process Dense Ranking
    for rank, chunk in enumerate(dense_results, start=1):
        cid = chunk.chunk_id
        chunk_map[cid] = chunk
        dense_ranks[cid] = rank
        dense_scores[cid] = chunk.score
        scores[cid] = scores.get(cid, 0.0) + (dense_weight / (k + rank))

    # 2. Process Sparse Ranking
    for rank, chunk in enumerate(sparse_results, start=1):
        cid = chunk.chunk_id
        chunk_map[cid] = chunk
        sparse_ranks[cid] = rank
        sparse_scores[cid] = chunk.score
        scores[cid] = scores.get(cid, 0.0) + (sparse_weight / (k + rank))

    # 3. Sort by fused RRF score descending
    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    fused_chunks: list[ScoredChunk] = []
    diagnostics: list[FusionDiagnostic] = []

    for final_rank, (cid, rrf_score) in enumerate(sorted_items[:top_k], start=1):
        original_chunk = chunk_map[cid]
        # Clone chunk with updated RRF score
        fused_chunk = ScoredChunk(
            chunk_id=original_chunk.chunk_id,
            document_id=original_chunk.document_id,
            tenant_id=original_chunk.tenant_id,
            score=rrf_score,
            raw_text=original_chunk.raw_text,
            page_number=original_chunk.page_number,
            section_heading=original_chunk.section_heading,
            content_type=original_chunk.content_type,
            parent_chunk_id=original_chunk.parent_chunk_id,
            retrieval_source="hybrid_rrf",
            metadata=original_chunk.metadata,
        )
        fused_chunks.append(fused_chunk)

        diagnostics.append(
            FusionDiagnostic(
                chunk_id=cid,
                dense_rank=dense_ranks.get(cid),
                sparse_rank=sparse_ranks.get(cid),
                dense_score=dense_scores.get(cid),
                sparse_score=sparse_scores.get(cid),
                rrf_score=rrf_score,
                final_rank=final_rank,
            )
        )

    return fused_chunks, diagnostics


class HybridRetriever:
    """Enterprise Hybrid Retrieval Orchestrator coordinating Dense and Sparse systems."""

    def __init__(
        self,
        vector_store: VectorStore | None = None,
        bm25_retriever: BM25Retriever | None = None,
        embedding_provider: EmbeddingProvider | None = None,
    ) -> None:
        self.vector_store = vector_store or get_vector_store()
        self.bm25_retriever = bm25_retriever or BM25Retriever()
        self.embedder = embedding_provider or get_embedding_provider()

    async def search(
        self,
        query: str,
        tenant_id: str,
        collection_name: str = "omnirag_chunks",
        top_k: int = 10,
        organization_id: str | None = None,
        dense_weight: float = 1.0,
        sparse_weight: float = 1.0,
    ) -> tuple[list[ScoredChunk], list[FusionDiagnostic]]:
        """Execute hybrid search using parallel candidate retrieval and RRF fusion."""
        # 1. Dense Vector Search
        dense_results = []
        try:
            query_vector = await self.embedder.embed_query(query)
            dense_results = await self.vector_store.search(
                collection_name=collection_name,
                query_vector=query_vector,
                tenant_id=tenant_id,
                top_k=settings.RETRIEVAL_TOP_K_DENSE,
                organization_id=organization_id,
            )
        except Exception as dense_err:
            from app.core.logging import get_logger
            get_logger(__name__).warning("dense_search_unavailable_falling_back_to_sparse", error=str(dense_err))

        # 2. Sparse BM25 Search
        sparse_results = self.bm25_retriever.search(
            tenant_id=tenant_id,
            query=query,
            top_k=settings.RETRIEVAL_TOP_K_SPARSE,
            organization_id=organization_id,
        )

        # 3. Reciprocal Rank Fusion
        fused_chunks, diagnostics = reciprocal_rank_fusion(
            dense_results=dense_results,
            sparse_results=sparse_results,
            k=settings.RRF_SMOOTHING_CONSTANT,
            dense_weight=dense_weight,
            sparse_weight=sparse_weight,
            top_k=top_k,
        )

        return fused_chunks, diagnostics
