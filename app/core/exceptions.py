"""Domain-specific exception hierarchy for OmniRAG.

All custom exceptions inherit from OmniRAGError and map to predictable HTTP
status codes and structured JSON response schemas.
"""

from typing import Any


class OmniRAGError(Exception):
    """Base exception for all OmniRAG platform errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


# Authentication & Authorization Exceptions
class AuthenticationError(OmniRAGError):
    def __init__(self, message: str = "Authentication failed", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, code="UNAUTHENTICATED", status_code=401, details=details)


class TokenExpiredError(AuthenticationError):
    def __init__(self, message: str = "Token has expired") -> None:
        super().__init__(message=message, details={"reason": "token_expired"})


class AuthorizationError(OmniRAGError):
    def __init__(self, message: str = "Access forbidden", details: dict[str, Any] | None = None) -> None:
        super().__init__(message, code="FORBIDDEN", status_code=403, details=details)


class TenantMismatchError(AuthorizationError):
    def __init__(self, message: str = "Access across tenant boundaries is strictly prohibited") -> None:
        super().__init__(message, details={"reason": "tenant_boundary_violation"})


# Document & Ingestion Exceptions
class DocumentNotFoundError(OmniRAGError):
    def __init__(self, document_id: str) -> None:
        super().__init__(
            message=f"Document with ID '{document_id}' was not found",
            code="DOCUMENT_NOT_FOUND",
            status_code=404,
            details={"document_id": document_id},
        )


class UnsupportedMediaTypeError(OmniRAGError):
    def __init__(self, mime_type: str) -> None:
        super().__init__(
            message=f"File media type '{mime_type}' is not supported for ingestion",
            code="UNSUPPORTED_MEDIA_TYPE",
            status_code=415,
            details={"mime_type": mime_type},
        )


class FileSizeLimitExceededError(OmniRAGError):
    def __init__(self, file_size: int, max_size: int) -> None:
        super().__init__(
            message=f"Uploaded file size ({file_size} bytes) exceeds the maximum limit ({max_size} bytes)",
            code="FILE_TOO_LARGE",
            status_code=413,
            details={"file_size": file_size, "max_size": max_size},
        )


class DuplicateDocumentError(OmniRAGError):
    def __init__(self, sha256_checksum: str, existing_document_id: str) -> None:
        super().__init__(
            message="Document with identical SHA-256 checksum already exists in this organization",
            code="DUPLICATE_DOCUMENT",
            status_code=409,
            details={"sha256": sha256_checksum, "existing_document_id": existing_document_id},
        )


class ParserError(OmniRAGError):
    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message, code="DOCUMENT_PARSING_FAILED", status_code=422, details=details)


# Retrieval & Vector Store Exceptions
class VectorStoreError(OmniRAGError):
    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message, code="VECTOR_STORE_ERROR", status_code=502, details=details)


class IncompatibleEmbeddingDimensionError(VectorStoreError):
    def __init__(self, expected_dim: int, actual_dim: int) -> None:
        super().__init__(
            message=f"Embedding dimension mismatch: expected {expected_dim}, got {actual_dim}",
            details={"expected_dim": expected_dim, "actual_dim": actual_dim},
        )


# Agent & Reasoning Exceptions
class AgentBudgetExceededError(OmniRAGError):
    def __init__(self, limit_type: str, limit_value: Any) -> None:
        super().__init__(
            message=f"Agent execution terminated: exceeded maximum {limit_type} ({limit_value})",
            code="AGENT_BUDGET_EXCEEDED",
            status_code=429,
            details={"limit_type": limit_type, "limit_value": limit_value},
        )
