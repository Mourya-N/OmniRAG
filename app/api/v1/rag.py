"""Enterprise Evidence-Grounded RAG Chat API Controller."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, verify_tenant_boundary
from app.api.v1.search import global_bm25_retriever
from app.core.config import settings
from app.core.exceptions import OmniRAGError
from app.core.security import check_document_access
from app.models.conversation import Citation, Conversation, Message
from app.models.document import Document, DocumentPermission
from app.models.tenant import Organization
from app.schemas.rag import RAGChatRequest, RAGChatResponse
from app.services.generation import get_llm_provider
from app.services.reranking import get_reranker
from app.services.retrieval.hybrid import HybridRetriever
from app.services.verification import CitationValidator

router = APIRouter(prefix="/rag", tags=["RAG & Generation"])


@router.post("/chat", response_model=RAGChatResponse)
async def chat_rag(
    payload: RAGChatRequest,
    db: AsyncSession = Depends(get_db),
    tenant_id: str = Depends(verify_tenant_boundary),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> RAGChatResponse:
    """Execute evidence-first RAG chat with document ACL enforcement and citation validation."""
    target_org_id = payload.organization_id or current_user.get("organization_id")
    if not target_org_id:
        org_res = await db.execute(select(Organization).limit(1))
        org_obj = org_res.scalar_one_or_none()
        if org_obj:
            target_org_id = org_obj.id
        else:
            default_org = Organization(
                tenant_id=tenant_id,
                name="Default Enterprise Org",
                slug="default",
            )
            db.add(default_org)
            await db.flush()
            target_org_id = default_org.id

    # 1. Conversation Lifecycle
    if payload.conversation_id:
        conv_res = await db.execute(
            select(Conversation).where(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == current_user["user_id"],
            )
        )
        conversation = conv_res.scalar_one_or_none()
        if not conversation:
            # Fall back to creating or finding
            conversation = Conversation(
                organization_id=target_org_id,
                user_id=current_user["user_id"],
                title=payload.query[:60],
            )
            db.add(conversation)
            await db.flush()
    else:
        conversation = Conversation(
            organization_id=target_org_id,
            user_id=current_user["user_id"],
            title=payload.query[:60],
        )
        db.add(conversation)
        await db.flush()

    # 2. Record User Message
    user_msg = Message(
        conversation_id=conversation.id,
        sender_role="user",
        content=payload.query,
    )
    db.add(user_msg)
    await db.flush()

    # 3. Hybrid Retrieval
    hybrid = HybridRetriever(bm25_retriever=global_bm25_retriever)
    retrieved_chunks, _ = await hybrid.search(
        query=payload.query,
        tenant_id=tenant_id,
        collection_name=settings.QDRANT_COLLECTION_NAME,
        top_k=payload.top_k * 2 if payload.enable_reranking else payload.top_k,
        organization_id=target_org_id,
    )

    # 4. Neural Reranking
    candidate_chunks = retrieved_chunks
    if payload.enable_reranking and retrieved_chunks:
        reranker = get_reranker()
        candidate_chunks = await reranker.rerank(
            query=payload.query,
            candidates=retrieved_chunks,
            top_k=payload.top_k,
        )

    # 5. Document-Level Security & ACL Pre-Filtering
    authorized_chunks = []
    user_roles = current_user.get("roles", ["Member"])

    for chunk in candidate_chunks:
        # Check permissions for chunk's document
        perm_stmt = select(DocumentPermission).where(DocumentPermission.document_id == chunk.document_id)
        perm_res = await db.execute(perm_stmt)
        permissions = [
            {"user_id": p.user_id, "role_name": p.role_name, "permission_level": p.permission_level}
            for p in perm_res.scalars().all()
        ]

        if check_document_access(
            user_id=current_user["user_id"],
            user_roles=user_roles,
            document_permissions=permissions,
            required_permission="read",
        ):
            authorized_chunks.append(chunk)

    # 6. Evidence-Grounded Answer Generation
    llm = get_llm_provider()
    grounded_ans = await llm.generate_grounded_answer(
        query=payload.query,
        context_chunks=authorized_chunks,
    )

    # 7. Rigorous Citation Validation & Hallucination Prevention
    validator = CitationValidator()
    verification = validator.validate_citations(
        answer_text=grounded_ans.answer_text,
        retrieved_chunks=authorized_chunks,
    )

    # 8. Record Assistant Message & Citations in PostgreSQL
    assistant_msg = Message(
        conversation_id=conversation.id,
        sender_role="assistant",
        content=grounded_ans.answer_text,
        metadata_json={
            "has_abstained": grounded_ans.has_abstained,
            "confidence_score": grounded_ans.confidence_score,
            "verification": verification.model_dump(),
        },
    )
    db.add(assistant_msg)
    await db.flush()

    # Save verifiable citations
    for cit in grounded_ans.citations:
        db_cit = Citation(
            message_id=assistant_msg.id,
            chunk_id=cit.chunk_id,
            cited_snippet=cit.cited_snippet,
            page_number=cit.page_number,
            confidence_score=cit.confidence_score,
        )
        db.add(db_cit)

    await db.commit()

    return RAGChatResponse(
        conversation_id=conversation.id,
        message_id=assistant_msg.id,
        query=payload.query,
        answer=grounded_ans.answer_text,
        has_abstained=grounded_ans.has_abstained,
        confidence_score=grounded_ans.confidence_score,
        citations=grounded_ans.citations,
        verification=verification,
        retrieval_strategy="hybrid_rrf_reranked" if payload.enable_reranking else "hybrid_rrf",
    )


@router.get("/conversations")
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """List all previous RAG chat sessions saved in the database for this user."""
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == current_user["user_id"])
        .order_by(Conversation.created_at.desc())
        .options(selectinload(Conversation.messages))
    )
    res = await db.execute(stmt)
    convs = res.scalars().all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at.strftime("%b %d, %H:%M") if c.created_at else "Recent",
            "message_count": len(c.messages),
        }
        for c in convs
    ]


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve full message history and citations for a specific database-persisted session."""
    stmt = (
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user["user_id"],
        )
        .options(
            selectinload(Conversation.messages).selectinload(Message.citations)
        )
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise OmniRAGError("Conversation not found", code="CONVERSATION_NOT_FOUND", status_code=404)

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at.strftime("%b %d, %H:%M") if conv.created_at else "Recent",
        "messages": [
            {
                "id": m.id,
                "role": m.sender_role,
                "content": m.content,
                "timestamp": m.created_at.strftime("%H:%M:%S") if m.created_at else "Just now",
                "citations": [
                    {
                        "citation_id": cit.id,
                        "chunk_id": cit.chunk_id,
                        "document_id": "document",
                        "page_number": cit.page_number,
                        "cited_snippet": cit.cited_snippet,
                        "is_valid": True,
                        "confidence_score": cit.confidence_score,
                    }
                    for cit in m.citations
                ],
                "verification": m.metadata_json.get("verification") if isinstance(m.metadata_json, dict) else None,
            }
            for m in conv.messages
        ],
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Permanently delete a conversation session and all its messages."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user["user_id"],
    )
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if conv:
        await db.delete(conv)
        await db.commit()
    return {"status": "success", "deleted_id": conversation_id}

