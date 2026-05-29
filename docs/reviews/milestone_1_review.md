# Milestone 1 Review — Infrastructure & Skeleton

**Goal:** One-command startup with all services running and health-checked.

---

## Summary

The infrastructure skeleton is clean and mostly correct. The docker-compose setup, port-prefix pattern, Makefile, and backend skeleton all follow the architecture constraints. There are a few issues that need attention before the milestone can be called complete, most notably a broken `alembic upgrade head` on startup (no initial migration exists yet), a missing `--reload` volume mount for hot-reload to actually work, and dev/test dependencies bundled with production deps. Nothing here is architectural — all issues are contained and fixable.

---

## Critical Issues

### 1. `alembic upgrade head` runs at startup with no migration files

`entrypoint.sh` runs `alembic upgrade head` before starting uvicorn. The `alembic/versions/` directory is either absent or empty — there is no initial migration. This will cause the backend container to exit immediately on first `make up`.

Either add an initial (empty) migration file or guard the entrypoint to only run migrations when migration files exist. For a skeleton milestone, creating an initial migration (`alembic revision --autogenerate -m "init"`) is the right fix.

**File:** `backend/entrypoint.sh`, `backend/alembic/` (missing `versions/` directory)

---

### 2. Hot-reload does not work for the backend

`entrypoint.sh` starts uvicorn with `--reload`, but `docker-compose.yml` only mounts `./backend/app` and `./backend/tests`. Uvicorn's reloader watches the working directory `/app` inside the container — because the source is volume-mounted into a subdirectory, this works. However `alembic/` and `alembic.ini` are baked into the image, not mounted. This is acceptable for alembic. The actual issue: if a developer edits `app/config.py` or `app/database.py`, the reload will trigger correctly because `./backend/app:/app/app` is mounted. This is fine.

**Retract:** On closer inspection the mount covers the right path. No issue here — marking as resolved.

---

### 3. Dev and test tools shipped in the production image

`pyproject.toml` lists `pytest`, `pytest-asyncio`, `ruff`, and `mypy` as regular `dependencies`, not in a separate `[dependency-groups]` or optional extras section. They are installed into the production image, adding unnecessary size and coupling.

For a dev-only milestone this is borderline acceptable, but it should be fixed before the project grows. Split into:

```toml
[dependency-groups]
dev = ["pytest>=8.0", "pytest-asyncio>=0.23", "ruff>=0.4", "mypy>=1.10"]
```

Then install prod deps with `uv pip install -r pyproject.toml` and dev deps with `uv pip install --group dev` (or via a separate `requirements-dev.txt`). This avoids shipping test runners into production and keeps the image lean.

**File:** `backend/pyproject.toml`

---

### 4. `config.py` silently accepts a missing `DATABASE_URL` at import time

`settings = Settings()` is a module-level call. If `DATABASE_URL` is not set (e.g., running tests locally outside Docker, or misconfigured env), this raises a `ValidationError` at import time with an unhelpful traceback rather than a clear startup error. This is a pydantic-settings default behaviour and acceptable for now, but `database_url` has no default — the error message from pydantic is actually readable. This is a **minor** concern, not blocking.

---

## Suggested Improvements

### A. `VITE_API_URL` uses `localhost` — breaks inside Docker networking

In `docker-compose.yml`:
```yaml
VITE_API_URL: http://localhost:${MINI_HELP_DESK_PORT_PREFIX}8000
```

This env var is embedded at Vite build time (or injected at runtime via `import.meta.env`). For the dev server case it is accessed by the *browser*, so `localhost` is correct — the browser reaches the host machine. This is fine as-is. No change needed.

---

### B. `seed_if_empty` is a no-op stub

`backend/app/seed.py` defines `seed_if_empty` as `pass`. The `make seed` target calls it. This is intentional for a skeleton milestone — no models exist yet. However it should be noted that `make seed` will silently succeed without inserting anything. Add a `print("No models yet — seed skipped.")` or a comment so future developers know this is intentional.

**File:** `backend/app/seed.py`

---

### C. `conftest.py` fixture is not scoped

The `client` fixture in `conftest.py` has no explicit scope (defaults to `function`). For a `TestClient` wrapping a simple FastAPI app with no database dependency, this is fine. But once `get_db` is wired in, every test will spin up a new engine connection. Consider `scope="module"` when DB fixtures are added.

---

### D. `test_database_url` defaults to empty string

In `config.py`, `test_database_url: str = ""` means it is silently unset. When tests run inside Docker the env var is present (set in `docker-compose.yml`). But an empty string would pass validation and silently fail later if used. A `None` default with `Optional[str]` is more honest:

```python
test_database_url: str | None = None
```

**File:** `backend/app/config.py`

---

### E. `llm_api_key` defaults to empty string

Same pattern as above — `llm_api_key: str = ""`. An empty string will not be caught until the LLM call fails at runtime. A `None` default with a validator or explicit runtime check is clearer. Minor for now, but worth fixing before the LLM integration milestone.

---

### F. Frontend `docker-compose.yml` has no `depends_on` for backend

The frontend container starts immediately. In practice the browser does the API calls, so this is a non-issue at runtime. But during development a developer doing `make up` and immediately opening the browser could get failed API calls if backend is still migrating. Low priority — not blocking.

---

### G. `make up` does not start in detached mode

`make up` runs `docker compose up --build` (foreground). A `make up` that blocks the terminal is expected for development, but the README does not mention Ctrl+C to stop. Consider adding `make upd` as an alias for `docker compose up --build -d` so developers have a detached option. Optional.

---

### H. `alembic.ini` still has the placeholder URL

`alembic.ini` line 5: `sqlalchemy.url = driver://user:pass@localhost/dbname`. The `env.py` correctly overrides this at runtime via `config.set_main_option(...)`, so this placeholder is never used. It is not a bug, but it is confusing. A comment explaining the override would help.

**File:** `backend/alembic.ini`

---

## Architecture Constraints — Checklist

| Constraint | Status |
|---|---|
| Backend image: `python:3.14-slim` | PASS |
| Deps via `uv pip` | PASS |
| Frontend image: `node:22-alpine` | PASS |
| Dev server on port 5173 | PASS |
| Postgres: `postgres:16` | PASS |
| Hot-reload: `uvicorn --reload` + Vite HMR | PASS (uvicorn --reload present; Vite `host: true` correct) |
| All env vars only in `config.py` | PASS |
| Service layer never imports `HTTPException` | PASS (no service layer yet) |
| `MINI_HELP_DESK_PORT_PREFIX` env var pattern | PASS |
| Makefile uses real tab characters | PASS (verified) |
| No `Co-Authored-By` in commits | PASS (not a code artifact; enforce at commit time) |

---

## Final Verdict

**Needs fixes.**

One blocking issue: the backend will crash on `make up` because `alembic upgrade head` is called with no migration files. This must be resolved before the milestone can be considered done. All other findings are minor and can be addressed in this milestone or carried forward.

Fix required:
- Create an initial Alembic migration (`alembic revision --autogenerate -m "init"` or an empty `alembic revision -m "init"`) so the entrypoint does not fail.

Recommended (same milestone):
- Split dev/test deps out of `[dependencies]` in `pyproject.toml`.
- Change `test_database_url` and `llm_api_key` defaults from `""` to `None`.
