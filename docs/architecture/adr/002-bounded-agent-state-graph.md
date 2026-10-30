# ADR 002: Bounded Agent State Graph vs. Autonomous Unbounded Loops

## Status
Accepted

## Context
Autonomous agent frameworks that permit unbounded ReAct loops often encounter infinite reasoning loops, catastrophic token budget exhaustion, unpredictable latency spikes (e.g. 60+ seconds), and uncontrolled API cost blowups when confronted with ambiguous or unanswerable queries.

Enterprise knowledge systems require strict Service Level Objectives (SLOs): predictable P95 latencies ($\le 1.8\text{ s}$ for streaming, $\le 250\text{ ms}$ for search), capped query costs, and deterministic error handling.

## Decision
We implemented a **Bounded Agent Orchestration Graph** with deterministic fast-path bypass and hard limits:
1. Deterministic Fast-Path: Queries classified as `DIRECT_RETRIEVAL` bypass multi-agent loops and execute directly via single-shot hybrid search.
2. State Graph Decomposition: Complex questions are decomposed into sub-queries.
3. Hard Execution Bounds:
   - `MAX_STEPS = 5`
   - `MAX_TOOL_CALLS = 8`
   - `MAX_TOKEN_BUDGET = 16,000`
   - `TIMEOUT_SECONDS = 25`
4. Strict Abstention: If retrieved evidence is insufficient, the model explicitly abstains rather than inventing answers or looping indefinitely.

## Consequences
### Positive
- Strict, enforceable upper bound on query execution time and financial cost.
- Eliminates runaway agent loops on ambiguous questions.
- High explainability: complete reasoning trail is logged with step numbers and durations.

### Negative / Trade-offs
- Queries requiring more than 5 reasoning hops must be decomposed by the user into multiple questions.

