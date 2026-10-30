"""Unit Tests for Phase 8: Qdrant Indexing and Vector Retrieval."""

import pytest
from app.services.embeddings.mock import MockEmbeddingProvider
from app.services.vector_store.qdrant import QdrantVectorStore
from app.services.vector_store.schema import VectorPoint


@pytest.mark.asyncio
async def test_qdrant_in_memory_lifecycle_and_tenant_isolation():
    # Instantiate in-memory Qdrant client
    vstore = QdrantVectorStore(location=":memory:")
    embedder = MockEmbeddingProvider(dimension=1536)

    col_name = "test_chunks"
    created = await vstore.create_collection_if_not_exists(col_name, dimension=1536)
    assert created is True

    # Attempt re-creation returns False
    created_again = await vstore.create_collection_if_not_exists(col_name, dimension=1536)
    assert created_again is False

    # Create vectors for Tenant A and Tenant B
    text_a = "Enterprise Knowledge Platform with dense vector search"
    vec_a = await embedder.embed_query(text_a)

    text_b = "Competitor platform with separate confidential data"
    vec_b = await embedder.embed_query(text_b)

    points = [
        VectorPoint(
            point_id="11111111-1111-1111-1111-111111111111",
            vector=vec_a,
            payload={
                "chunk_id": "c-1",
                "document_id": "doc-a",
                "tenant_id": "tenant-alpha",
                "raw_text": text_a,
                "page_number": 1,
            },
        ),
        VectorPoint(
            point_id="22222222-2222-2222-2222-222222222222",
            vector=vec_b,
            payload={
                "chunk_id": "c-2",
                "document_id": "doc-b",
                "tenant_id": "tenant-beta",
                "raw_text": text_b,
                "page_number": 1,
            },
        ),
    ]

    upserted_count = await vstore.upsert_points(col_name, points)
    assert upserted_count == 2

    # Search for Tenant Alpha: MUST NOT return Tenant Beta's points
    query_vec = await embedder.embed_query("dense vector search")
    results_alpha = await vstore.search(
        collection_name=col_name,
        query_vector=query_vec,
        tenant_id="tenant-alpha",
        top_k=5,
    )
    assert len(results_alpha) == 1
    assert results_alpha[0].tenant_id == "tenant-alpha"
    assert results_alpha[0].document_id == "doc-a"
    assert "Enterprise Knowledge" in results_alpha[0].raw_text

    # Search for Tenant Beta
    results_beta = await vstore.search(
        collection_name=col_name,
        query_vector=query_vec,
        tenant_id="tenant-beta",
        top_k=5,
    )
    assert len(results_beta) == 1
    assert results_beta[0].tenant_id == "tenant-beta"
    assert results_beta[0].document_id == "doc-b"

    # Search for Non-existent Tenant Gamma returns 0 hits
    results_gamma = await vstore.search(
        collection_name=col_name,
        query_vector=query_vec,
        tenant_id="tenant-gamma",
        top_k=5,
    )
    assert len(results_gamma) == 0

    # Test Delete by Document ID
    del_ok = await vstore.delete_by_document(col_name, "doc-a")
    assert del_ok is True

    # Search again for Tenant Alpha returns 0 hits
    after_del = await vstore.search(
        collection_name=col_name,
        query_vector=query_vec,
        tenant_id="tenant-alpha",
        top_k=5,
    )
    assert len(after_del) == 0

