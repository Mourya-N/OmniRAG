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


async def seed_initial_enterprise_data() -> None:
    """Seed foundational enterprise entities: Founder Admin, Roles, Collections, and Audit Logs."""
    from sqlalchemy import select
    from app.core.security import hash_password
    from app.models.tenant import Organization, Tenant
    from app.models.user import Membership, Role, User
    from app.models.workspace import Collection, QueryTelemetry, SavedQuery
    from app.models.audit import AuditLog

    async with AsyncSessionLocal() as session:
        try:
            # 1. Ensure Founder Tenant exists
            tenant_res = await session.execute(
                select(Tenant).where(Tenant.id == "00000000-0000-0000-0000-000000000001")
            )
            tenant = tenant_res.scalar_one_or_none()
            if not tenant:
                tenant = Tenant(
                    id="00000000-0000-0000-0000-000000000001",
                    name="OmniRAG Founder HQ",
                    slug="omnirag-founder-hq",
                )
                session.add(tenant)
                await session.flush()

            # 2. Ensure Founder Organization exists
            org_res = await session.execute(
                select(Organization).where(Organization.id == "00000000-0000-0000-0000-000000000001")
            )
            org = org_res.scalar_one_or_none()
            if not org:
                org = Organization(
                    id="00000000-0000-0000-0000-000000000001",
                    tenant_id=tenant.id,
                    name="OmniRAG Core",
                    slug="core",
                )
                session.add(org)
                await session.flush()

            # 3. Ensure Roles exist
            admin_role_res = await session.execute(select(Role).where(Role.name == "Admin"))
            admin_role = admin_role_res.scalar_one_or_none()
            if not admin_role:
                admin_role = Role(name="Admin", description="SuperAdmin & Founder executive privilege")
                session.add(admin_role)
                await session.flush()

            user_role_res = await session.execute(select(Role).where(Role.name == "User"))
            user_role = user_role_res.scalar_one_or_none()
            if not user_role:
                user_role = Role(name="User", description="Standard enterprise user account")
                session.add(user_role)
                await session.flush()

            # 4. Ensure Hardcoded Founder Admin account exists (omnirag@founder.mou / qwe123456789)
            admin_email = "omnirag@founder.mou"
            admin_user_res = await session.execute(select(User).where(User.email == admin_email))
            admin_user = admin_user_res.scalar_one_or_none()
            if not admin_user:
                admin_user = User(
                    email=admin_email,
                    password_hash=hash_password("qwe123456789"),
                    full_name="OmniRAG Founder",
                    is_active=True,
                    is_superuser=True,
                )
                session.add(admin_user)
                await session.flush()

                # Add membership as Admin
                mem = Membership(
                    user_id=admin_user.id,
                    organization_id=org.id,
                    role_id=admin_role.id,
                )
                session.add(mem)
                logger.info("founder_admin_seeded", email=admin_email)
            else:
                # Always ensure is_superuser and password match required credentials
                admin_user.is_superuser = True
                admin_user.password_hash = hash_password("qwe123456789")

            # 5. Seed initial Audit Logs if empty
            audit_count_res = await session.execute(select(AuditLog))
            if not audit_count_res.scalars().first():
                session.add_all([
                    AuditLog(
                        tenant_id=tenant.id,
                        organization_id=org.id,
                        user_id=admin_user.id if admin_user else None,
                        action="SYSTEM_INIT_AND_VERIFICATION",
                        resource_type="Database",
                        resource_id="omnirag-core-db",
                        status="SUCCESS",
                        ip_address="127.0.0.1",
                        user_agent="OmniRAG System Daemon",
                        details_json={"event": "Database tables and founder admin account verified"},
                    ),
                    AuditLog(
                        tenant_id=tenant.id,
                        organization_id=org.id,
                        user_id=admin_user.id if admin_user else None,
                        action="SECURITY_RBAC_INITIALIZED",
                        resource_type="Role",
                        resource_id="Admin",
                        status="SUCCESS",
                        ip_address="127.0.0.1",
                        user_agent="OmniRAG System Daemon",
                        details_json={"roles": ["Admin", "User"], "zero_trust": True},
                    ),
                ])

            await session.commit()
            logger.info("initial_enterprise_data_seeded")
        except Exception as exc:
            await session.rollback()
            logger.error("seed_initial_enterprise_data_error", error=str(exc))


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

    # Automatically seed foundational entities: Founder Admin, Roles, Collections, Audit Logs
    try:
        await seed_initial_enterprise_data()
    except Exception as exc:
        logger.error("seed_failed_during_init", error=str(exc))

    # Warm up in-memory BM25 index with existing chunks
    try:
        from collections import defaultdict
        from app.api.v1.search import global_bm25_retriever
        from app.models.document import Document, DocumentChunk, DocumentVersion
        from app.models.tenant import Organization
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            stmt = (
                select(DocumentChunk, Document.id, Document.organization_id, Organization.tenant_id)
                .join(DocumentVersion, DocumentChunk.version_id == DocumentVersion.id)
                .join(Document, DocumentVersion.document_id == Document.id)
                .join(Organization, Document.organization_id == Organization.id)
            )
            rows = (await session.execute(stmt)).all()
            if rows:
                chunks_by_tenant = defaultdict(list)
                for chunk_row, doc_id, org_id, tid in rows:
                    chunks_by_tenant[tid].append({
                        "chunk_id": chunk_row.id,
                        "document_id": doc_id,
                        "raw_text": chunk_row.raw_text,
                        "page_number": chunk_row.page_number,
                        "section_heading": chunk_row.section_heading,
                        "organization_id": org_id,
                    })
                for tid, ch_list in chunks_by_tenant.items():
                    global_bm25_retriever.index_chunks(tid, ch_list)
                logger.info("bm25_index_warmed_up", total_chunks=len(rows))
    except Exception as b_err:
        logger.warning("bm25_warmup_deferred", error=str(b_err))

