# Milestone 1 — Infrastructure & Skeleton

## Goal

One-command startup with all services running and health-checked.

## Deliverables

| File | Description |
|---|---|
| `docker-compose.yml` | Services: `db`, `backend`, `frontend` |
| `Makefile` | Targets: `up`, `down`, `logs`, `build`, `seed`, `reset` + `check-env` guard |
| `.env.example` | Template for all required env vars |
| `backend/Dockerfile` | python:3.14-slim image, uv-based dep install |
| `backend/entrypoint.sh` | Runs `alembic upgrade head` then `uvicorn --reload` |
| `backend/pyproject.toml` | uv project, prod deps + `[dev]` optional group |
| `backend/alembic/` | Alembic setup: env.py, script.py.mako, versions/001_init.py |
| `backend/app/main.py` | FastAPI app, `GET /api/health` → `{"status": "ok"}` |
| `backend/app/config.py` | Single place for all env var reads (pydantic-settings) |
| `backend/app/database.py` | SQLAlchemy engine, SessionLocal, Base |
| `backend/app/seed.py` | Stub for future seed data |
| `backend/tests/test_health.py` | Health endpoint test |
| `frontend/Dockerfile` | node:22-alpine image, dev server on port 5173 |
| `frontend/package.json` | Vite + React + TS + react-router-dom + vitest |
| `frontend/src/main.tsx` | App entry point, BrowserRouter + App |
| `frontend/src/App.tsx` | Routes shell with single `/` placeholder |
| `README.md` | Setup instructions: clone → `make up` → open browser |

## Key decisions

- Backend image: `python:3.14-slim`, deps installed via `uv pip`
- Frontend image: `node:22-alpine`, dev server on port 5173
- Postgres: `postgres:16`, data volume persisted
- Hot-reload: backend via `uvicorn --reload`, frontend via Vite HMR
- All env vars read exclusively through `backend/app/config.py`
- Dev dependencies (`pytest`, `ruff`, `mypy`) in `[project.optional-dependencies] dev`, not in prod deps
- Port mapping uses `MINI_HELP_DESK_PORT_PREFIX` env var (e.g. prefix `1` → ports `18000`, `15173`, `15432`)
- `Makefile` has a `check-env` guard that validates all required vars before `make up`
- `alembic/versions/001_init.py` empty initial migration required — entrypoint calls `alembic upgrade head` on start

## Environment variables

| Variable | Description |
|---|---|
| `MINI_HELP_DESK_PORT_PREFIX` | Port prefix (e.g. `1` → ports 1xxxx) |
| `MINI_HELP_DESK_DB_NAME` | Postgres database name |
| `MINI_HELP_DESK_DB_USER` | Postgres user |
| `MINI_HELP_DESK_DB_PASSWORD` | Postgres password |
| `LLM_API_KEY` | API key for LLM service |

## Tests

- `backend/tests/test_health.py` — HTTP GET `/api/health` returns 200 and `{"status": "ok"}`

## Verification

```bash
cp .env.example .env
make up
curl http://localhost:18000/api/health   # → {"status": "ok"}
# open http://localhost:15173            # React app loads
docker compose exec backend pytest tests/test_health.py
```
