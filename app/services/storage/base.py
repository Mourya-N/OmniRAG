"""Abstract Storage Backend Interface for Object Storage."""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from pathlib import Path


class StorageBackend(ABC):
    """Abstract interface defining required blob storage operations."""

    @abstractmethod
    async def put_object(self, storage_key: str, data: bytes, content_type: str) -> str:
        """Persist binary data and return a canonical storage URI."""
        pass

    @abstractmethod
    async def get_object(self, storage_key: str) -> bytes:
        """Retrieve binary data from storage."""
        pass

    @abstractmethod
    async def delete_object(self, storage_key: str) -> bool:
        """Delete object from storage."""
        pass

    @abstractmethod
    async def get_presigned_url(self, storage_key: str, expires_in_seconds: int = 3600) -> str:
        """Generate a secure pre-signed retrieval URL."""
        pass
