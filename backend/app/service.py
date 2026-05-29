import logging
import uuid
from typing import AsyncGenerator

import openai

from sqlalchemy.orm import Session

from app.errors import NotFoundError
from app.models import Ticket, TicketStatus
from app import llm
from app.repository import (
    create_ticket as repo_create,
    delete_ticket as repo_delete,
    get_ticket as repo_get,
    list_tickets as repo_list,
    update_ticket as repo_update,
)
from app.schemas import TicketCreate, TicketUpdate


def get_ticket(db: Session, ticket_id: uuid.UUID) -> Ticket:
    ticket = repo_get(db, ticket_id)
    if ticket is None:
        raise NotFoundError(ticket_id)
    return ticket


def list_tickets(db: Session, status: TicketStatus | None = None) -> list[Ticket]:
    return repo_list(db, status=status)


def create_ticket(db: Session, data: TicketCreate) -> Ticket:
    return repo_create(db, data)


def update_ticket(db: Session, ticket_id: uuid.UUID, data: TicketUpdate) -> Ticket:
    ticket = repo_get(db, ticket_id)
    if ticket is None:
        raise NotFoundError(ticket_id)
    return repo_update(db, ticket, data)


def delete_ticket(db: Session, ticket_id: uuid.UUID) -> None:
    ticket = repo_get(db, ticket_id)
    if ticket is None:
        raise NotFoundError(ticket_id)
    repo_delete(db, ticket)


_logger = logging.getLogger(__name__)


async def stream_summary_events(
    client: openai.AsyncOpenAI, ticket: Ticket
) -> AsyncGenerator[str, None]:
    _logger.info("SSE stream started: ticket %s (%r)", ticket.id, ticket.title)
    accumulated: list[str] = []
    try:
        async for token in llm.stream_summary(client, ticket):
            _logger.debug("SSE token #%d: %r", len(accumulated) + 1, token)
            accumulated.append(token)
            yield f"data: {token}\n\n"
        full_text = "".join(accumulated)
        _logger.info(
            "SSE stream done: ticket %s — %d tokens — %r",
            ticket.id,
            len(accumulated),
            full_text[:120] + ("…" if len(full_text) > 120 else ""),
        )
        yield "data: [DONE]\n\n"
    except Exception:
        _logger.exception("SSE stream error: ticket %s", ticket.id)
        yield "data: [ERROR]\n\n"
