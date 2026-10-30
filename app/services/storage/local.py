"""Local Filesystem Object Storage Provider for Development & Testing."""

from pathlib import Path

from app.core.config import settings
from app.services.storage.base import StorageBackend


class LocalStorageBackend(StorageBackend):
    """Stores files on the local filesystem under settings.LOCAL_STORAGE_DIR."""

    def __init__(self, base_dir: Path | None = None) -> None:
        self.base_dir = base_dir or settings.LOCAL_STORAGE_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, storage_key: str) -> Path:
        clean_key = storage_key.lstrip("/")
        dest = self.base_dir / clean_key
        dest.parent.mkdir(parents=True, exist_ok=True)
        return dest

    async def put_object(self, storage_key: str, data: bytes, content_type: str) -> str:
        dest_path = self._resolve_path(storage_key)
        dest_path.write_bytes(data)
        return f"file://{dest_path.resolve()}"

    async def get_object(self, storage_key: str) -> bytes:
        dest_path = self._resolve_path(storage_key)
        if not dest_path.exists():
            raise FileNotFoundError(f"Storage key '{storage_key}' not found at {dest_path}")
        return dest_path.read_bytes()

    async def delete_object(self, storage_key: str) -> bool:
        dest_path = self._resolve_path(storage_key)
        if dest_path.exists():
            dest_path.unlink()
            return True
        return False

    async def get_presigned_url(self, storage_key: str, expires_in_seconds: int = 3600) -> str:
        dest_path = self._resolve_path(storage_key)
        return f"file://{dest_path.resolve()}"
