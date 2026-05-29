# Milestone 1 — Infrastructure & Skeleton

## Summary

- Docker Compose setup with `db`, `backend`, `frontend` services; one-command startup via `make up`
- Backend: FastAPI skeleton on `python:3.14-slim`, deps managed with `uv`, `GET /api/health` endpoint, Alembic wired up
- Frontend: React + TypeScript + Vite shell on `node:22-alpine`, react-router-dom router scaffold
- Environment config via `MINI_HELP_DESK_PORT_PREFIX` pattern, all env vars read exclusively through `config.py`
- Test: `tests/test_health.py` asserts 200 + `{"status": "ok"}`

## Review findings and fixes applied

- Added `backend/alembic/versions/001_init.py` (empty initial migration) — entrypoint runs `alembic upgrade head` so this was required to avoid container crash on first boot
- Moved `pytest`, `pytest-asyncio`, `ruff`, `mypy` to `[project.optional-dependencies] dev` — Dockerfile installs both production and dev deps

## Verification

```bash
cp .env.example .env
make up
curl http://localhost:18000/api/health   # → {"status": "ok"}
# open http://localhost:15173            # React app loads
docker compose exec backend pytest tests/test_health.py
```
