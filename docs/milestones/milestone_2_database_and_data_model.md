# Milestone 2 — Database & Data Model

## Goal

Working DB schema with migrations and seed data.

## Domain model

```
Ticket
  id                UUID PK
  title             str  (not null, indexed)
  description       str  (nullable)
  status            enum: open | in_progress | closed
  priority          enum: low | medium | high
  estimated_minutes int  (nullable)
  due_date          date (nullable)
  created_at        datetime (auto, naive UTC)
  updated_at        datetime (auto-update, naive UTC — ORM-level only)
```

## Deliverables

| File | Description |
|---|---|
| `backend/app/models.py` | SQLAlchemy 2.x `Ticket` model, `TicketStatus`, `TicketPriority` enums |
| `backend/app/database.py` | Sync engine + `SessionLocal` factory (unchanged from M1) |
| `backend/alembic/env.py` | Uses `settings.database_url` (not raw os.environ); imports `app.models` |
| `backend/alembic/versions/001_init.py` | Migration: creates `ticketstatus` + `ticketpriority` enum types + `tickets` table |
| `backend/scripts/seed.py` | Inserts 10 sample tickets, idempotent (skips if table non-empty) |
| `backend/tests/test_models.py` | 5 model tests against real test DB, per-test rollback isolation |

## Actual decisions

- **Status enum**: `open | in_progress | closed` (spec said `resolved`, user changed to `closed`)
- **Extra fields**: `estimated_minutes` (int, nullable) and `due_date` (date, nullable) added per user request
- **Stack stays synchronous**: existing database.py is sync; async was not introduced
- **Naive UTC datetimes**: `_utcnow()` returns naive datetime (UTC value, tzinfo stripped). `DateTime` column, not `DateTime(timezone=True)`. Convention: all datetimes in this app are naive UTC.
- **`onupdate` is ORM-level only**: `updated_at` auto-updates only via ORM flush/commit, not via bulk `session.execute(update(...))`. This is intentional for simplicity; bulk updates must set `updated_at` explicitly if needed.
- **enum types in migration**: Used `postgresql.ENUM(..., create_type=False)` with explicit `.create(checkfirst=True)` to avoid SQLAlchemy's before_create hook conflict.
- **Test isolation**: `scope="session"` engine with `scope="function"` connection + transaction rollback per test. Assertions use inserted IDs, not status/priority filters, to avoid cross-test pollution.
- **`alembic/env.py`**: Uses `settings.database_url` per project convention (single env var read point in `config.py`)
- **scripts/seed.py**: Standalone script in `backend/scripts/`, adds its own `sys.path` insert. Idempotent via `Ticket.query().first()` check — skips if any ticket exists.

## Ports / env vars

No changes to ports or env vars from Milestone 1.

## Tests

```bash
docker compose exec backend pytest tests/test_models.py -v  # 5 passed
docker compose exec backend pytest -v                        # 6 passed (includes test_health)
```

## Verification

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend uv run scripts/seed.py
docker compose exec backend pytest tests/test_models.py
```
