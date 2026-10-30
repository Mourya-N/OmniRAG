# ADR 001: Hybrid Retrieval (Dense Vector + BM25) and Reciprocal Rank Fusion (RRF)

## Status
Accepted

## Context
Pure dense vector search excels at high-level semantic matching and paraphrase detection, but frequently fails when users search for exact technical terms, acronyms, version numbers, function signatures, or rare product codes (out-of-vocabulary terms). Conversely, sparse lexical retrieval (BM25) guarantees exact token matching but fails to identify synonymous phrases or conceptual overlap.

Furthermore, combining raw cosine similarity scores with BM25 scores via linear weighted addition is notoriously fragile in enterprise environments because BM25 scores are unbounded $[0, \infty)$ and scale with document length, whereas Cosine similarities are bounded $[-1, 1]$. Calibrating a linear weighting parameter across disparate document sets is brittle and requires continuous re-tuning.

## Decision
We adopted a multi-stage **Hybrid Retrieval Engine** combining:
1. Dense vector search via Qdrant HNSW indexing.
2. Sparse lexical search via Okapi BM25.
3. Ranking normalization via **Reciprocal Rank Fusion (RRF)**:
   $$\text{RRF\_Score}(d) = \sum_{m \in \{\text{dense}, \text{sparse}\}} \frac{w_m}{k + \text{rank}_m(d)}$$
   with $k=60$ (constant preventing top-ranked dominance).
4. Stage-2 neural reranking via Cross-Encoder (`bge-reranker-large`).

## Consequences
### Positive
- High Recall@K on both natural language queries and exact technical keywords.
- Zero calibration required between vector distance scales and BM25 term frequencies.
- Outlier scores in one modality cannot artificially dominate the candidate pool.

### Negative / Trade-offs
- Two separate indexing pipelines must be maintained (Qdrant vectors + BM25 inverted index).
- Query execution incurs parallel dispatch to both retrieval systems before fusion.

