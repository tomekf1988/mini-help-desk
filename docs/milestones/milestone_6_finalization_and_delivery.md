# Milestone 6 — Finalization & Delivery

## Goal

Polished, deliverable application — one-command start, seeded, documented, all checks green.

## Deliverables

| File | Description |
|---|---|
| `backend/app/seed.py` | `seed_if_empty(db)` + `__main__` block for standalone invocation |
| `backend/scripts/seed.py` | Thin wrapper delegating to `app.seed` |
| `backend/tests/conftest.py` | Shared SQLite in-memory fixtures: `db_engine`, `db_session`, `client`, `api_client` |
| `backend/tests/test_tickets_api.py` | Removed postgres-specific fixtures; uses conftest |
| `backend/tests/test_summary_stream.py` | Removed postgres-specific fixtures; local `api_client` stubs LLM |
| `backend/app/config.py` | Removed `test_database_url`; added `type: ignore[call-arg]` |
| `backend/app/main.py` | Explicit if/else for `AsyncOpenAI` init (fixes mypy `**kwargs` error) |
| `docker-compose.yml` | `MINI_HELP_DESK_DB_HOST` in `DATABASE_URL`; `LLM_BASE_URL`/`LLM_MODEL` passed to backend; `TEST_DATABASE_URL` removed |
| `.env.example` | All vars documented: `MINI_HELP_DESK_DB_HOST`, `LLM_BASE_URL`, `LLM_MODEL` |
| `Makefile` | `seed` uses `python -m app.seed`; `check-env` unchanged (DB_HOST optional, has default) |
| `README.md` | Full rewrite: prerequisites, env vars table, commands, test instructions |

## Key decisions

- **SQLite in-memory for tests**: All backend tests now use SQLite in-memory via shared conftest fixtures. No postgres required to run tests. LLM calls are mocked. SQLAlchemy's `Enum` falls back to VARCHAR on SQLite — `Base.metadata.create_all()` handles this automatically.
- **`MINI_HELP_DESK_DB_HOST`**: Env var for configurable postgres hostname. Defaults to `db` (Docker internal). Passed through `docker-compose.yml` as `${MINI_HELP_DESK_DB_HOST:-db}`.
- **`LLM_BASE_URL` / `LLM_MODEL`**: Both now passed via `docker-compose.yml` environment block (were missing in M5).
- **`make seed`**: Uses `python -m app.seed` which runs the `__main__` block in `app/seed.py`. No `SessionLocal` export needed from `database.py`.
- **mypy clean**: Fixed `**kwargs` dict unpacking issue in `main.py` by using explicit `if/else` branches for `AsyncOpenAI` initialization.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `MINI_HELP_DESK_PORT_PREFIX` | `3` | Prefix for all service ports |
| `MINI_HELP_DESK_DB_NAME` | `helpdesk` | Postgres database name |
| `MINI_HELP_DESK_DB_USER` | `helpdesk` | Postgres user |
| `MINI_HELP_DESK_DB_PASSWORD` | `helpdesk` | Postgres password |
| `MINI_HELP_DESK_DB_HOST` | `db` | Postgres hostname (optional, defaults to Docker-internal `db`) |
| `LLM_API_KEY` | — | API key for LLM (**required**) |
| `LLM_BASE_URL` | *(OpenAI default)* | Custom base URL for OpenAI-compatible endpoints |
| `LLM_MODEL` | `gpt-4.1-mini` | Model name for ticket summaries |

## Final review checklist

- [x] No `HTTPException` imports in service layer
- [x] All env vars go through `config.py`
- [x] SSE endpoint: `GET /api/tickets/{id}/summary/stream`
- [x] `useStreamingSummary` guards on `esRef.current`
- [x] Inline styles only in frontend (keyframes in CSS — correct, can't use inline)
- [x] No LangChain; SQLite in-memory = real DB (not mocked)
- [x] `ruff check` — clean
- [x] `mypy` — no issues
- [x] `pytest` — 20/20 green
- [x] `npm test` — 12/12 green
- [x] `npm run build` — clean (181 kB bundle)
- [x] `make seed` — works

## Verification

```bash
cp .env.example .env
# edit .env — set LLM_API_KEY
make up
make seed
curl http://localhost:38000/api/health        # → {"status": "ok"}
# open http://localhost:35173                 # list shows seeded tickets
docker compose exec backend pytest -v        # 20 passed
docker compose exec backend ruff check app tests
docker compose exec backend mypy app
docker compose exec frontend npm test -- --run
docker compose exec frontend npm run build
```
