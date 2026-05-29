import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    title: str
    description: str | None = None
    status: TicketStatus = TicketStatus.open
    priority: TicketPriority = TicketPriority.medium
    estimated_minutes: int | None = None
    due_date: date | None = None


class TicketUpdate(BaseModel):
    description: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    estimated_minutes: int | None = None
    due_date: date | None = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None
    status: TicketStatus
    priority: TicketPriority
    estimated_minutes: int | None
    due_date: date | None
    created_at: datetime
    updated_at: datetime
