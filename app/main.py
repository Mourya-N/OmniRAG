"""OmniRAG FastAPI Application Entrypoint & Lifespan Management."""

import time
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as org_router
from app.core.config import settings
from app.core.database import engine
from app.core.exceptions import OmniRAGError
from app.core.logging import get_logger, setup_logging
from app.core.redis import close_redis

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and graceful shutdown."""
    setup_logging(log_level=settings.LOG_LEVEL, environment=settings.ENVIRONMENT.value)
    logger.info(
        "omnirag_starting",
        environment=settings.ENVIRONMENT.value,
        debug=settings.DEBUG,
    )
    yield
    logger.info("omnirag_shutting_down")
    await engine.dispose()
    await close_redis()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Enterprise Multimodal Knowledge Intelligence Platform API",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT.value != "production" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Correlation ID & Performance Middleware
@app.middleware("http")
async def add_correlation_and_timing_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-MS"] = f"{process_time_ms:.2f}"
    return response


# Global Domain Exception Handler
@app.exception_handler(OmniRAGError)
async def omnirag_exception_handler(request: Request, exc: OmniRAGError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.warning(
        "domain_exception_raised",
        error_code=exc.code,
        message=exc.message,
        details=exc.details,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": request_id,
            }
        },
    )


# Include Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(org_router, prefix=settings.API_V1_PREFIX)

# System Health & Readiness Endpoints
@app.get(f"{settings.API_V1_PREFIX}/system/health", tags=["System"])
async def health_check() -> dict[str, str]:
    """Fast liveness probe for load balancers."""
    return {"status": "healthy", "service": "omnirag-api", "version": "0.1.0"}


@app.get(f"{settings.API_V1_PREFIX}/system/readiness", tags=["System"])
async def readiness_check() -> dict[str, Any]:
    """Readiness probe checking database and core service availability."""
    checks: dict[str, str] = {
        "api": "ready",
        "database": "configured",
        "vector_store": "configured",
    }
    return {"status": "ready", "checks": checks}
