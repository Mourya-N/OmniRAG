"""Text, Markdown, and Source Code Parser."""

import re
import uuid
from typing import Any

from app.services.parser.base import DocumentParser
from app.services.parser.schema import (
    CanonicalDocument,
    ContentBlock,
    PageData,
)


class TextCodeParser(DocumentParser):
    """Parses plain text, Markdown, and source code files."""

    def can_parse(self, mime_type: str) -> bool:
        return mime_type in {"text/plain", "text/markdown"}

    def parse(self, content: bytes, filename: str, document_id: str = "") -> CanonicalDocument:
        text = content.decode("utf-8", errors="replace")
        doc_id = document_id or str(uuid.uuid4())
        page_data = PageData(page_number=1)

        # Parse markdown headings, code fences, and paragraphs
        lines = text.splitlines()
        current_section = ""
        current_buffer: list[str] = []
        in_code_block = False

        def flush_buffer(b_type: str = "text"):
            if current_buffer:
                content_str = "\n".join(current_buffer).strip()
                if content_str:
                    page_data.blocks.append(
                        ContentBlock(
                            block_id=str(uuid.uuid4()),
                            block_type=b_type,
                            text=content_str,
                            section_hierarchy=[current_section] if current_section else [],
                        )
                    )
                current_buffer.clear()

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("```"):
                if in_code_block:
                    current_buffer.append(line)
                    flush_buffer("code")
                    in_code_block = False
                else:
                    flush_buffer("text")
                    in_code_block = True
                    current_buffer.append(line)
            elif in_code_block:
                current_buffer.append(line)
            elif stripped.startswith("#"):
                flush_buffer("text")
                current_section = stripped.lstrip("#").strip()
                page_data.blocks.append(
                    ContentBlock(
                        block_id=str(uuid.uuid4()),
                        block_type="heading",
                        text=stripped,
                        section_hierarchy=[current_section],
                    )
                )
            elif stripped.startswith("def ") or stripped.startswith("class ") or stripped.startswith("function "):
                flush_buffer("text")
                current_buffer.append(line)
                flush_buffer("code")
            elif not stripped:
                flush_buffer("text")
            else:
                current_buffer.append(line)

        flush_buffer("code" if in_code_block else "text")

        return CanonicalDocument(
            document_id=doc_id,
            filename=filename,
            mime_type="text/markdown" if filename.endswith(".md") else "text/plain",
            total_pages=1,
            pages=[page_data],
            metadata={"format": "Text/Code", "paragraphs_count": len(page_data.blocks)},
        )
