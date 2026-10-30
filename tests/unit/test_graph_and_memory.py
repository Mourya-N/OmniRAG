"""Unit Tests for Phase 15 & 16: Knowledge Graph and Conversation Memory."""

from app.services.graph import KnowledgeGraphEngine
from app.services.memory import ConversationMemoryManager


def test_knowledge_graph_traversal():
    kg = KnowledgeGraphEngine()

    # Build graph relationships
    # FastAPI -> USES -> Pydantic
    # FastAPI -> USES -> SQLAlchemy
    # SQLAlchemy -> DEPENDS_ON -> PostgreSQL
    # PostgreSQL -> STORES -> DocumentChunks
    kg.add_relation("FastAPI", "Pydantic", "USES", chunk_id="chunk-1")
    kg.add_relation("FastAPI", "SQLAlchemy", "USES", chunk_id="chunk-2")
    kg.add_relation("SQLAlchemy", "PostgreSQL", "DEPENDS_ON", chunk_id="chunk-3")
    kg.add_relation("PostgreSQL", "DocumentChunks", "STORES", chunk_id="chunk-4")

    # 1-hop traversal from FastAPI
    hop1 = kg.traverse_hops("FastAPI", max_hops=1)
    targets_1 = {h["target"] for h in hop1}
    assert "Pydantic" in targets_1
    assert "SQLAlchemy" in targets_1
    assert "PostgreSQL" not in targets_1

    # 2-hop traversal from FastAPI
    hop2 = kg.traverse_hops("FastAPI", max_hops=2)
    targets_2 = {h["target"] for h in hop2}
    assert "PostgreSQL" in targets_2

    # Check chunk lineage is preserved
    pg_hop = next(h for h in hop2 if h["target"] == "PostgreSQL")
    assert "chunk-3" in pg_hop["chunk_ids"]


def test_conversation_memory_and_isolation():
    manager = ConversationMemoryManager(max_context_messages=3)

    # 1. Test sliding window truncation
    messages = [
        {"role": "user", "content": "Msg 1"},
        {"role": "assistant", "content": "Reply 1"},
        {"role": "user", "content": "Msg 2"},
        {"role": "assistant", "content": "Reply 2"},
        {"role": "user", "content": "Msg 3"},
    ]
    windowed = manager.format_sliding_history(messages)
    assert len(windowed) == 3
    assert windowed[0]["content"] == "Msg 2"
    assert windowed[-1]["content"] == "Msg 3"

    # 2. Test user memory storage & tenant/user isolation
    manager.store_user_fact("tenant-A", "user-1", "preferred_format", "markdown_tables")
    manager.store_user_fact("tenant-B", "user-2", "preferred_format", "bullet_points")

    facts_u1 = manager.get_user_facts("tenant-A", "user-1")
    assert len(facts_u1) == 1
    assert facts_u1[0].value == "markdown_tables"

    # Cross-tenant and cross-user checks
    assert len(manager.get_user_facts("tenant-A", "user-2")) == 0
    assert len(manager.get_user_facts("tenant-B", "user-1")) == 0

    # 3. Memory Deletion
    deleted = manager.clear_user_memory("tenant-A", "user-1")
    assert deleted is True
    assert len(manager.get_user_facts("tenant-A", "user-1")) == 0

