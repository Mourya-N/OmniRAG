"""High-Performance Layout-Aware PDF Parser using PyMuPDF (fitz)."""

import uuid
from typing import Any

import fitz  # PyMuPDF

from app.core.exceptions import ParserError
from app.services.parser.base import DocumentParser
from app.services.parser.schema import (
    BoundingBox,
    CanonicalDocument,
    ContentBlock,
    ImageData,
    PageData,
)


class PDFParser(DocumentParser):
    """Parses PDF documents into structured CanonicalDocument representation."""

    def can_parse(self, mime_type: str) -> bool:
        return mime_type == "application/pdf"

    def parse(self, content: bytes, filename: str, document_id: str = "") -> CanonicalDocument:
        try:
            doc = fitz.open(stream=content, filetype="pdf")
        except Exception as e:
            raise ParserError(f"Failed to open PDF stream: {e}") from e

        pages: list[PageData] = []
        doc_id = document_id or str(uuid.uuid4())

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1
            rect = page.rect
            page_data = PageData(
                page_number=page_num,
                width=rect.width,
                height=rect.height,
            )

            # 1. Extract Text Blocks with Coordinates
            text_page = page.get_text("blocks")
            for block in text_page:
                # block tuple: (x0, y0, x1, y1, text, block_no, block_type)
                # block_type == 0: text, block_type == 1: image
                if block[6] == 0:
                    text = block[4].strip()
                    if text:
                        bbox = BoundingBox(
                            x0=float(block[0]),
                            y0=float(block[1]),
                            x1=float(block[2]),
                            y1=float(block[3]),
                        )
                        block_type = "heading" if (bbox.y1 - bbox.y0 < 30 and len(text) < 80 and "\n" not in text) else "text"
                        page_data.blocks.append(
                            ContentBlock(
                                block_id=str(uuid.uuid4()),
                                block_type=block_type,
                                text=text,
                                bounding_box=bbox,
                            )
                        )

            # 2. Extract Embedded Images
            image_list = page.get_images(full=True)
            for img_info in image_list:
                xref = img_info[0]
                base_img = doc.extract_image(xref)
                if base_img:
                    page_data.images.append(
                        ImageData(
                            image_id=str(uuid.uuid4()),
                            format=base_img.get("ext", "png"),
                            width=base_img.get("width", 0),
                            height=base_img.get("height", 0),
                            raw_bytes=base_img.get("image", b""),
                            page_number=page_num,
                        )
                    )

            pages.append(page_data)

        metadata: dict[str, Any] = {
            "title": doc.metadata.get("title", ""),
            "author": doc.metadata.get("author", ""),
            "subject": doc.metadata.get("subject", ""),
            "creator": doc.metadata.get("creator", ""),
            "producer": doc.metadata.get("producer", ""),
            "format": doc.metadata.get("format", "PDF"),
        }
        doc.close()

        return CanonicalDocument(
            document_id=doc_id,
            filename=filename,
            mime_type="application/pdf",
            total_pages=len(pages),
            pages=pages,
            metadata=metadata,
        )

