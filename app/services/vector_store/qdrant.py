"""Qdrant Vector Engine Implementation with Strict Multi-Tenant Isolation."""

import uuid
from typing import Any

from qdrant_client import AsyncQdrantClient, models

from app.core.config import settings
from app.core.exceptions import VectorStoreError
from app.core.logging import get_logger
from app.services.vector_store.base import VectorStore
from app.services.vector_store.schema import ScoredChunk, VectorPoint

logger = get_logger(__name__)


class QdrantVectorStore(VectorStore):
    """Production Qdrant integration supporting dense vectors, payload indexing, and tenant filtering."""

    def __init__(
        self,
        client: AsyncQdrantClient | None = None,
        location: str | None = None,
    ) -> None:
        if client:
            self.client = client
        elif location == ":memory:":
            self.client = AsyncQdrantClient(location=":memory:")
        elif settings.QDRANT_API_KEY:
            self.client = AsyncQdrantClient(
                url=f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}",
                api_key=settings.QDRANT_API_KEY,
            )
        else:
            self.client = AsyncQdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
            )

    async def create_collection_if_not_exists(
        self,
        collection_name: str,
        dimension: int = 1536,
        distance_metric: str = "Cosine",
    ) -> bool:
        """Ensure collection and payload field indexes exist."""
        try:
            collections = await self.client.get_collections()
            existing_names = [c.name for c in collections.collections]
            if collection_name in existing_names:
                return False

            metric_map = {
                "Cosine": models.Distance.COSINE,
                "Euclid": models.Distance.EUCLID,
                "Dot": models.Distance.DOT,
            }
            metric = metric_map.get(distance_metric, models.Distance.COSINE)

            await self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=dimension,
                    distance=metric,
                ),
            )

            # Create payload indexes for fast tenant filtering
            for field_name in ["tenant_id", "organization_id", "document_id", "content_type"]:
                await self.client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field_name,
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )

            logger.info("qdrant_collection_created", collection=collection_name, dimension=dimension)
            return True
        except Exception as e:
            raise VectorStoreError(f"Failed to create collection '{collection_name}': {e}") from e

    async def upsert_points(self, collection_name: str, points: list[VectorPoint]) -> int:
        """Upsert points into Qdrant collection."""
        if not points:
            return 0

        qdrant_points: list[models.PointStruct] = []
        for p in points:
            # Point ID must be integer or valid UUID string
            try:
                point_id = str(uuid.UUID(p.point_id))
            except ValueError:
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, p.point_id))

            qdrant_points.append(
                models.PointStruct(
                    id=point_id,
                    vector=p.vector,
                    payload=p.payload,
                )
            )

        try:
            await self.client.upsert(
                collection_name=collection_name,
                points=qdrant_points,
                wait=True,
            )
            return len(qdrant_points)
        except Exception as e:
            raise VectorStoreError(f"Failed to upsert points to Qdrant: {e}") from e

    async def search(
        self,
        collection_name: str,
        query_vector: list[float],
        tenant_id: str,
        top_k: int = 10,
        organization_id: str | None = None,
        allowed_roles: list[str] | None = None,
        score_threshold: float | None = None,
    ) -> list[ScoredChunk]:
        """Execute vector search with strict pre-filtering by tenant_id."""
        must_conditions: list[models.FieldCondition] = [
            models.FieldCondition(
                key="tenant_id",
                match=models.MatchValue(value=tenant_id),
            )
        ]

        if organization_id:
            must_conditions.append(
                models.FieldCondition(
                    key="organization_id",
                    match=models.MatchValue(value=organization_id),
                )
            )

        query_filter = models.Filter(must=must_conditions)

        try:
            response = await self.client.query_points(
                collection_name=collection_name,
                query=query_vector,
                query_filter=query_filter,
                limit=top_k,
                score_threshold=score_threshold,
            )
            search_results = response.points

            scored_chunks: list[ScoredChunk] = []
            for hit in search_results:
                payload = hit.payload or {}
                scored_chunks.append(
                    ScoredChunk(
                        chunk_id=payload.get("chunk_id", str(hit.id)),
                        document_id=payload.get("document_id", ""),
                        tenant_id=payload.get("tenant_id", tenant_id),
                        score=float(hit.score),
                        raw_text=payload.get("raw_text", ""),
                        page_number=int(payload.get("page_number", 1)),
                        section_heading=payload.get("section_heading"),
                        content_type=payload.get("content_type", "text"),
                        parent_chunk_id=payload.get("parent_chunk_id"),
                        retrieval_source="dense_vector",
                        metadata=payload,
                    )
                )

            return scored_chunks
        except Exception as e:
            raise VectorStoreError(f"Failed to execute vector search in Qdrant: {e}") from e

    async def delete_by_document(self, collection_name: str, document_id: str) -> bool:
        """Delete all points matching document_id."""
        try:
            await self.client.delete(
                collection_name=collection_name,
                points_selector=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=document_id),
                        )
                    ]
                ),
            )
            return True
        except Exception as e:
            raise VectorStoreError(f"Failed to delete points for document '{document_id}': {e}") from e
