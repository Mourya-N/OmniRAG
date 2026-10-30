"""Enterprise structured logging setup with correlation IDs and security redaction.

Uses structlog for high-performance JSON formatted logs in production and
human-readable rich output in local development.
"""

import logging
import re
import sys
from typing import Any

import structlog

# Regex patterns for redacting sensitive credentials and tokens
SENSITIVE_PATTERNS = [
    re.compile(r"Bearer\s+([A-Za-z0-9_\-\.]+)", re.IGNORECASE),
    re.compile(r"password['\"]?\s*[:=]\s*['\"]?([^'\"\s]+)", re.IGNORECASE),
    re.compile(r"api_key['\"]?\s*[:=]\s*['\"]?([^'\"\s]+)", re.IGNORECASE),
]


def redact_sensitive_data(
    logger: logging.Logger, method_name: str, event_dict: dict[str, Any]
) -> dict[str, Any]:
    """Redacts passwords, tokens, and credentials from log payloads."""
    for key, value in list(event_dict.items()):
        if isinstance(value, str):
            for pattern in SENSITIVE_PATTERNS:
                if pattern.search(value):
                    event_dict[key] = pattern.sub(r"[REDACTED]", value)
        elif key.lower() in {"password", "secret_key", "token", "refresh_token", "api_key"}:
            event_dict[key] = "[REDACTED]"
    return event_dict


def setup_logging(log_level: str = "INFO", environment: str = "development") -> None:
    """Configures structured logging for OmniRAG."""
    level = getattr(logging, log_level.upper(), logging.INFO)

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        redact_sensitive_data,
    ]

    if environment == "production":
        processors = [
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ]
        formatter = structlog.processors.JSONRenderer()
    else:
        processors = [
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ]
        formatter = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(structlog.stdlib.ProcessorFormatter(processor=formatter))

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(level)


def get_logger(name: str = "omnirag") -> structlog.stdlib.BoundLogger:
    """Retrieve a bound structured logger."""
    return structlog.get_logger(name)

