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
