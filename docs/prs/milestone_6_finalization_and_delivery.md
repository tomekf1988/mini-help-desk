# PR: feat: milestone 6 — finalization and delivery

**PR:** https://github.com/tomekf1988/mini-help-desk/pull/6
**Branch:** feature/milestone_6_finalization_and_delivery → main

## Summary

Finalizes the mini help-desk application for delivery: one-command startup, seeded sample data, all checks green. Includes a complete rewrite of the SSE streaming frontend (EventSource → fetch+ReadableStream) to fix Vite proxy buffering, a ChatGPT-style typewriter effect, and a critical bug fix for React StrictMode double-invocation that caused garbled text output.

## Changes

### Backend
- **`app/seed.py`** — new `seed_if_empty(db)` function + `__main__` block; fixes `make seed` which previously crashed on missing `SessionLocal`
- **`scripts/seed.py`** — replaced duplicate logic with thin wrapper delegating to `app.seed`
- **`app/config.py`** — removed unused `test_database_url` field; added `type: ignore[call-arg]` for pydantic-settings
- **`app/main.py`** — explicit `if/else` for `AsyncOpenAI` init (fixes mypy `**kwargs` error); `close()` not `aclose()` (fixes AttributeError on shutdown); `app.*` logger configured with StreamHandler so INFO messages appear in `make logs`
- **`app/service.py`** — SSE stream start/done logged at INFO (visible by default), per-token at DEBUG; accumulated token count and first 120 chars logged on completion
- **`app/llm.py`** — system prompt added; `extra_body` for Qwen3 thinking mode; simplified token filtering

### Frontend
- **`useStreamingSummary.ts`** — replaced `EventSource` with `fetch` + `ReadableStream` + manual SSE parser (`split('\n\n')` / `data:` prefix); fixes Vite proxy buffering that caused entire response to arrive at once
- **Typewriter queue** — tokens enqueued character-by-character into `queueRef`; `setInterval` drains at 20 ms/char; `setIsStreaming(false)` deferred until queue is empty (cursor stays until last char)
- **Critical fix** — `queueRef.current.shift()` moved outside `setSummary` updater; React StrictMode was double-invoking the updater as a side-effect check, consuming every second character and appending `undefined` to the end of the summary
- **`SummaryPanel.tsx`** — container shown immediately on `start()`, blinking cursor visible from first tick (no separate spinner phase)

### Infrastructure
- **`docker-compose.yml`** — `MINI_HELP_DESK_DB_HOST` variable in `DATABASE_URL` (configurable postgres host); `LLM_BASE_URL` and `LLM_MODEL` passed to backend; `TEST_DATABASE_URL` removed
- **`.env.example`** — all vars documented: `MINI_HELP_DESK_DB_HOST`, `LLM_BASE_URL`, `LLM_MODEL`
- **`Makefile`** — `seed` target uses `python -m app.seed`
- **`README.md`** — prerequisites, full env vars table, commands, test instructions

### Tests
- **`conftest.py`** — replaced postgres-dependent fixtures with shared SQLite in-memory: `db_engine`, `db_session`, `client`, `api_client`; no external DB required to run tests
- **`test_tickets_api.py`, `test_models.py`, `test_summary_stream.py`** — removed `_ensure_test_db_exists` and local postgres fixtures; use conftest
- **`useStreamingSummary.test.ts`** — rewritten for fetch-based hook; uses `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` to control drain queue deterministically

## Acceptance criteria

- [x] No `HTTPException` imports in service layer
- [x] All env vars go through `config.py`
- [x] SSE endpoint: `GET /api/tickets/{id}/summary/stream`
- [x] `useStreamingSummary` guards on `abortRef.current`
- [x] Inline styles only in frontend (keyframes in CSS — required, can't be inline)
- [x] No LangChain; SQLite in-memory = real DB (not mocked)
- [x] `ruff check` — clean
- [x] `mypy` — no issues
- [x] `pytest` — 20/20 passed
- [x] `npm test` — 13/13 passed
- [x] `npm run build` — clean (181 kB bundle)
- [x] `make seed` — works

## Technical decisions

- **SQLite in-memory for tests** — avoids postgres `CREATEDB` permission requirement; SQLAlchemy's `Enum` falls back to VARCHAR on SQLite; `Base.metadata.create_all()` generates compatible DDL. Satisfies "no mocked DB" — SQLite is a real database.
- **fetch + ReadableStream instead of EventSource** — Vite's `http-proxy` buffers `text/event-stream` responses before forwarding; `fetch` uses a different proxy code path that streams chunks immediately. Also allows `AbortController` cancellation, unlike `EventSource`.
- **shift() outside setSummary updater** — React 18 StrictMode intentionally double-invokes state updater functions to detect impurity. `queueRef.current.shift()` inside the updater was a side effect: each drain tick consumed two characters but displayed one, producing garbled scrambled text and a trailing `undefined`. Moving `shift()` before `setSummary` makes the updater pure.
- **Deferred isStreaming=false** — `setIsStreaming(false)` happens inside the drain interval once the queue is empty, not when `[DONE]` is received. This keeps the blinking cursor visible until the very last character is displayed.

## Testing

```bash
# Backend
docker compose exec backend pytest tests/ -v     # 20/20 passed
docker compose exec backend ruff check app tests  # clean
docker compose exec backend mypy app              # no issues

# Frontend
docker compose exec frontend npm test -- --run    # 13/13 passed
docker compose exec frontend npm run build        # clean, 181 kB

# Manual
make up && make seed
# open http://localhost:35173
# open any ticket → click "Generate Summary"
# observe: text appears character-by-character (typewriter), cursor blinks until last char
# make logs → SSE stream started / done visible, per-token silent
```

## Remaining work

- No further milestones planned. Application is complete and deliverable.
