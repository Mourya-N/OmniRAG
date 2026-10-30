"""Chunking Algorithms: Hierarchical (Parent-Child), Table-Aware, and Code-Aware."""

import re
import uuid
from abc import ABC, abstractmethod

from app.services.chunking.schema import ChunkPayload
from app.services.parser.schema import CanonicalDocument


def approximate_token_count(text: str) -> int:
    """Fast approximation of token count based on whitespace and subword heuristics (~4 chars/token)."""
    return max(1, len(text) // 4)


class Chunker(ABC):
    """Abstract chunker interface."""

    @abstractmethod
    def chunk(
        self,
        canonical_doc: CanonicalDocument,
        tenant_id: str,
        version_id: str,
    ) -> list[ChunkPayload]:
        """Transform canonical document into an ordered list of ChunkPayloads."""
        pass


class HierarchicalChunker(Chunker):
    """Generates large Parent chunks (broad context) and small Child chunks (precision search)."""

    def __init__(self, parent_max_tokens: int = 800, child_max_tokens: int = 200, overlap_tokens: int = 40) -> None:
        self.parent_max_tokens = parent_max_tokens
        self.child_max_tokens = child_max_tokens
        self.overlap_tokens = overlap_tokens

    def chunk(
        self,
        canonical_doc: CanonicalDocument,
        tenant_id: str,
        version_id: str,
    ) -> list[ChunkPayload]:
        all_chunks: list[ChunkPayload] = []
        chunk_idx = 0

        for page in canonical_doc.pages:
            # 1. Process Tables as dedicated atomic chunks
            for table in page.tables:
                table_md = table.to_markdown()
                if not table_md:
                    continue
                all_chunks.append(
                    ChunkPayload(
                        chunk_id=str(uuid.uuid4()),
                        document_id=canonical_doc.document_id,
                        tenant_id=tenant_id,
                        version_id=version_id,
                        chunk_index=chunk_idx,
                        content_type="table",
                        raw_text=table_md,
                        page_number=page.page_number,
                        section_heading=table.caption,
                        bounding_box=table.bounding_box,
                        parent_chunk_id=None,
                        token_count=approximate_token_count(table_md),
                    )
                )
                chunk_idx += 1

            # 2. Process Text & Code blocks with Parent-Child hierarchy
            current_section = ""
            for block in page.blocks:
                block_text = block.text.strip()
                if not block_text:
                    continue

                if block.block_type == "heading":
                    current_section = block_text
                    # Check if standalone heading or title
                    if len(page.blocks) == 1:
                        # Standalone block, treat as content
                        pass
                    else:
                        continue

                parent_id = str(uuid.uuid4())
                parent_token_count = approximate_token_count(block_text)

                # Parent chunk
                parent_chunk = ChunkPayload(
                    chunk_id=parent_id,
                    document_id=canonical_doc.document_id,
                    tenant_id=tenant_id,
                    version_id=version_id,
                    chunk_index=chunk_idx,
                    content_type="code" if block.block_type == "code" else "text",
                    raw_text=block_text,
                    page_number=page.page_number,
                    section_heading=current_section,
                    bounding_box=block.bounding_box,
                    parent_chunk_id=None,
                    token_count=parent_token_count,
                )
                all_chunks.append(parent_chunk)
                chunk_idx += 1

                # If parent exceeds child size, split into child chunks
                if parent_token_count > self.child_max_tokens:
                    sentences = re.split(r"(?<=[.?!])\s+", block_text)
                    current_child_words: list[str] = []
                    current_child_tokens = 0

                    for sentence in sentences:
                        s_tokens = approximate_token_count(sentence)
                        if current_child_tokens + s_tokens > self.child_max_tokens and current_child_words:
                            child_text = " ".join(current_child_words)
                            all_chunks.append(
                                ChunkPayload(
                                    chunk_id=str(uuid.uuid4()),
                                    document_id=canonical_doc.document_id,
                                    tenant_id=tenant_id,
                                    version_id=version_id,
                                    chunk_index=chunk_idx,
                                    content_type=parent_chunk.content_type,
                                    raw_text=child_text,
                                    page_number=page.page_number,
                                    section_heading=current_section,
                                    bounding_box=block.bounding_box,
                                    parent_chunk_id=parent_id,
                                    token_count=current_child_tokens,
                                )
                            )
                            chunk_idx += 1
                            current_child_words = [sentence]
                            current_child_tokens = s_tokens
                        else:
                            current_child_words.append(sentence)
                            current_child_tokens += s_tokens

                    if current_child_words:
                        child_text = " ".join(current_child_words)
                        all_chunks.append(
                            ChunkPayload(
                                chunk_id=str(uuid.uuid4()),
                                document_id=canonical_doc.document_id,
                                tenant_id=tenant_id,
                                version_id=version_id,
                                chunk_index=chunk_idx,
                                content_type=parent_chunk.content_type,
                                raw_text=child_text,
                                page_number=page.page_number,
                                section_heading=current_section,
                                bounding_box=block.bounding_box,
                                parent_chunk_id=parent_id,
                                token_count=current_child_tokens,
                            )
                        )
                        chunk_idx += 1

        return all_chunks
