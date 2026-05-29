# Simple Planner

## Goal

Build a minimal planner/help desk style application with AI-powered summaries.

The project must:

* use FastAPI backend
* use React + TypeScript frontend
* use PostgreSQL
* support SSE streaming
* use the provided LLM API
* remain simple and production-readable
* avoid overengineering


Focus on:

1. working solution
2. readable code
3. simple architecture
4. clean streaming implementation
5. good developer workflow

Avoid:

* microservices
* CQRS
* event sourcing
* excessive abstractions
* unnecessary design patterns

## Backend Stack

* Python 3.14
* uv (environment manager — use `uv venv`, `uv pip`, `uv run`; never bare `pip install`)
* FastAPI
* SQLAlchemy 2.x
* PostgreSQL
* Alembic
* openai (LLM streaming)
* langchain-openai + langchain-core (agent tool calling)
* httpx
* pytest (test runner)
* ruff (linter + formatter — replaces black/flake8)
* mypy (type checker)

## Frontend Stack

* React
* TypeScript
* Vite
* react-router-dom
* vitest + @testing-library/react

## Architecture


### Key conventions

* Service layer never imports `HTTPException` — raises `NotFoundError` instead
* `config.py` is the single place for env var reads
* SSE endpoint: `GET /api/tickets/{id}/summary/stream` — token events + `[DONE]`
* `useStreamingSummary` guards start on `esRef.current`, not stale `isStreaming` state
* Inline styles only in frontend (no CSS modules, no Tailwind)
* All datetimes are naive UTC — `DateTime` column (not timezone-aware); `_utcnow()` strips tzinfo
* `updated_at` uses ORM-level `onupdate` — bulk `session.execute(update(...))` must set it explicitly
* Ticket status enum values: `open`, `in_progress`, `closed` (not `resolved`)

## Streaming

LLM summaries must stream token-by-token:
LLM API -> FastAPI SSE -> React frontend

Do not buffer the full response.

## Code Style

* readable over clever
* simple naming
* small functions
* avoid premature optimization
* explicit code preferred

## Testing

Add automated tests where reasonable:

* backend API tests
* service tests
* basic frontend states if useful

Prefer pragmatic coverage over perfect coverage.

## Workflow

Work milestone-by-milestone.

For each milestone:

1. implementation
2. automated tests
3. review
4. summary
5. update CLAUDE.md to reflect any architectural decisions, new conventions, or stack changes introduced in the milestone

## Agents

For backend implementation tasks (models, migrations, repositories, API endpoints, tests),
delegate to the `python-dev` subagent via the Agent tool.

For frontend implementation tasks (components, pages, hooks, streaming UI, TypeScript),
delegate to the `react-dev` subagent via the Agent tool.

After each implementation milestone (or when explicitly asked to review),
delegate to the `reviewer` subagent via the Agent tool.

## Git

* Never add `Co-Authored-By` to commit messages — commits are authored by the user only
* Every commit must include all milestone artifacts — not just implementation files:
  * `docs/prs/<milestone>.md`
  * `docs/reviews/<milestone>_review.md` (if exists)
  * `tasks/done.md`, `tasks/in_progress.md`, `tasks/todo.md`
* Always run `git status --short` before committing to catch untracked docs and tasks files

## Docker commands

Always use Docker — never run project tooling (Python, npm, vitest, pytest, alembic, etc.) directly on the host:

- `docker compose exec backend <cmd>` — backend commands (pytest, alembic, ruff, mypy)
- `docker compose exec frontend <cmd>` — frontend commands (npm test, npm run build)
- `make up`, `make down`, `make logs` — lifecycle
- `docker compose up --build -d` — rebuild and start in background

This applies to both backend and frontend.

## Deliverables

The application should:

* run with docker compose
* support one-command startup
* include seed data
* include README setup instructions

