"""Seed helper — inserts sample tickets if the table is empty."""
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import Ticket, TicketPriority, TicketStatus

_SAMPLE_TICKETS = [
    {
        "title": "Login page returns 500 on invalid credentials",
        "description": "Users get a 500 error instead of a proper 401 when entering wrong password.",
        "status": TicketStatus.open,
        "priority": TicketPriority.high,
        "estimated_minutes": 60,
        "due_date": date.today() + timedelta(days=2),
    },
    {
        "title": "Export tickets to CSV",
        "description": "Allow admins to download all tickets as a CSV file.",
        "status": TicketStatus.in_progress,
        "priority": TicketPriority.medium,
        "estimated_minutes": 120,
        "due_date": date.today() + timedelta(days=5),
    },
    {
        "title": "Email notifications not sending",
        "description": "Ticket update emails stopped working after the last deployment.",
        "status": TicketStatus.in_progress,
        "priority": TicketPriority.high,
        "estimated_minutes": 90,
        "due_date": date.today() + timedelta(days=1),
    },
    {
        "title": "Password reset flow broken",
        "description": "Reset link in email leads to a 404 page.",
        "status": TicketStatus.closed,
        "priority": TicketPriority.high,
        "estimated_minutes": 45,
        "due_date": None,
    },
    {
        "title": "Add pagination to ticket list",
        "description": "The ticket list loads all records at once. Implement cursor-based pagination.",
        "status": TicketStatus.open,
        "priority": TicketPriority.medium,
        "estimated_minutes": 150,
        "due_date": date.today() + timedelta(days=7),
    },
]


def seed_if_empty(db: Session) -> None:
    from sqlalchemy import select
    existing = db.execute(select(Ticket).limit(1)).scalar_one_or_none()
    if existing is not None:
        print("Already seeded, skipping")
        return
    _insert(db)


def force_seed(db: Session) -> None:
    db.query(Ticket).delete()
    db.commit()
    _insert(db)


def _insert(db: Session) -> None:
    db.add_all([Ticket(**data) for data in _SAMPLE_TICKETS])
    db.commit()
    print(f"Seeded {len(_SAMPLE_TICKETS)} tickets")


if __name__ == "__main__":
    import sys
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker as _sessionmaker
    from app.config import settings

    _force = "--force" in sys.argv or "-f" in sys.argv
    _engine = create_engine(settings.database_url)
    _db = _sessionmaker(bind=_engine)()
    try:
        force_seed(_db) if _force else seed_if_empty(_db)
    finally:
        _db.close()
        _engine.dispose()