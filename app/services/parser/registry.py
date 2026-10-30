"""Parser Registry for automatic dispatcher lookup."""

from app.core.exceptions import UnsupportedMediaTypeError
from app.services.parser.base import DocumentParser
from app.services.parser.docx_parser import DocxParser
from app.services.parser.pdf_parser import PDFParser
from app.services.parser.pptx_parser import PPTXParser
from app.services.parser.spreadsheet_parser import SpreadsheetParser
from app.services.parser.text_code_parser import TextCodeParser


class ParserRegistry:
    """Registry maintaining active document parsers."""

    def __init__(self) -> None:
        self.parsers: list[DocumentParser] = [
            PDFParser(),
            DocxParser(),
            PPTXParser(),
            SpreadsheetParser(),
            TextCodeParser(),
        ]

    def get_parser(self, mime_type: str) -> DocumentParser:
        """Find matching parser for MIME type."""
        for parser in self.parsers:
            if parser.can_parse(mime_type):
                return parser
        raise UnsupportedMediaTypeError(mime_type)


default_parser_registry = ParserRegistry()


def parse_document_content(content: bytes, filename: str, mime_type: str, document_id: str = ""):
    """Convenience helper to parse raw bytes into a CanonicalDocument."""
    parser = default_parser_registry.get_parser(mime_type)
    return parser.parse(content, filename, document_id)

