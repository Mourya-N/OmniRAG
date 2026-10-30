"""Database connection, engine configuration, and session management.

Supports PostgreSQL via asyncpg in production and SQLite via aiosqlite for tests.
"""

from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy import MetaData
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Standard naming conventions for constraints and indexes
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy ORM models."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def build_engine(database_url: str | None = None) -> AsyncEngine:
    """Create and configure an asynchronous SQLAlchemy engine."""
    uri = database_url or settings.async_database_uri
    engine_kwargs: dict[str, Any] = {"echo": settings.DEBUG}

    if "sqlite" in uri:
        # SQLite parameters
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        # Production PostgreSQL connection pool settings
        engine_kwargs["pool_size"] = settings.POSTGRES_POOL_SIZE
        engine_kwargs["max_overflow"] = settings.POSTGRES_MAX_OVERFLOW
        engine_kwargs["pool_pre_ping"] = True

    return create_async_engine(uri, **engine_kwargs)


engine: AsyncEngine = build_engine()
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for yielding an isolated async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_database_tables() -> None:
    """Ensure all required database tables exist for user authentication and multi-tenant data.

    Attempts connection to the configured database (e.g. PostgreSQL).
    If PostgreSQL is unavailable locally, automatically provisions a persistent SQLite database (omnirag.db).
    """
    global engine, AsyncSessionLocal
    import app.models  # noqa: F401

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("database_tables_initialized", uri=str(engine.url))
    except Exception as exc:
        if "sqlite" not in str(engine.url):
            logger.warning(
                "postgres_connection_unavailable",
                error=str(exc),
                message="PostgreSQL is not running on localhost. Automatically switching to persistent SQLite database (omnirag.db) for user data storage.",
            )
            engine = create_async_engine(
                "sqlite+aiosqlite:///./omnirag.db",
                connect_args={"check_same_thread": False},
            )
            AsyncSessionLocal.configure(bind=engine)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("sqlite_fallback_tables_initialized", path="./omnirag.db")
        else:
            raise

