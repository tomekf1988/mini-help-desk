# DONE

## Milestone 1 — Infrastructure & Skeleton

- [x] docker-compose.yml — db, backend, frontend services with MINI_HELP_DESK_PORT_PREFIX port pattern
- [x] Makefile — up, down, logs, build, seed, reset + check-env guard
- [x] .env.example — all required environment variables
- [x] README.md — setup instructions
- [x] backend/Dockerfile — python:3.14-slim + uv
- [x] backend/entrypoint.sh — alembic upgrade head + uvicorn --reload
- [x] backend/pyproject.toml — prod deps + [dev] optional group
- [x] backend/alembic/ — env.py, script.py.mako, versions/001_init.py
- [x] backend/app/main.py — GET /api/health → {"status": "ok"}
- [x] backend/app/config.py — pydantic-settings, single env var read point
- [x] backend/app/database.py — SQLAlchemy engine + SessionLocal + Base
- [x] backend/app/seed.py — stub
- [x] backend/tests/test_health.py — assert 200 + {"status": "ok"}
- [x] frontend/Dockerfile — node:22-alpine, port 5173
- [x] frontend/package.json — Vite + React + TS + react-router-dom + vitest
- [x] frontend/src/main.tsx — BrowserRouter + App
- [x] frontend/src/App.tsx — Routes shell
- [x] Review — critical: missing init migration + dev deps in prod; both fixed

## Milestone 2 — Database & Data Model

- [x] backend/app/models.py — Ticket model with TicketStatus (open/in_progress/closed) and TicketPriority (low/medium/high); fields: id, title, description, status, priority, estimated_minutes, due_date, created_at, updated_at
- [x] backend/alembic/versions/001_init.py — creates ticketstatus + ticketpriority enum types + tickets table; downgrade drops all
- [x] backend/alembic/env.py — uses settings.database_url; imports app.models to register with Base.metadata
- [x] backend/scripts/seed.py — standalone idempotent script, 10 sample tickets
- [x] backend/tests/test_models.py — 5 tests, session-scoped engine, per-test rollback isolation
- [x] Review — fixed: env.py bypassed settings (now uses settings.database_url); tests had shared state (now per-test rollback + ID-based assertions)
- [x] Startup verified — make down && docker compose up --build -d; no ERROR/FATAL in logs
- [x] All tests pass — 6/6 (test_health + 5 model tests)
- [x] docs/milestones/milestone_2_database_and_data_model.md updated
