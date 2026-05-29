import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import NotFoundError
from app.models import Ticket, TicketStatus
from app.schemas import TicketCreate, TicketResponse, TicketUpdate
from app import service

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.get("/", response_model=list[TicketResponse])
def list_tickets(
    status: TicketStatus | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Ticket]:
    return service.list_tickets(db, status=status)


@router.post("/", response_model=TicketResponse, status_code=201)
def create_ticket(
    data: TicketCreate,
    db: Session = Depends(get_db),
) -> Ticket:
    return service.create_ticket(db, data)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> Ticket:
    try:
        return service.get_ticket(db, ticket_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: uuid.UUID,
    data: TicketUpdate,
    db: Session = Depends(get_db),
) -> Ticket:
    try:
        return service.update_ticket(db, ticket_id, data)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(
    ticket_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> None:
    try:
        service.delete_ticket(db, ticket_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
