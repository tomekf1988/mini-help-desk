# PR: milestone 2 — database and data model

**PR:** #2  
**Title:** feat: milestone 2 — database and data model  
**Merged:** 2026-05-29  
**Changes:** +386 / -34 across 14 files

## Summary

- `Ticket` SQLAlchemy model with `TicketStatus` (open/in_progress/closed) and `TicketPriority` (low/medium/high) enums; fields include `estimated_minutes` and `due_date` beyond the base spec
- Alembic migration `001_init` creates enum types and `tickets` table; `alembic/env.py` reads DB URL via `settings.database_url`
- `scripts/seed.py`: 5 sample tickets, idempotent; removed unused `app/seed.py` stub
- `tests/test_models.py`: 5 tests with session-scoped engine and per-test transaction rollback for isolation
- `config.py`: removed `env_file` fallback — env vars come from docker-compose
- `docker-compose.yml`: added `LLM_API_KEY` to backend env

## Test plan

- [x] `docker compose exec backend pytest -v` — 6 passed (health + 5 model tests)
- [x] `docker compose exec backend alembic upgrade head` — runs clean on fresh DB
- [x] `docker compose exec backend uv run scripts/seed.py` — seeds 5 tickets; idempotent on re-run
- [x] `make down && docker compose up --build -d && docker compose logs --tail=30` — no ERROR/FATAL
