# PR: milestone 3 — core CRUD API

**PR:** #3  
**Title:** feat: milestone 3 — core CRUD API  
**Merged:** 2026-05-29  
**Changes:** +628 / -6 across 12 files

## Summary

- Full ticket CRUD REST API: `GET/POST /api/tickets`, `GET/PATCH/DELETE /api/tickets/{id}`
- Service layer with clean separation — no FastAPI imports, raises `NotFoundError` instead of `HTTPException`
- Repository layer using SQLAlchemy 2.x; router maps `NotFoundError` → 404
- 11 API tests covering full CRUD cycle, 404s, and status filter (17/17 total pass)

## Review fixes applied

- `PATCH` now correctly clears nullable fields (`estimated_minutes`, `due_date`, `description`) via `model_dump(exclude_unset=True)`
- Test suite guards against falling back to production DB when `TEST_DATABASE_URL` is not set

## Test plan

- [x] `docker compose exec backend pytest tests/ -v` — 17 passed
- [x] `docker compose exec backend ruff check app tests` — clean
- [x] `docker compose exec backend mypy app` — 0 new errors
- [x] `make down && docker compose up --build -d` — no ERROR/FATAL in logs
