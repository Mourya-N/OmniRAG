"""Persistent Conversation Memory & Sliding Context Window Management."""

from typing import Any
from pydantic import BaseModel, Field


class MemoryEntry(BaseModel):
    """An episodic memory item stored for a user."""

    key: str
    value: str
    tenant_id: str
    user_id: str


class ConversationMemoryManager:
    """Manages short-term conversation context and long-term user facts."""

    def __init__(self, max_context_messages: int = 10) -> None:
        self.max_context_messages = max_context_messages
        # Tenant -> User -> Key -> MemoryEntry
        self._user_memory_store: dict[str, dict[str, dict[str, MemoryEntry]]] = {}

    def format_sliding_history(
        self,
        messages: list[dict[str, str]],
    ) -> list[dict[str, str]]:
        """Returns the most recent messages fitting within the context window limit."""
        if len(messages) <= self.max_context_messages:
            return messages
        return messages[-self.max_context_messages:]

    def store_user_fact(self, tenant_id: str, user_id: str, key: str, value: str) -> None:
        """Persist a user preference or fact strictly isolated by tenant and user."""
        if tenant_id not in self._user_memory_store:
            self._user_memory_store[tenant_id] = {}
        if user_id not in self._user_memory_store[tenant_id]:
            self._user_memory_store[tenant_id][user_id] = {}

        self._user_memory_store[tenant_id][user_id][key] = MemoryEntry(
            key=key,
            value=value,
            tenant_id=tenant_id,
            user_id=user_id,
        )

    def get_user_facts(self, tenant_id: str, user_id: str) -> list[MemoryEntry]:
        """Retrieve all active long-term facts for a user."""
        return list(self._user_memory_store.get(tenant_id, {}).get(user_id, {}).values())

    def clear_user_memory(self, tenant_id: str, user_id: str) -> bool:
        """Clear all stored long-term memory for a user (GDPR/compliance deletion)."""
        if tenant_id in self._user_memory_store and user_id in self._user_memory_store[tenant_id]:
            del self._user_memory_store[tenant_id][user_id]
            return True
        return False

