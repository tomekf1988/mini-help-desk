"""init

Revision ID: 001
Revises:
Create Date: 2026-05-29

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ticketstatus = postgresql.ENUM(
    "open", "in_progress", "closed",
    name="ticketstatus",
    create_type=False,
)
ticketpriority = postgresql.ENUM(
    "low", "medium", "high",
    name="ticketpriority",
    create_type=False,
)


def upgrade() -> None:
    ticketstatus.create(op.get_bind(), checkfirst=True)
    ticketpriority.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "tickets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", ticketstatus, nullable=False),
        sa.Column("priority", ticketpriority, nullable=False),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tickets_title", "tickets", ["title"])


def downgrade() -> None:
    op.drop_index("ix_tickets_title", table_name="tickets")
    op.drop_table("tickets")
    ticketstatus.drop(op.get_bind(), checkfirst=True)
    ticketpriority.drop(op.get_bind(), checkfirst=True)
