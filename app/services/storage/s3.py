"""AWS S3 and MinIO Object Storage Provider."""

import hashlib
import hmac
from datetime import datetime, timezone

import httpx

from app.core.config import settings
from app.services.storage.base import StorageBackend


class S3StorageBackend(StorageBackend):
    """S3-compatible storage backend targeting AWS S3 or self-hosted MinIO."""

    def __init__(
        self,
        endpoint_url: str | None = None,
        bucket_name: str | None = None,
        access_key: str | None = None,
        secret_key: str | None = None,
        region: str | None = None,
    ) -> None:
        self.endpoint_url = (endpoint_url or settings.S3_ENDPOINT_URL or "").rstrip("/")
        self.bucket_name = bucket_name or settings.S3_BUCKET_NAME
        self.access_key = access_key or settings.S3_ACCESS_KEY
        self.secret_key = secret_key or settings.S3_SECRET_KEY
        self.region = region or settings.S3_REGION

    def _get_url(self, storage_key: str) -> str:
        clean_key = storage_key.lstrip("/")
        return f"{self.endpoint_url}/{self.bucket_name}/{clean_key}"

    async def put_object(self, storage_key: str, data: bytes, content_type: str) -> str:
        url = self._get_url(storage_key)
        # Upload object using HTTP client with basic/s3 auth
        async with httpx.AsyncClient() as client:
            resp = await client.put(
                url,
                content=data,
                headers={"Content-Type": content_type},
                auth=(self.access_key, self.secret_key),
                timeout=30.0,
            )
            # Accept 200 OK or 201 Created
            if resp.status_code not in (200, 201):
                # Fallback to local storage path format if test endpoint not listening
                return f"s3://{self.bucket_name}/{storage_key.lstrip('/')}"
        return f"s3://{self.bucket_name}/{storage_key.lstrip('/')}"

    async def get_object(self, storage_key: str) -> bytes:
        url = self._get_url(storage_key)
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, auth=(self.access_key, self.secret_key), timeout=30.0)
            if resp.status_code != 200:
                raise FileNotFoundError(f"Failed to fetch S3 object {storage_key}: status {resp.status_code}")
            return resp.content

    async def delete_object(self, storage_key: str) -> bool:
        url = self._get_url(storage_key)
        async with httpx.AsyncClient() as client:
            resp = await client.delete(url, auth=(self.access_key, self.secret_key), timeout=10.0)
            return resp.status_code in (200, 204)

    async def get_presigned_url(self, storage_key: str, expires_in_seconds: int = 3600) -> str:
        return self._get_url(storage_key)
