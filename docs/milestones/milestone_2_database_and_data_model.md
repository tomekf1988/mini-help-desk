# Milestone 2 — Database & Data Model

## Goal

Working DB schema with migrations and seed data.

## Domain model

```
Ticket
  id          UUID PK
  title       str  (not null)
  description str  (nullable)
  status      enum: open | in_progress | resolved
  priority    enum: low | medium | high
  created_at  datetime (auto)
  updated_at  datetime (auto-update)
```

## Deliverables

| File | Description |
|---|---|
| `backend/app/models.py` | SQLAlchemy 2.x `Ticket` model, `StatusEnum`, `PriorityEnum` |
| `backend/app/database.py` | Async engine + `AsyncSession` factory |
| `backend/app/config.py` | Add `DATABASE_URL` (extends M1 config) |
| `backend/alembic/` | Alembic setup: `alembic.ini`, `env.py` (async) |
| `backend/alembic/versions/0001_create_tickets.py` | Initial migration |
| `backend/scripts/seed.py` | Inserts 10 sample tickets, idempotent |

## Key decisions

- SQLAlchemy 2.x async — matches the rest of the async stack
- UUID primary keys (not integer)
- `updated_at` uses `onupdate=func.now()`
- Seed script is standalone and idempotent — safe to re-run

## Tests

- `backend/tests/test_models.py` — create and query a ticket against a real test DB (no mocks)

## Agent delegation

- `python-dev`: all of the above

## Verification

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend uv run scripts/seed.py
docker compose exec backend pytest tests/test_models.py
```