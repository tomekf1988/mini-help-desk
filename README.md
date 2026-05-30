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
   # edit .env — set LLM_API_KEY and adjust DB vars
   # LLM_BASE_URL is optional (leave empty to use standard OpenAI API)
   # LLM_MODEL defaults to gpt-4o-mini
   ```
3. Start all services:
   ```bash
   make up
   ```
4. *(Optional)* Seed sample data:
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
| `LLM_BASE_URL` | — | Base URL for OpenAI-compatible endpoint (optional — leave empty for standard OpenAI) |
| `LLM_MODEL` | `gpt-4o-mini` | Model name |

## Commands

```bash
make up           # build and start all services
make up-for-dev   # same as up but also spins up a local Postgres container
make down         # stop all services
make logs         # tail logs
make build        # rebuild images
make seed         # seed database with sample data (skips if data exists)
make seed-force   # seed and overwrite existing data
make reset        # stop and delete volumes (data loss!)
make reset-dev    # same as reset but also removes dev compose volumes
```

## Q&A


### 1. AI Dev Stack — what tools and models were used?

I used Claude Code with the Sonnet 4.6 model throughout the assignment. It helped with implementation, refactoring, test generation, and code reviews. In addition to Claude Code, I occasionally used ChatGPT and referenced a few of my previous projects for common setup tasks. For example, I reused Docker configuration patterns that I had already established in earlier Python and React applications.
---

### 2. API discovery — how was the model name found?

Since the service exposes an OpenAI-compatible API, I queried the `/v1/models` endpoint and used the returned model identifier (`unsloth/Qwen3.5-9B`) in the application configuration.

---

### 3. Streaming architecture — how does the response flow?

```text
Browser
  ↑
SSE (text/event-stream)
  ↑
FastAPI StreamingResponse
  ↑
Async generator
  ↑
OpenAI-compatible streaming API
```

The backend does not wait for the full completion. As tokens arrive from the LLM API, they are immediately forwarded to the browser as SSE events and rendered incrementally.

If the LLM API is slow, the connection remains open and the user continues receiving tokens as they arrive.

If the stream fails, the backend catches the exception, emits an error event, and closes the connection. Any text already displayed remains visible.

---

### 4. Database — schema and scaling

The application uses a single `tickets` table containing ticket details, status information, and timestamps.

For larger datasets I would:
- add pagination,
- index commonly filtered fields,
- use PostgreSQL full-text search (`tsvector` + GIN index),
- consider a dedicated search engine (Elasitc Search for example) only if search requirements became significantly more advanced.

- Allow custom statuses and priorities instead of hardcoded enums. This would let teams configure their own workflow without code changes.
- Introduce a `projects` table and allow tickets to be grouped by project.
- Add users and ticket ownership so tickets can be assigned to specific people.

---

### 5. Credentials — how were secrets handled?

Credentials are provided through environment variables and are not stored in the repository.

Application configuration is loaded via `pydantic-settings`, which keeps all configuration in a single place and avoids hardcoded values in the code.

For a production deployment I would use a dedicated secrets management solution such as AWS Secrets Manager or HashiCorp Vault.

---

### 6. Tradeoffs — what was simplified?

To stay within the time limit I intentionally skipped:
- authentication,
- pagination,
- multi-user support,
- advanced UI features.

If I had another few hours, I would start with JWT authentication and user ownership of tickets, then add pagination and project-level organization.

I would also introduce a shared contract (e.g. a typed schema or a simple constants file) for SSE event formats between the backend and frontend — currently both sides agree on `data: <token>\n\n` and the `[DONE]` sentinel by convention only, which is fragile as the protocol evolves.

The codebase structure is intentionally kept flat and demo-style. A production version would benefit from a clearer separation: dedicated repository layer, stricter service boundaries, and split routers per domain.

One feature I did have time to plan and implement as a bonus: a mini chat agent with tools that can create and search tickets via natural language. It is available on the [`extra_milestone`](../../tree/extra_milestone) branch.

---

### 7. Time spent


Approximately 3 hours to reach the first fully working version of the application, including the backend, frontend, database integration, and LLM-powered streaming summaries.

The discussion answers, minor fixes, cleanup work, and an experimental AI chat agent branch were completed after the initial 3-hour implementation window. The chat agent was built as a separate experiment and is not part of the assignment requirements.

The biggest time sink was local setup. I initially started with my own database and API configuration before switching to the credentials provided in the assignment.
After switching from my own model configuration to the model provided in the assignment, the application felt noticeably slower. I spent some time investigating the cause and found that disabling reasoning mode (`enable_thinking=False`) significantly improved response times for the summarization use case.
Since the application only needed short ticket summaries rather than complex reasoning, disabling thinking provided a better user experience with faster streaming responses.

## Running tests *(development only)*

Tests use SQLite in-memory — no postgres required, no external dependencies.

```bash
docker compose exec backend pytest tests/ -v
docker compose exec backend ruff check app tests
docker compose exec backend mypy app
docker compose exec frontend npm test -- --run
docker compose exec frontend npm run build
```