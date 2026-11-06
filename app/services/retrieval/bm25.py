"""Okapi BM25 Lexical Retrieval Engine with Multi-Tenant Filtering."""

import re
from typing import Any

from rank_bm25 import BM25Okapi

from app.services.vector_store.schema import ScoredChunk

# Stopwords set for lexical filtering
STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in",
    "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the",
    "their", "then", "there", "these", "they", "this", "to", "was", "will", "with"
}


def tokenize_text(text: str) -> list[str]:
    """Tokenize, lowercase, and strip punctuation and stopwords."""
    words = re.findall(r"\w+", text.lower())
    return [w for w in words if w not in STOPWORDS]


class BM25Retriever:
    """In-memory or persistent Okapi BM25 index supporting tenant-segregated search."""

    def __init__(self) -> None:
        # Map: tenant_id -> list of chunk dicts
        self._corpus: dict[str, list[dict[str, Any]]] = {}
        # Map: tenant_id -> BM25Okapi instance
        self._indexes: dict[str, BM25Okapi] = {}

    def index_chunks(self, tenant_id: str, chunks: list[dict[str, Any]]) -> None:
        """Build or refresh BM25 index for a tenant."""
        if not chunks:
            return

        tokenized_corpus = [tokenize_text(c["raw_text"]) for c in chunks]
        # Avoid empty token lists which cause BM25 errors
        safe_corpus = [t if t else ["unknown"] for t in tokenized_corpus]

        self._corpus[tenant_id] = chunks
        self._indexes[tenant_id] = BM25Okapi(safe_corpus)

    def remove_document(self, document_id: str) -> None:
        """Purge all chunks associated with a document ID from in-memory BM25 index."""
        for tid in list(self._corpus.keys()):
            self._corpus[tid] = [
                c for c in self._corpus[tid]
                if c.get("document_id") != document_id and c.get("doc_id") != document_id
            ]
            if self._corpus[tid]:
                tokenized_corpus = [tokenize_text(c["raw_text"]) for c in self._corpus[tid]]
                safe_corpus = [t if t else ["unknown"] for t in tokenized_corpus]
                self._indexes[tid] = BM25Okapi(safe_corpus)
            else:
                self._indexes.pop(tid, None)

    def _load_from_db(self, tenant_id: str, organization_id: str | None = None) -> None:
        """Hydrate in-memory index from persistent SQLite storage if cold."""
        try:
            import os
            import sqlite3
            from app.core.config import settings
            db_url = settings.DATABASE_URL or os.getenv("DATABASE_URL", "sqlite+aiosqlite:///omnirag.db")
            db_path = db_url.replace("sqlite+aiosqlite:///", "").replace("sqlite:///", "")
            if not os.path.exists(db_path):
                return
            conn = sqlite3.connect(db_path)
            query = """
                SELECT c.id, d.id as doc_id, o.tenant_id, c.raw_text, c.page_number, c.section_heading, c.content_type, c.parent_chunk_id, d.filename
                FROM document_chunks c
                JOIN document_versions v ON c.version_id = v.id
                JOIN documents d ON v.document_id = d.id
                JOIN organizations o ON d.organization_id = o.id
                WHERE o.tenant_id = ? OR d.organization_id = ?
            """
            rows = conn.execute(query, (tenant_id, organization_id or tenant_id)).fetchall()
            if not rows and tenant_id in ("default", "default_tenant", "dev_tenant", "dev", ""):
                fallback_query = """
                    SELECT c.id, d.id as doc_id, o.tenant_id, c.raw_text, c.page_number, c.section_heading, c.content_type, c.parent_chunk_id, d.filename
                    FROM document_chunks c
                    JOIN document_versions v ON c.version_id = v.id
                    JOIN documents d ON v.document_id = d.id
                    JOIN organizations o ON d.organization_id = o.id
                """
                rows = conn.execute(fallback_query).fetchall()

            chunks = [
                {
                    "chunk_id": r[0],
                    "document_id": r[1],
                    "tenant_id": tenant_id,
                    "raw_text": r[3],
                    "page_number": r[4],
                    "section_heading": r[5],
                    "content_type": r[6],
                    "parent_chunk_id": r[7],
                    "metadata": {"filename": r[8]},
                }
                for r in rows
            ]
            if chunks:
                self.index_chunks(tenant_id, chunks)
            conn.close()
        except Exception:
            pass

    def search(
        self,
        tenant_id: str,
        query: str,
        top_k: int = 10,
        organization_id: str | None = None,
    ) -> list[ScoredChunk]:
        """Execute lexical keyword search for given tenant."""
        if tenant_id not in self._indexes or not self._corpus.get(tenant_id):
            self._load_from_db(tenant_id, organization_id)

        if tenant_id not in self._indexes or not self._corpus.get(tenant_id):
            return []

        query_tokens = tokenize_text(query)
        if not query_tokens:
            return []

        bm25 = self._indexes[tenant_id]
        corpus = self._corpus[tenant_id]
        scores = bm25.get_scores(query_tokens)

        # Pair with chunks and sort descending
        scored_pairs = []
        for chunk, score in zip(corpus, scores, strict=False):
            # Check if any query token is present in chunk text (including root/stem matches)
            chunk_tokens = set(tokenize_text(chunk["raw_text"]))
            has_matching_token = any(
                qt == ct or (len(qt) >= 4 and len(ct) >= 4 and (qt in ct or ct in qt))
                for qt in query_tokens
                for ct in chunk_tokens
            )
            if not has_matching_token:
                continue

            # In small corpora (N < 3), standard Okapi BM25 IDF can be negative.
            # We apply Lucene-style non-negative floor so relevant hits are never discarded.
            effective_score = abs(score) if score <= 0 else score
            if effective_score == 0.0:
                effective_score = 0.5

            if organization_id and chunk.get("organization_id") != organization_id:
                continue
            scored_pairs.append((chunk, float(effective_score)))

        scored_pairs.sort(key=lambda x: x[1], reverse=True)
        top_pairs = scored_pairs[:top_k]

        results: list[ScoredChunk] = []
        for chunk, score in top_pairs:
            results.append(
                ScoredChunk(
                    chunk_id=chunk["chunk_id"],
                    document_id=chunk["document_id"],
                    tenant_id=tenant_id,
                    score=score,
                    raw_text=chunk["raw_text"],
                    page_number=chunk.get("page_number", 1),
                    section_heading=chunk.get("section_heading"),
                    content_type=chunk.get("content_type", "text"),
                    parent_chunk_id=chunk.get("parent_chunk_id"),
                    retrieval_source="bm25",
                    metadata=chunk,
                )
            )

        return results
