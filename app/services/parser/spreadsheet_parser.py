"""Spreadsheet (.xlsx, .csv) Parser using openpyxl and standard csv."""

import csv
import io
import uuid
from typing import Any

import openpyxl

from app.core.exceptions import ParserError
from app.services.parser.base import DocumentParser
from app.services.parser.schema import (
    CanonicalDocument,
    ContentBlock,
    PageData,
    TableData,
)


class SpreadsheetParser(DocumentParser):
    """Parses Excel spreadsheets (.xlsx) and CSV files into structured tables."""

    def can_parse(self, mime_type: str) -> bool:
        return mime_type in {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        }

    def parse(self, content: bytes, filename: str, document_id: str = "") -> CanonicalDocument:
        doc_id = document_id or str(uuid.uuid4())
        pages: list[PageData] = []

        if filename.lower().endswith(".csv") or content.startswith(b"") and b"," in content[:256]:
            # CSV parsing
            try:
                text_content = content.decode("utf-8", errors="replace")
                reader = csv.reader(io.StringIO(text_content))
                rows_list = list(reader)
                if rows_list:
                    headers = rows_list[0]
                    rows = rows_list[1:]
                else:
                    headers, rows = [], []

                page = PageData(page_number=1)
                page.tables.append(
                    TableData(
                        table_id=str(uuid.uuid4()),
                        headers=headers,
                        rows=rows,
                        caption=filename,
                        page_number=1,
                    )
                )
                pages.append(page)
            except Exception as e:
                raise ParserError(f"Failed to parse CSV: {e}") from e

        else:
            # Excel (.xlsx) parsing
            try:
                wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
                for sheet_idx, sheet_name in enumerate(wb.sheetnames):
                    sheet = wb[sheet_name]
                    all_rows = list(sheet.iter_rows(values_only=True))
                    if not all_rows:
                        continue

                    # Filter None rows
                    cleaned_rows = [
                        [str(cell) if cell is not None else "" for cell in r] for r in all_rows
                    ]
                    headers = cleaned_rows[0]
                    rows = cleaned_rows[1:]

                    page = PageData(page_number=sheet_idx + 1)
                    page.blocks.append(
                        ContentBlock(
                            block_id=str(uuid.uuid4()),
                            block_type="heading",
                            text=f"Sheet: {sheet_name}",
                        )
                    )
                    page.tables.append(
                        TableData(
                            table_id=str(uuid.uuid4()),
                            headers=headers,
                            rows=rows,
                            caption=sheet_name,
                            page_number=sheet_idx + 1,
                        )
                    )
                    pages.append(page)
            except Exception as e:
                raise ParserError(f"Failed to parse XLSX workbook: {e}") from e

        return CanonicalDocument(
            document_id=doc_id,
            filename=filename,
            mime_type="text/csv" if filename.lower().endswith(".csv") else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            total_pages=len(pages),
            pages=pages,
            metadata={"format": "Spreadsheet", "sheets_count": len(pages)},
        )
