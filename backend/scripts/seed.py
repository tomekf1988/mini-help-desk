"""Seed the database with sample tickets. Idempotent — skips if data already exists."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import date, timedelta

from app.database import SessionLocal
from app.models import Ticket, TicketPriority, TicketStatus

SAMPLE_TICKETS = [
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


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Ticket).first()
        if existing:
            print("Already seeded, skipping")
            return

        tickets = [Ticket(**data) for data in SAMPLE_TICKETS]
        db.add_all(tickets)
        db.commit()
        print(f"Seeded {len(tickets)} tickets")
    finally:
        db.close()


if __name__ == "__main__":
    main()
