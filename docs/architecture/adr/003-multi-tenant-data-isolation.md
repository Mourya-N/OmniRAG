# ADR 003: Multi-Tenant Data Isolation Strategy

## Status
Accepted

## Context
Enterprise AI platforms must guarantee complete multi-tenant data segregation. Two architectural approaches were evaluated:
1. **Physical Isolation**: Dedicated vector collections, database schemas, or separate database instances per tenant.
2. **Logical Partition Isolation**: Shared database tables and shared vector collections where every row and point payload is indexed by `tenant_id` and enforced via database driver and vector query filters.

Physical isolation introduces severe operational overhead at scale: thousands of small vector collections cause memory fragmentation, connection exhaustion, and slow cluster-wide indexing.

## Decision
We implemented **Logical Partition Isolation with Mandatory Two-Stage Security Barriers**:
1. Every PostgreSQL table contains indexed `tenant_id` foreign keys with cascade constraints.
2. Every Qdrant vector point contains an indexed keyword payload `tenant_id`.
3. Pre-Retrieval Filter: All search requests enforce a mandatory `tenant_id` payload filter at the vector engine level.
4. Post-Retrieval Verification: Before chunks are injected into LLM context, the retrieval service verifies document-level permissions (RBAC/ABAC) against active user roles.
5. Insecure Direct Object Reference (IDOR) attacks fail closed at the API gateway layer.

## Consequences
### Positive
- High vector index packing density and efficient GPU/CPU memory utilization.
- Instant tenant onboarding without provision delays.
- Full multi-tenant data privacy verified by automated security regression tests.

### Negative / Trade-offs
- Payload filtering requires indexed keyword fields in Qdrant.
- Stringent testing is required to verify that no code path can ever execute a vector query without an authenticated `tenant_id` filter.

