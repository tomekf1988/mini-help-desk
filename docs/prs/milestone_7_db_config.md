# PR: feat: milestone 7 — docker compose split, external DB support

**Branch:** feature/milestone_7_db_config → main

## Summary

Splits docker-compose into a base file (no local PostgreSQL) and a dev overlay, so the application can connect to an external database out of the box. Adds `make up-for-dev` for local development with a local container. Extends `make seed` with a `--force` flag via a new `make seed-force` target.

## Changes

### Infrastructure
- **`docker-compose.yml`** — removed `db` service, `depends_on`, and `volumes: db_data`; `DATABASE_URL` now uses `${MINI_HELP_DESK_DB_HOST}:${MINI_HELP_DESK_DB_PORT:-5432}` (port configurable)
- **`docker-compose.dev.yml`** — new overlay: adds `db` service (postgres:16 with healthcheck), overrides backend `DATABASE_URL` to `@db:5432`, adds `depends_on: db (service_healthy)`, declares `db_data` volume
- **`Makefile`** — added `up-for-dev` (`-f docker-compose.yml -f docker-compose.dev.yml up --build`); added `seed-force`; added `reset-dev` (down -v with both files); updated `.PHONY`
- **`.env.example`** — added `MINI_HELP_DESK_DB_PORT=5432`; updated `MINI_HELP_DESK_DB_HOST` comment to distinguish external vs local dev usage

### Backend
- **`app/seed.py`** — extracted `_insert(db)` helper; added `force_seed(db)` that truncates all tickets then seeds; `__main__` block reads `--force` / `-f` from `sys.argv`

## Acceptance criteria

- [x] `make up` starts backend + frontend only (no `db` container)
- [x] `make up-for-dev` starts backend + frontend + local PostgreSQL
- [x] `DATABASE_URL` includes configurable `MINI_HELP_DESK_DB_PORT`
- [x] `make seed-force` clears existing tickets and reloads seed data
- [x] `make reset-dev` tears down local DB volume
- [x] Startup verified: `make up-for-dev` — no ERROR/FATAL in logs

## Technical decisions

- **No `:-db` default in base compose** — the `${MINI_HELP_DESK_DB_HOST:-db}` fallback was removed from `docker-compose.yml`; the default now lives in `.env.example`, keeping the compose file honest about its requirements.
- **Dev overlay overrides `DATABASE_URL`** — even if `.env` has an external host configured, `docker-compose.dev.yml` unconditionally points the backend at `@db:5432`, so dev mode always uses the local container.
- **`force_seed` deletes via ORM** — uses `db.query(Ticket).delete()` + `commit()` before re-inserting, which respects SQLAlchemy's unit-of-work and works with both PostgreSQL and SQLite (tests).
