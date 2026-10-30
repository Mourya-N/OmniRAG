"""Document format validation, MIME inspection, and checksum calculation."""

import hashlib
from typing import Any

from app.core.config import settings
from app.core.exceptions import FileSizeLimitExceededError, UnsupportedMediaTypeError

# Supported MIME types and extensions
SUPPORTED_MIME_TYPES = {
    "application/pdf": [".pdf"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "text/csv": [".csv"],
    "text/plain": [".txt", ".py", ".js", ".ts", ".html", ".css", ".json", ".yaml", ".yml"],
    "text/markdown": [".md", ".markdown"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
}


def calculate_sha256(content: bytes) -> str:
    """Compute the hexadecimal SHA-256 digest of binary content."""
    hasher = hashlib.sha256()
    hasher.update(content)
    return hasher.hexdigest()


def detect_mime_type(filename: str, content: bytes) -> str:
    """Detect MIME type by inspecting magic header bytes and file extensions."""
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise FileSizeLimitExceededError(len(content), settings.MAX_UPLOAD_SIZE_BYTES)

    # Magic byte checks
    if content.startswith(b"%PDF"):
        return "application/pdf"
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if content.startswith(b"PK\x03\x04"):
        # Zip-based OpenXML formats: check filename extension
        ext = filename.lower()
        if ext.endswith(".docx"):
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if ext.endswith(".pptx"):
            return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        if ext.endswith(".xlsx"):
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    # Text-based formats
    try:
        content[:1024].decode("utf-8")
        if filename.endswith(".csv"):
            return "text/csv"
        if filename.endswith(".md") or filename.endswith(".markdown"):
            return "text/markdown"
        return "text/plain"
    except UnicodeDecodeError:
        pass

    raise UnsupportedMediaTypeError(f"unknown (filename: {filename})")

