import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Ticket, TicketStatus, _utcnow
from app.schemas import TicketCreate, TicketUpdate


def get_ticket(db: Session, ticket_id: uuid.UUID) -> Ticket | None:
    return db.get(Ticket, ticket_id)


def list_tickets(db: Session, status: TicketStatus | None = None) -> list[Ticket]:
    stmt = select(Ticket)
    if status is not None:
        stmt = stmt.where(Ticket.status == status)
    return list(db.execute(stmt).scalars().all())


def create_ticket(db: Session, data: TicketCreate) -> Ticket:
    ticket = Ticket(**data.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket(db: Session, ticket: Ticket, data: TicketUpdate) -> Ticket:
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(ticket, field, value)
    # Explicitly set updated_at — ORM onupdate may not fire on attribute-level sets
    ticket.updated_at = _utcnow()
    db.commit()
    db.refresh(ticket)
    return ticket


def delete_ticket(db: Session, ticket: Ticket) -> None:
    db.delete(ticket)
    db.commit()
