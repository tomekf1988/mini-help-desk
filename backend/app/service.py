import uuid

from sqlalchemy.orm import Session

from app.errors import NotFoundError
from app.models import Ticket, TicketStatus
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
