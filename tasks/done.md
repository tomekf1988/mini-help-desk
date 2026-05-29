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

## Milestone 5 — LLM Integration & Streaming

### Backend
- [x] backend/app/config.py — added llm_model (default "gpt-4.1-mini"), llm_base_url (default ""); env vars LLM_MODEL, LLM_BASE_URL
- [x] backend/app/llm.py — async generator stream_summary(ticket); AsyncOpenAI with api_key=llm_api_key, conditional base_url; skips None delta chunks
- [x] backend/app/routers/summary.py — GET /api/tickets/{id}/summary/stream; upfront 404 check; StreamingResponse; Cache-Control + X-Accel-Buffering headers
- [x] backend/app/main.py — summary router included
- [x] backend/tests/test_summary_stream.py — 3 tests: SSE events, 404 for missing, cache-control headers; all pass
- [x] All 20 backend tests pass

### Frontend
- [x] frontend/src/hooks/useStreamingSummary.ts — EventSource hook, guards on esRef.current, accumulates tokens, [DONE] closes stream
- [x] frontend/src/components/SummaryPanel.tsx — "Generate Summary" button + live streaming text display + spinner + error state
- [x] frontend/src/pages/TicketDetailPage.tsx — AI Summary placeholder replaced with SummaryPanel
- [x] frontend/src/hooks/useStreamingSummary.test.ts — 8 tests: URL, start, tokens, [DONE], error, double-start guard, reset; all pass
- [x] All 12 frontend tests pass
- [x] Startup verified — make down && docker compose up --build -d; no ERROR/FATAL in logs

## Milestone 6 — Finalization and Delivery

- [x] docker-compose.yml — MINI_HELP_DESK_DB_HOST in DATABASE_URL; LLM_BASE_URL + LLM_MODEL passed to backend; TEST_DATABASE_URL removed
- [x] backend/app/config.py — removed test_database_url; type: ignore[call-arg] for pydantic-settings
- [x] backend/app/main.py — explicit if/else for AsyncOpenAI init (fixes mypy **kwargs error)
- [x] backend/app/seed.py — seed_if_empty(db) + __main__ block for standalone invocation via python -m app.seed
- [x] backend/scripts/seed.py — thin wrapper delegating to app.seed (no duplication)
- [x] backend/tests/conftest.py — SQLite in-memory fixtures: db_engine, db_session, client, api_client
- [x] backend/tests/test_tickets_api.py — removed postgres-specific fixtures; uses conftest
- [x] backend/tests/test_summary_stream.py — removed postgres-specific fixtures; local api_client stubs LLM
- [x] .env.example — MINI_HELP_DESK_DB_HOST, LLM_BASE_URL, LLM_MODEL with comments
- [x] Makefile — seed uses python -m app.seed; MINI_HELP_DESK_DB_HOST optional (has default)
- [x] README.md — prerequisites, env vars table, commands, test instructions
- [x] docs/milestones/milestone_6_finalization_and_delivery.md updated
- [x] docs/reviews/milestone_6_review.md — critical: make seed broken + scripts/seed.py broken; both fixed
- [x] ruff check — clean
- [x] mypy — no issues (0 errors)
- [x] pytest — 20/20 passed (SQLite in-memory)
- [x] npm test — 12/12 passed
- [x] npm run build — clean (181 kB bundle)

## Milestone 7 — Docker Compose Split: External DB vs Local Dev DB

- [x] docker-compose.yml — removed `db` service, `depends_on`, and `volumes: db_data`; updated `DATABASE_URL` to use `${MINI_HELP_DESK_DB_HOST}:${MINI_HELP_DESK_DB_PORT:-5432}`
- [x] docker-compose.dev.yml — new file; `db` service (postgres:16) + backend `DATABASE_URL` override (`@db:5432`) + `depends_on: db (service_healthy)` + `volumes: db_data`
- [x] Makefile — added `up-for-dev` and `reset-dev` targets; updated `.PHONY`
- [x] .env.example — added `MINI_HELP_DESK_DB_PORT=5432`; updated `MINI_HELP_DESK_DB_HOST` comment
- [x] Verified: `make up-for-dev` — db healthy, backend ran migrations, uvicorn started; no ERROR/FATAL
- [x] Verified: `make down` — clean shutdown
- [x] docs/milestones/milestone_7_db_config.md updated

## Milestone 8 — Agent Backend: Tool Calling & Chat SSE

- [x] backend/app/events.py — `SSEEvent` dataclass with `.to_sse()` producing `data: <json>\n\n`
- [x] backend/app/prompts/__init__.py — empty package marker
- [x] backend/app/prompts/assistant.md — prompt template file with `{today}`, `{tomorrow}`, `{create_ticket_examples}`, `{search_tickets_examples}`
- [x] backend/app/prompts/assistant.py — `get_system_prompt()` via `PromptTemplate.from_file()` (LangChain refactor)
- [x] backend/app/agent_tools.py — `@tool`-decorated `create_ticket_tool` / `search_tickets_tool`; self-contained `SessionLocal` sessions; `CREATE_TICKET_EXAMPLES` / `SEARCH_TICKETS_EXAMPLES` constants
- [x] backend/app/database.py — added module-level `SessionLocal` for tools
- [x] backend/app/repository.py — added `search_tickets()` with dynamic WHERE filters (title ilike, status, priority, due_date)
- [x] backend/app/agent_service.py — `run_agent_stream(messages)` using `ChatOpenAI` + `bind_tools` + `astream` (LangChain refactor)
- [x] backend/app/schemas.py — added `ChatMessage`, `ChatRequest`
- [x] backend/app/routers/chat.py — `POST /api/chat/stream` SSE endpoint; no `app.state` dependencies
- [x] backend/app/main.py — chat router included
- [x] backend/pyproject.toml — added `langchain-openai>=0.3` and `langchain-core>=0.3`
- [x] backend/tests/test_chat_stream.py — 4 tests; `api_client` fixture no longer sets `app.state` stubs
- [x] pytest — 24/24 passed
- [x] ruff check — All checks passed
- [x] mypy — Success: no issues found in 20 source files
- [x] Startup verified — no ERROR/FATAL in backend logs
- [x] docs/milestones/milestone_8_agent_backend.md updated

## Milestone 9 — Chat UI Frontend

- [x] Modify `frontend/src/types.ts` — added `CreatedTicket`, `ChatMessage`, `SSEEvent` types
- [x] Create `frontend/src/hooks/useChat.ts` — fetch-based SSE hook with sessionStorage history; no `id` on ChatMessage
- [x] Create `frontend/src/components/ChatPanel.tsx` — 360px sidebar; uses `StatusBadge` and `PriorityBadge` instead of inline pills
- [x] Modify `frontend/src/pages/TicketListPage.tsx` — wrapped in flex row, `ChatPanel` added on right with `onTicketsUpdated={loadTickets}`
- [x] Create `frontend/src/test/ChatPanel.test.tsx` — 7 tests; all pass
- [x] All 20 frontend tests pass
- [x] docs/milestones/milestone_9_chat_ui.md updated
