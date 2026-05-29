"""Tests for the Ticket model against the real test database."""
import uuid
from datetime import date, datetime

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings
from app.database import Base
from app.models import Ticket, TicketPriority, TicketStatus


def _test_db_url() -> str:
    return settings.test_database_url or settings.database_url


def _ensure_test_db_exists(url: str) -> None:
    parsed = make_url(url)
    db_name = parsed.database
    admin_url = parsed.set(database="postgres")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def db_engine():
    url = _test_db_url()
    _ensure_test_db_exists(url)
    engine = create_engine(url)

    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS tickets CASCADE"))
        conn.execute(text("DROP TYPE IF EXISTS ticketstatus CASCADE"))
        conn.execute(text("DROP TYPE IF EXISTS ticketpriority CASCADE"))
        conn.commit()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    """Each test gets a transaction that is rolled back after the test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    factory = sessionmaker(bind=connection)
    session: Session = factory()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


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
