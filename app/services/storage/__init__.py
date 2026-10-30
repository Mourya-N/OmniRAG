"""Storage Service Package and Factory."""

from app.core.config import StorageBackendType, settings
from app.services.storage.base import StorageBackend
from app.services.storage.local import LocalStorageBackend
from app.services.storage.s3 import S3StorageBackend

_storage_instance: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    """Return the configured singleton storage backend."""
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_BACKEND == StorageBackendType.S3 or settings.STORAGE_BACKEND == StorageBackendType.MINIO:
            _storage_instance = S3StorageBackend()
        else:
            _storage_instance = LocalStorageBackend()
    return _storage_instance


__all__ = ["StorageBackend", "LocalStorageBackend", "S3StorageBackend", "get_storage_backend"]
