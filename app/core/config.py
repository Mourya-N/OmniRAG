"""Application configuration management using Pydantic Settings v2.

Adheres strictly to Twelve-Factor App principles. All configuration values are
loaded from environment variables or .env files with strong type validation.
"""

from enum import Enum
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class EnvironmentType(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class StorageBackendType(str, Enum):
    LOCAL = "local"
    S3 = "s3"
    MINIO = "minio"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # General Project Settings
    PROJECT_NAME: str = "OmniRAG Knowledge Intelligence Platform"
    ENVIRONMENT: EnvironmentType = EnvironmentType.DEVELOPMENT
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Security & Tokens
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        description="Cryptographic secret key for signing JWT tokens",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google OAuth2 Configuration
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/google/callback"

    # Database Configuration (PostgreSQL 16)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "omnirag_admin"
    POSTGRES_PASSWORD: str = "omnirag_secure_password"
    POSTGRES_DB: str = "omnirag"
    POSTGRES_POOL_SIZE: int = 20
    POSTGRES_MAX_OVERFLOW: int = 10
    DATABASE_URL: str | None = None

    # SQLite Test Database override (for self-contained fast testing)
    USE_SQLITE_TEST_DB: bool = False
    SQLITE_DB_PATH: str = "./test_omnirag.db"

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str | None = None
    REDIS_DB: int = 0
    REDIS_CACHE_TTL_SECONDS: int = 3600
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Vector Database Configuration (Qdrant)
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_GRPC_PORT: int = 6334
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION_NAME: str = "omnirag_chunks"
    QDRANT_VECTOR_DIMENSION: int = 1536
    QDRANT_DISTANCE_METRIC: Literal["Cosine", "Euclid", "Dot"] = "Cosine"

    # Object Storage Configuration
    STORAGE_BACKEND: StorageBackendType = StorageBackendType.LOCAL
    LOCAL_STORAGE_DIR: Path = Path("./data/storage")
    S3_ENDPOINT_URL: str | None = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_NAME: str = "omnirag-documents"
    S3_REGION: str = "us-east-1"
    MAX_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB

    # Model & AI Configuration
    DEFAULT_LLM_PROVIDER: Literal["openai", "anthropic", "gemini", "mock"] = "mock"
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    DEFAULT_EMBEDDING_PROVIDER: Literal["openai", "huggingface", "mock"] = "mock"
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSION: int = 1536

    # Retrieval & Reranker Configuration
    RETRIEVAL_TOP_K_DENSE: int = 30
    RETRIEVAL_TOP_K_SPARSE: int = 30
    RRF_SMOOTHING_CONSTANT: int = 60
    RERANKER_TOP_K: int = 10
    RERANKER_SCORE_THRESHOLD: float = 0.35

    # Bounded Agent Execution Bounds
    AGENT_MAX_STEPS: int = 5
    AGENT_MAX_TOOL_CALLS: int = 8
    AGENT_TIMEOUT_SECONDS: int = 25
    AGENT_TOKEN_BUDGET: int = 16000

    # Observability
    LOG_LEVEL: str = "INFO"
    PROMETHEUS_METRICS_ENABLED: bool = True
    OTEL_EXPORTER_OTLP_ENDPOINT: str | None = None

    @field_validator("LOCAL_STORAGE_DIR", mode="after")
    @classmethod
    def ensure_storage_dir(cls, v: Path) -> Path:
        v.mkdir(parents=True, exist_ok=True)
        return v

    @property
    def async_database_uri(self) -> str:
        """Construct the async database connection URI."""
        if self.USE_SQLITE_TEST_DB:
            return f"sqlite+aiosqlite:///{self.SQLITE_DB_PATH}"
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

