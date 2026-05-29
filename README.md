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
3. Start all services:
   ```bash
   make up
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
| `LLM_API_KEY` | — | API key for the LLM service (**required**) |
| `LLM_BASE_URL` | *(OpenAI default)* | Custom base URL for OpenAI-compatible endpoints |
| `LLM_MODEL` | `gpt-4.1-mini` | Model name to use for ticket summaries |

## Commands

```bash
make up       # build and start all services
make down     # stop all services
make logs     # tail logs
make build    # rebuild images
make seed     # seed database with sample data
make reset    # stop and delete all volumes (data loss!)
```

## Running tests

Tests use SQLite in-memory — no postgres required, no external dependencies.

```bash
docker compose exec backend pytest tests/ -v
docker compose exec backend ruff check app tests
docker compose exec backend mypy app
docker compose exec frontend npm test -- --run
docker compose exec frontend npm run build
```