"""Tests for the Ticket model using SQLite in-memory database."""
import uuid
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models import Ticket, TicketPriority, TicketStatus


def test_insert_and_query_ticket(db_session: Session) -> None:
    ticket = Ticket(
        title="Test ticket",
        description="A simple test ticket",
        status=TicketStatus.open,
        priority=TicketPriority.high,
        estimated_minutes=30,
        due_date=date(2026, 6, 1),
    )
    db_session.add(ticket)
    db_session.flush()
    db_session.refresh(ticket)

    fetched = db_session.get(Ticket, ticket.id)
    assert fetched is not None
    assert fetched.title == "Test ticket"
    assert fetched.description == "A simple test ticket"
    assert fetched.status == TicketStatus.open
    assert fetched.priority == TicketPriority.high
    assert fetched.estimated_minutes == 30
    assert fetched.due_date == date(2026, 6, 1)


def test_ticket_id_is_uuid(db_session: Session) -> None:
    ticket = Ticket(title="UUID check", status=TicketStatus.open, priority=TicketPriority.low)
    db_session.add(ticket)
    db_session.flush()
    db_session.refresh(ticket)

    assert isinstance(ticket.id, uuid.UUID)


def test_ticket_defaults(db_session: Session) -> None:
    ticket = Ticket(title="Defaults check", status=TicketStatus.open, priority=TicketPriority.medium)
    db_session.add(ticket)
    db_session.flush()
    db_session.refresh(ticket)

    assert ticket.description is None
    assert ticket.estimated_minutes is None
    assert ticket.due_date is None
    assert isinstance(ticket.created_at, datetime)
    assert isinstance(ticket.updated_at, datetime)


def test_ticket_nullable_fields(db_session: Session) -> None:
    ticket = Ticket(
        title="No optional fields",
        status=TicketStatus.closed,
        priority=TicketPriority.low,
        description=None,
        estimated_minutes=None,
        due_date=None,
    )
    db_session.add(ticket)
    db_session.flush()
    db_session.refresh(ticket)

    fetched = db_session.get(Ticket, ticket.id)
    assert fetched is not None
    assert fetched.description is None
    assert fetched.estimated_minutes is None
    assert fetched.due_date is None


def test_all_statuses_and_priorities(db_session: Session) -> None:
    combinations = [
        (TicketStatus.open, TicketPriority.low),
        (TicketStatus.in_progress, TicketPriority.medium),
        (TicketStatus.closed, TicketPriority.high),
    ]
    inserted_ids = []
    for status, priority in combinations:
        ticket = Ticket(title=f"{status.value}-{priority.value}", status=status, priority=priority)
        db_session.add(ticket)
        db_session.flush()
        inserted_ids.append(ticket.id)

    for ticket_id, (status, priority) in zip(inserted_ids, combinations):
        fetched = db_session.get(Ticket, ticket_id)
        assert fetched is not None
        assert fetched.status == status
        assert fetched.priority == priority