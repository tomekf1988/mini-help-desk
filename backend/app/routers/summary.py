"""SSE endpoint for streaming AI-generated ticket summaries."""
import uuid

import openai
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import NotFoundError
from app import service

router = APIRouter(prefix="/api/tickets", tags=["summary"])


def get_llm_client(request: Request) -> openai.AsyncOpenAI:
    return request.app.state.llm_client


@router.get("/{ticket_id}/summary/stream")
async def stream_ticket_summary(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
    client: openai.AsyncOpenAI = Depends(get_llm_client),
) -> StreamingResponse:
    try:
        ticket = service.get_ticket(db, ticket_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return StreamingResponse(
        service.stream_summary_events(client, ticket),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
