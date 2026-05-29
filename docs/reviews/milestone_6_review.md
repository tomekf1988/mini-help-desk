# Milestone 6 Review

## Critical Issues Found and Fixed

### 1. `make seed` would fail with `ImportError`
`SessionLocal` was not exported from `app.database` — the Makefile seed command tried to import it.

**Fix**: Added `__main__` block to `app/seed.py` that creates its own engine and session. Updated Makefile to `python -m app.seed`. Updated `scripts/seed.py` to delegate to `app.seed` instead of duplicating logic.

### 2. `scripts/seed.py` duplicated seed data and had broken import
Duplicated `_SAMPLE_TICKETS` list and imported the non-existent `SessionLocal`.

**Fix**: Replaced `scripts/seed.py` with a thin wrapper that delegates to `app.seed` via `runpy.run_module`.

## Suggested Improvements (noted, addressed where applicable)

### 3. SQLAlchemy 2.x test isolation (`bind=` deprecated)
`sessionmaker(bind=connection)` is deprecated in SA 2.x. `join_transaction_mode="create_savepoint"` is the correct pattern. Tests currently pass without it because SA 2.x still supports the deprecated path. **Left as-is** — tests pass and the fix is non-trivial without SA 2.x explicit Session API changes.

### 4. `api_client` in conftest doesn't stub `get_llm_client`
If summary stream endpoint were hit via the conftest `api_client`, it would try a real LLM call. `test_summary_stream.py` correctly defines its own `api_client` with the stub. This is safe by test organization — no action taken.

### 5. `check-env` required `MINI_HELP_DESK_DB_HOST` but `docker-compose.yml` has `:-db` fallback
**Fixed**: Removed `MINI_HELP_DESK_DB_HOST` from `check-env` required list since it has a documented default.

### 6. `TicketUpdate` cannot update `title`
Intentional — frontend renders title as read-only. No action.

### 7. `index.css` contains keyframe animations
`@keyframes spin` and `blink` must be in a stylesheet (inline styles can't define keyframes). This is correct — the "inline styles only" convention applies to component layout and appearance; keyframe animations require a stylesheet.

## Final Checklist

- [x] No `HTTPException` in service layer
- [x] All env vars through `config.py`
- [x] SSE endpoint `GET /api/tickets/{id}/summary/stream`
- [x] `useStreamingSummary` guards on `esRef.current`
- [x] Inline styles in frontend (keyframes in CSS — correct)
- [x] No LangChain
- [x] LLM calls mocked in tests
- [x] SQLite in-memory for tests — no external DB dependency
- [x] `ruff check` — clean
- [x] `mypy` — no issues
- [x] `pytest` — 20/20 passed
- [x] `npm test` — 12/12 passed
- [x] `npm run build` — clean
- [x] `make seed` — works

## Verdict: Ship
