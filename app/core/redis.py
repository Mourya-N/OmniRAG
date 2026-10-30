"""Redis client connection pool and semantic caching helpers."""

from typing import Any

import redis.asyncio as aioredis
from redis.asyncio import Redis

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_redis_pool: aioredis.ConnectionPool | None = None


def get_redis_pool() -> aioredis.ConnectionPool:
    """Retrieve or initialize the global Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.ConnectionPool(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD or None,
            db=settings.REDIS_DB,
            decode_responses=True,
            max_connections=50,
        )
    return _redis_pool


def get_redis_client() -> Redis:
    """Return an active Redis client using the shared connection pool."""
    return Redis(connection_pool=get_redis_pool())


async def close_redis() -> None:
    """Safely drain and close the Redis connection pool on shutdown."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.disconnect()
        _redis_pool = None
        logger.info("redis_connection_pool_closed")
