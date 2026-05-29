# Milestone 7 — Docker Compose Split: External DB vs Local Dev DB

## Goal

Allow connecting to an external database without running a local PostgreSQL container.

- `make up` — starts backend + frontend, connects to the database configured in `.env` (can be external)
- `make up-for-dev` — starts backend + frontend + local PostgreSQL (existing behavior)

## Deliverables

| File | Action | Description |
|------|--------|-------------|
| `docker-compose.yml` | Modified | Removed `db` service, `depends_on`, and `volumes: db_data`; `DATABASE_URL` now uses `${MINI_HELP_DESK_DB_HOST}:${MINI_HELP_DESK_DB_PORT:-5432}` |
| `docker-compose.dev.yml` | New file | `db` service (postgres:16) + backend `DATABASE_URL` override (`@db:5432`) + `depends_on: db (service_healthy)` + `volumes: db_data` |
| `Makefile` | Modified | Added `up-for-dev` and `reset-dev` targets; updated `.PHONY` |
| `.env.example` | Modified | Added `MINI_HELP_DESK_DB_PORT=5432`; updated `MINI_HELP_DESK_DB_HOST` comment |

## Key decisions

- **Two-file compose split**: `docker-compose.yml` as the base (no `db` service), `docker-compose.dev.yml` as an overlay that adds local PostgreSQL. Docker Compose natively supports merging files via `-f`.
- **`MINI_HELP_DESK_DB_PORT`**: New env var to support non-standard database ports. Defaults to `5432` via `${MINI_HELP_DESK_DB_PORT:-5432}` in the base file.
- **`DATABASE_URL` override in dev**: `docker-compose.dev.yml` overrides the backend `DATABASE_URL` to `@db:5432`, ensuring dev mode always uses the local container regardless of what `MINI_HELP_DESK_DB_HOST` is set to in `.env`.
- **`depends_on` only in dev**: The base `docker-compose.yml` has no `depends_on` — there is nothing to wait for with an external database. The dev overlay adds `depends_on: db (service_healthy)`.
- **`reset-dev` for volume cleanup**: Removing the `db_data` volume only makes sense in dev mode (local database). `reset-dev` uses both compose files so Docker knows about the volume to remove it. `reset` remains as a plain `docker compose down -v` for any other cleanup.
- **No default for `MINI_HELP_DESK_DB_HOST` in base file**: The `:-db` default was removed from `docker-compose.yml`; the default now lives in `.env.example` as `MINI_HELP_DESK_DB_HOST=db`, keeping the compose file honest about its requirements.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MINI_HELP_DESK_PORT_PREFIX` | `3` | Prefix for all service ports |
| `MINI_HELP_DESK_DB_NAME` | — | Database name |
| `MINI_HELP_DESK_DB_USER` | — | Database user |
| `MINI_HELP_DESK_DB_PASSWORD` | — | Database password |
| `MINI_HELP_DESK_DB_HOST` | `db` | Database hostname (set to external host when not using local container) |
| `MINI_HELP_DESK_DB_PORT` | `5432` | Database port (set to external port when not using local container) |
| `LLM_API_KEY` | — | LLM API key (**required**) |
| `LLM_BASE_URL` | *(OpenAI default)* | Custom base URL for OpenAI-compatible endpoints |
| `LLM_MODEL` | `gpt-4.1-mini` | Model name for ticket summaries |

## Verification

```bash
# Dev mode (local database):
# Set in .env: MINI_HELP_DESK_DB_HOST=db, MINI_HELP_DESK_DB_PORT=5432
make up-for-dev
docker compose logs db         # local postgres should be healthy
docker compose logs backend    # alembic migration ran, uvicorn started

make down

# Reset dev local database volume:
make reset-dev

# External database mode:
# Set in .env: MINI_HELP_DESK_DB_HOST=<external-host>, MINI_HELP_DESK_DB_PORT=<port>
make up
docker compose logs backend    # backend should connect to the external database
```

## Verification result (milestone 7)

- `docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d` — all three containers started
- `db` initialized fresh (clean volume after `reset-dev`)
- `backend` ran `Running upgrade -> 001, init` and started uvicorn — no ERROR/FATAL
- `frontend` served on port 5173 — no ERROR/FATAL
- `make down` — clean shutdown
- `docker-compose.yml` contains no `db` service (confirmed with `grep`)
- `docker-compose.dev.yml` created and verified
