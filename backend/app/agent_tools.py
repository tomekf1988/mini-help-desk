import datetime

from langchain_core.tools import tool

from app.database import SessionLocal
from app.models import TicketPriority, TicketStatus
from app.schemas import TicketCreate
import app.repository as repo

CREATE_TICKET_EXAMPLES = """\
User: "Add a task to buy groceries tomorrow"
Action: create_ticket_tool(title="buy groceries", due_date="{tomorrow}", priority="medium")

User: "Create an urgent task: fix login bug"
Action: create_ticket_tool(title="fix login bug", priority="high")

User: "Dodaj zadanie: zrób zakupy jutro"
Action: create_ticket_tool(title="zrób zakupy", due_date="{tomorrow}", priority="medium")

User: "Pilne: napraw błąd logowania"
Action: create_ticket_tool(title="napraw błąd logowania", priority="high")
"""

SEARCH_TICKETS_EXAMPLES = """\
User: "Show me all open tasks"
Action: search_tickets_tool(status="open")

User: "Find tasks about pizza"
Action: search_tickets_tool(title="pizza")

User: "Show urgent tasks for tomorrow"
Action: search_tickets_tool(priority="high", due_date="{tomorrow}")

User: "Pokaż otwarte zadania"
Action: search_tickets_tool(status="open")

User: "Znajdź zadania o pizzy"
Action: search_tickets_tool(title="pizza")

User: "Pokaż pilne zadania na jutro"
Action: search_tickets_tool(priority="high", due_date="{tomorrow}")
"""


@tool
def create_ticket_tool(
    title: str,
    description: str = "",
    status: str = "open",
    priority: str = "medium",
    estimated_minutes: int | None = None,
    due_date: str | None = None,
) -> dict:
    """Create a new ticket/task in the planner.

    Args:
        title: Short title or name of the task (required).
        description: Longer description of what needs to be done.
        status: Current status. One of: open, in_progress, closed. Defaults to open.
        priority: Urgency level. One of: low, medium, high.
                  Use high for urgent/pilne tasks. Defaults to medium.
        estimated_minutes: Estimated time to complete the task in minutes.
        due_date: Deadline in YYYY-MM-DD format. Use tomorrow's date for "jutro"/"tomorrow".
    """
    try:
        parsed_due_date = datetime.date.fromisoformat(due_date) if due_date else None
    except ValueError:
        return {"error": f"Invalid due_date '{due_date}'. Use YYYY-MM-DD format."}

    try:
        ticket_status = TicketStatus(status)
    except ValueError:
        ticket_status = TicketStatus.open

    try:
        ticket_priority = TicketPriority(priority)
    except ValueError:
        ticket_priority = TicketPriority.medium

    data = TicketCreate(
        title=title,
        description=description or None,
        status=ticket_status,
        priority=ticket_priority,
        estimated_minutes=estimated_minutes,
        due_date=parsed_due_date,
    )

    with SessionLocal() as db:
        ticket = repo.create_ticket(db, data)
        return {
            "id": str(ticket.id),
            "title": ticket.title,
            "description": ticket.description,
            "status": ticket.status.value,
            "priority": ticket.priority.value,
            "due_date": ticket.due_date.isoformat() if ticket.due_date else None,
        }


@tool
def search_tickets_tool(
    title: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    due_date: str | None = None,
) -> dict:
    """Search for tickets/tasks in the planner using optional filters.

    Args:
        title: Filter by title substring (case-insensitive).
        status: Filter by status. One of: open, in_progress, closed.
        priority: Filter by priority. One of: low, medium, high.
                  Use high for urgent/pilne tasks.
        due_date: Filter by exact due date in YYYY-MM-DD format.
    """
    try:
        parsed_due_date = datetime.date.fromisoformat(due_date) if due_date else None
    except ValueError:
        parsed_due_date = None

    ticket_status: TicketStatus | None = None
    if status:
        try:
            ticket_status = TicketStatus(status)
        except ValueError:
            ticket_status = None

    ticket_priority: TicketPriority | None = None
    if priority:
        try:
            ticket_priority = TicketPriority(priority)
        except ValueError:
            ticket_priority = None

    with SessionLocal() as db:
        tickets = repo.search_tickets(
            db,
            title=title,
            status=ticket_status,
            priority=ticket_priority,
            due_date=parsed_due_date,
        )
        return {
            "tickets": [
                {
                    "id": str(t.id),
                    "title": t.title,
                    "description": t.description,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                }
                for t in tickets
            ],
            "count": len(tickets),
        }
