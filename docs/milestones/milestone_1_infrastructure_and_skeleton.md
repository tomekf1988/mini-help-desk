# Milestone 1 — Infrastructure & Skeleton

## Goal

One-command startup with all services running and health-checked.

## Deliverables

| File | Description |
|---|---|
| `docker-compose.yml` | Services: `postgres`, `backend`, `frontend` |
| `Makefile` | Targets: `up`, `down`, `logs`, `build` |
| `.env.example` | Template for all required env vars |
| `backend/pyproject.toml` | uv project, all deps declared |
| `backend/app/main.py` | FastAPI app, `GET /api/health` → `{"status": "ok"}` |
| `backend/app/config.py` | Single place for all env var reads |
| `frontend/package.json` | Vite + React + TS + react-router-dom + vitest |
| `frontend/src/main.tsx` | App entry point, router shell |
| `README.md` | Setup instructions: clone → `make up` → open browser |

## Key decisions

- Backend image: `python:3.14-slim`, deps installed via `uv pip`
- Frontend image: `node:22-alpine`, dev server on port 5173
- Postgres: `postgres:16`, data volume persisted
- Hot-reload: backend via `uvicorn --reload`, frontend via Vite HMR
- All env vars read exclusively through `backend/app/config.py`

## Tests

- `backend/tests/test_health.py` — HTTP GET `/api/health` returns 200

## Agent delegation

- `python-dev`: backend scaffold, Dockerfile, docker-compose, Makefile, config.py, health endpoint, test
- `react-dev`: frontend scaffold, Vite config, router shell, Dockerfile

## Verification

```bash
make up
curl http://localhost:8000/api/health   # → {"status": "ok"}
# open http://localhost:5173            # React app loads
docker compose exec backend pytest tests/test_health.py
```