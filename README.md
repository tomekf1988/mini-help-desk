# Mini Help Desk

A minimal help desk application with AI-powered ticket summaries.

## Prerequisites

- Docker + Docker Compose
- An OpenAI-compatible LLM API key

## Setup

1. Clone the repo
2. Copy the env template and fill in your LLM credentials:
   ```bash
   cp .env.example .env
   # edit .env — set LLM_API_KEY (and optionally LLM_BASE_URL, LLM_MODEL)
   ```
3. Start all services (includes a local Postgres container):
   ```bash
   make up-for-dev
   ```
4. Seed sample data:
   ```bash
   make seed
   ```
5. Open the app: http://localhost:38000 (backend) / http://localhost:35173 (frontend)

> Port numbers use `MINI_HELP_DESK_PORT_PREFIX` as a prefix. Default is `3` → ports `38000`, `35173`, `35432`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MINI_HELP_DESK_PORT_PREFIX` | `3` | Prefix for all service ports |
| `MINI_HELP_DESK_DB_NAME` | `helpdesk` | Postgres database name |
| `MINI_HELP_DESK_DB_USER` | `helpdesk` | Postgres user |
| `MINI_HELP_DESK_DB_PASSWORD` | `helpdesk` | Postgres password |
| `MINI_HELP_DESK_DB_HOST` | `db` | Postgres hostname (Docker-internal default) |
| `MINI_HELP_DESK_DB_PORT` | `5432` | Postgres port |
| `LLM_API_KEY` | — | API key for the LLM service (**required**) |
| `LLM_BASE_URL` | *(OpenAI default)* | Custom base URL for OpenAI-compatible endpoints |
| `LLM_MODEL` | `gpt-4.1-mini` | Model name to use for ticket summaries |

## Commands

```bash
make up           # build and start backend+frontend only (expects external Postgres)
make up-for-dev   # build and start all services including a local Postgres container
make down         # stop all services
make logs         # tail logs
make build        # rebuild images
make seed         # seed database with sample data (skips if data exists)
make seed-force   # seed and overwrite existing data
make reset        # stop and delete volumes (data loss!)
make reset-dev    # same as reset but also removes dev compose volumes
```

## Q&A

**1. AI Dev Stack — what tools and models were used?**

The entire application was built with [Claude Code](https://claude.ai/code) (Anthropic's CLI agent) using the `claude-sonnet-4-6` model. Claude Code wrote all backend and frontend code, migrations, tests, and docs across all milestones

---

**2. API discovery — how was the model name found?**

The OpenAI API exposes a `GET /v1/models` endpoint that lists available models. I hit that endpoint with the provided API key, got back the list of model IDs, and used the returned name directly. It went straight into `.env` as `LLM_MODEL`.

---

**3. Streaming architecture — data path from LLM to browser**

```
Browser (EventSource / fetch + ReadableStream)
  ↑  SSE frames: "data: {token}\n\n"
FastAPI StreamingResponse (text/event-stream)
  ↑  async generator yields tokens
service.stream_summary_events()
  ↑  async for chunk in openai stream
openai.AsyncOpenAI → LLM API (HTTP/2 chunked)
```

Each token arrives from the LLM API as a streaming chunk, is immediately yielded as an SSE frame, and the browser appends it to the UI without buffering the full response.

**If the LLM API is slow:** the SSE connection stays open, the browser waits. No timeout on the FastAPI side by default — in production you'd add a hard deadline and emit an `[ERROR]` sentinel if it fires.

**If it drops mid-stream:** the `AsyncOpenAI` stream raises an exception. The generator catches it (`service.py`, `stream_summary_events`), emits `data: [ERROR]\n\n`, and closes. The frontend's `useStreamingSummary` hook detects `[ERROR]`, clears the animation queue, and sets an error state (`useStreamingSummary.ts`, lines 117–125). Text already displayed stays visible; buffered but not-yet-animated tokens are discarded.

---

**4. Database schema — structure and scaling**

Current schema has one table:

```
tickets (id UUID PK, title, description, status enum, priority enum,
         estimated_minutes, due_date, created_at, updated_at)
```

Simple, flat, no joins needed for the current feature set.

**For thousands of tickets with full-text search:**
- Add a `tsvector` generated column on `title || ' ' || description` and a GIN index — gives fast Postgres FTS without an extra service.
- Add a composite index on `(status, priority, created_at DESC)` for the common filtered-list query.
- If the dataset grows to millions of rows, move to a dedicated search engine (Elasticsearch / Typesense) and keep Postgres as the source of truth.
- Paginate all list endpoints (cursor-based over `created_at` — cheaper than OFFSET at scale).

---

**5. Credentials — how keys and passwords are handled**

All secrets live in `.env` (git-ignored). The backend reads them via `pydantic-settings` in `config.py` — a single place, no `os.environ` scattered across the codebase. Docker Compose passes them as environment variables; no secret is baked into any image.

**In production:**
- Inject secrets from a secrets manager (AWS Secrets Manager, HashiCorp Vault) at container start, not via env files on disk.
- Use IAM roles / workload identity for cloud-native services instead of long-lived API keys where possible.
- Rotate the database password independently from the application key; set `LLM_API_KEY` as a short-lived token if the provider supports it

---

**6. Tradeoffs — what was skipped and what comes next**

Skipped due to time:
- **Auth** — no user accounts, anyone can read/modify any ticket.
- **Pagination** — list endpoint returns all tickets; would be a problem at scale.
- **Multi-project support** — tickets are global; no way to group them into projects or assign ownership.
- **UX improvements** — no optimistic updates, no inline editing confirmation, no keyboard shortcuts.
- **AI chat agent** — a mini assistant with tools (create/search tickets via natural language).

First things to add:
1. **JWT auth + multiple users** — protect all endpoints, let users own their tickets.
2. **Cursor-based pagination** on `GET /api/tickets` — one migration, one query change, minimal frontend work.
3. **Projects** — add a `projects` table, foreign key on `tickets.project_id`, filter by project in the list view.
4. **AI chat agent** — already planned and will be added as an extra feature on a separate branch.

---

**7. Time spent**

Total: ~3 hours across all milestones.

What took longer than expected:
- **Local setup overhead** — started with a local database and my own API key instead of using the provided credentials from the beginning; switching mid-way cost time that could have been avoided.

---

## Running tests

Tests use SQLite in-memory — no postgres required, no external dependencies.

```bash
docker compose exec backend pytest tests/ -v
docker compose exec backend ruff check app tests
docker compose exec backend mypy app
docker compose exec frontend npm test -- --run
docker compose exec frontend npm run build
```