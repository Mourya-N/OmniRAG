"""Abstract Document Parser Interface."""

from abc import ABC, abstractmethod

from app.services.parser.schema import CanonicalDocument


class DocumentParser(ABC):
    """Abstract interface for all format-specific document parsers."""

    @abstractmethod
    def can_parse(self, mime_type: str) -> bool:
        """Check if parser handles given MIME type."""
        pass

    @abstractmethod
    def parse(self, content: bytes, filename: str, document_id: str = "") -> CanonicalDocument:
        """Parse raw document bytes into canonical representation."""
        pass
