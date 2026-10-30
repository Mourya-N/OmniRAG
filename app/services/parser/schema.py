"""Canonical Multi-Modal Document Representation Schema.

Preserves exact bounding boxes, page offsets, hierarchical headings, tables,
and extracted visual assets without loss of fidelity.
"""

from typing import Any, Literal
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Normalized or coordinate bounding box [x0, y0, x1, y1]."""

    x0: float
    y0: float
    x1: float
    y1: float


class ContentBlock(BaseModel):
    """A semantic text block extracted from a document page."""

    block_id: str
    block_type: Literal["text", "heading", "code", "quote", "list_item"] = "text"
    text: str
    bounding_box: BoundingBox | None = None
    confidence: float = 1.0
    section_hierarchy: list[str] = Field(default_factory=list)


class TableData(BaseModel):
    """Structured table representation preserving headers and cell coordinates."""

    table_id: str
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)
    caption: str | None = None
    bounding_box: BoundingBox | None = None
    page_number: int = 1

    def to_markdown(self) -> str:
        """Convert structured table into markdown text representation."""
        if not self.headers and not self.rows:
            return ""
        lines: list[str] = []
        if self.caption:
            lines.append(f"**Table: {self.caption}**\n")
        headers = self.headers if self.headers else [f"Col {i+1}" for i in range(len(self.rows[0]))]
        lines.append("| " + " | ".join(headers) + " |")
        lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
        for row in self.rows:
            padded_row = row + [""] * (len(headers) - len(row))
            lines.append("| " + " | ".join(padded_row[:len(headers)]) + " |")
        return "\n".join(lines)


class ImageData(BaseModel):
    """Extracted embedded image or visual chart."""

    image_id: str
    format: str = "png"
    width: int = 0
    height: int = 0
    raw_bytes: bytes = Field(default=b"", repr=False)
    caption: str | None = None
    bounding_box: BoundingBox | None = None
    page_number: int = 1


class PageData(BaseModel):
    """Container for page-level multi-modal content elements."""

    page_number: int
    width: float = 0.0
    height: float = 0.0
    blocks: list[ContentBlock] = Field(default_factory=list)
    tables: list[TableData] = Field(default_factory=list)
    images: list[ImageData] = Field(default_factory=list)


class CanonicalDocument(BaseModel):
    """Normalized canonical representation of any ingested enterprise document."""

    document_id: str
    filename: str
    mime_type: str
    total_pages: int
    pages: list[PageData] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    def get_full_text(self) -> str:
        """Concatenate all textual elements in reading order."""
        sections: list[str] = []
        for page in self.pages:
            for block in page.blocks:
                if block.text.strip():
                    sections.append(block.text.strip())
            for table in page.tables:
                table_md = table.to_markdown()
                if table_md:
                    sections.append(table_md)
        return "\n\n".join(sections)

