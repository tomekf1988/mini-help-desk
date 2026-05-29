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

## Milestone 3 — Core CRUD API

- [x] backend/app/errors.py — NotFoundError(Exception) with resource_id attribute
- [x] backend/app/schemas.py — TicketCreate, TicketUpdate, TicketResponse (Pydantic v2, from_attributes=True)
- [x] backend/app/repository.py — get_ticket, list_tickets, create_ticket, update_ticket, delete_ticket (SQLAlchemy 2.x)
- [x] backend/app/service.py — business logic layer, raises NotFoundError, no FastAPI imports
- [x] backend/app/routers/__init__.py — empty package init
- [x] backend/app/routers/tickets.py — FastAPI router, 5 endpoints, NotFoundError → 404
- [x] backend/app/main.py — updated to include tickets router
- [x] backend/tests/test_tickets_api.py — 11 tests, full CRUD cycle, 404s, status filter
- [x] ruff check — All checks passed
- [x] mypy — 0 new errors (1 pre-existing in config.py from milestone 2)
- [x] pytest — 17/17 passed
- [x] Startup verified — make down && docker compose up --build -d; no ERROR/FATAL in logs
- [x] docs/milestones/milestone_3_core_crud_api.md updated

## Milestone 4 — Frontend List and Detail

- [x] frontend/src/index.css — global reset + font + background
- [x] frontend/src/types.ts — Ticket, TicketStatus, TicketPriority types
- [x] frontend/src/api/tickets.ts — getAllTickets, getTicketById, createTicket, updateTicket
- [x] frontend/src/components/Layout.tsx — full-height wrapper
- [x] frontend/src/components/Spinner.tsx — loading spinner with CSS animation
- [x] frontend/src/components/StatusBadge.tsx — color-coded status pill (open/in_progress/closed)
- [x] frontend/src/components/TicketCard.tsx — row with priority/status badge, hover state, navigates to detail
- [x] frontend/src/components/TicketForm.tsx — create ticket form with focus ring, grid layout, submit button
- [x] frontend/src/pages/TicketListPage.tsx — Backlog list with pill filters (status/priority/due) + embedded create form
- [x] frontend/src/pages/TicketDetailPage.tsx — two-column layout, editable sidebar, status cycle, AI summary placeholder
- [x] frontend/src/pages/TicketCreatePage.tsx — standalone create page wrapping TicketForm
- [x] frontend/src/App.tsx — ErrorBoundary + Routes: /, /tickets/new, /tickets/:id
- [x] frontend/src/main.tsx — imports index.css
- [x] frontend/src/test/setup.ts — @testing-library/jest-dom import
- [x] frontend/src/test/TicketListPage.test.tsx — 3 tests: renders tickets, empty state, form submit POST
- [x] frontend/src/test/TicketCreatePage.test.tsx — 1 test: form submit calls POST /api/tickets
- [x] vite.config.ts — setupFiles: ['./src/test/setup.ts']
- [x] All 4 tests pass, TypeScript build clean
