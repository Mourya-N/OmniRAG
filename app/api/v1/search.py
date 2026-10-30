"""Enterprise Search and Retrieval API Controller."""

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, verify_tenant_boundary
from app.core.config import settings
from app.schemas.retrieval import SearchHit, SearchRequest, SearchResponse
from app.services.embeddings import get_embedding_provider
from app.services.reranking import get_reranker
from app.services.retrieval.bm25 import BM25Retriever
from app.services.retrieval.hybrid import HybridRetriever, reciprocal_rank_fusion
from app.services.vector_store import get_vector_store

router = APIRouter(prefix="/search", tags=["Search & Retrieval"])

# Shared singleton in-memory BM25 index for fast lookup
global_bm25_retriever = BM25Retriever()


@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search(
    payload: SearchRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SearchResponse:
    """Execute multi-stage hybrid search: Dense (Qdrant) + Sparse (BM25) with RRF and Neural Reranking."""
    target_org_id = payload.organization_id or current_user.get("organization_id")
    hybrid = HybridRetriever(bm25_retriever=global_bm25_retriever)

    fused_chunks, diagnostics = await hybrid.search(
        query=payload.query,
        tenant_id=tenant_id,
        collection_name=settings.QDRANT_COLLECTION_NAME,
        top_k=payload.top_k * 2 if payload.enable_reranking else payload.top_k,
        organization_id=target_org_id,
        dense_weight=payload.dense_weight,
        sparse_weight=payload.sparse_weight,
    )

    final_chunks = fused_chunks
    strategy = "hybrid_rrf"

    if payload.enable_reranking and fused_chunks:
        reranker = get_reranker()
        final_chunks = await reranker.rerank(
            query=payload.query,
            candidates=fused_chunks,
            top_k=payload.top_k,
            score_threshold=payload.reranker_score_threshold,
        )
        strategy = "hybrid_rrf_neural_reranked"

    hits = [
        SearchHit(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            tenant_id=c.tenant_id,
            score=c.score,
            raw_text=c.raw_text,
            page_number=c.page_number,
            section_heading=c.section_heading,
            content_type=c.content_type,
            parent_chunk_id=c.parent_chunk_id,
            retrieval_source=c.retrieval_source,
        )
        for c in final_chunks
    ]

    return SearchResponse(
        query=payload.query,
        total_hits=len(hits),
        hits=hits,
        diagnostics=diagnostics,
        retrieval_strategy=strategy,
    )


@router.post("/dense", response_model=SearchResponse)
async def dense_search(
    payload: SearchRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SearchResponse:
    """Execute dense vector search against Qdrant."""
    target_org_id = payload.organization_id or current_user.get("organization_id")
    vstore = get_vector_store()
    embedder = get_embedding_provider()

    query_vec = await embedder.embed_query(payload.query)
    chunks = await vstore.search(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        query_vector=query_vec,
        tenant_id=tenant_id,
        top_k=payload.top_k,
        organization_id=target_org_id,
    )

    hits = [
        SearchHit(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            tenant_id=c.tenant_id,
            score=c.score,
            raw_text=c.raw_text,
            page_number=c.page_number,
            section_heading=c.section_heading,
            content_type=c.content_type,
            parent_chunk_id=c.parent_chunk_id,
            retrieval_source="dense_vector",
        )
        for c in chunks
    ]

    return SearchResponse(
        query=payload.query,
        total_hits=len(hits),
        hits=hits,
        diagnostics=[],
        retrieval_strategy="dense_vector_only",
    )


@router.post("/bm25", response_model=SearchResponse)
async def bm25_search(
    payload: SearchRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> SearchResponse:
    """Execute BM25 lexical keyword search."""
    target_org_id = payload.organization_id or current_user.get("organization_id")
    chunks = global_bm25_retriever.search(
        tenant_id=tenant_id,
        query=payload.query,
        top_k=payload.top_k,
        organization_id=target_org_id,
    )

    hits = [
        SearchHit(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            tenant_id=c.tenant_id,
            score=c.score,
            raw_text=c.raw_text,
            page_number=c.page_number,
            section_heading=c.section_heading,
            content_type=c.content_type,
            parent_chunk_id=c.parent_chunk_id,
            retrieval_source="bm25_lexical",
        )
        for c in chunks
    ]

    return SearchResponse(
        query=payload.query,
        total_hits=len(hits),
        hits=hits,
        diagnostics=[],
        retrieval_strategy="bm25_lexical_only",
    )

