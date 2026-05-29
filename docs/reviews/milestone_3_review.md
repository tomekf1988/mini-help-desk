# Milestone 3 Review — Core CRUD API

Reviewed by: Claude (reviewer subagent)
Date: 2026-05-29

---

## 1. Summary

The milestone delivers a clean, straightforward CRUD API for tickets. The overall structure is
correct: repository handles DB access, service handles business logic, router handles HTTP
translation. Architecture conventions from CLAUDE.md are respected — `NotFoundError` stays out
of the service layer's imports from FastAPI, datetimes are naive UTC, enum values are correct.

There are two real bugs (one data corruption risk, one silent misconfiguration), one design
inconsistency that will cause confusion in later milestones, and several minor issues worth
addressing. No overengineering found — the code is appropriately minimal.

---

## 2. Critical Issues

### 2.1 `update_ticket` silently drops intentional nulls
**File:** `backend/app/repository.py`, line 30

```python
updates = {k: v for k, v in data.model_dump().items() if v is not None}
```

This filters out any field explicitly set to `None` by the caller, which means a client can
never clear `estimated_minutes`, `due_date`, or `description` back to `None` via PATCH. The
correct approach is to filter by whether the field was set at all, not by its value:

```python
updates = data.model_dump(exclude_unset=True)
```

`exclude_unset=True` skips fields the caller did not send. Fields explicitly sent as `null` are
preserved and written. The current implementation makes it impossible to un-set nullable fields,
which is a correctness bug that will surface as a real user complaint.

### 2.2 `test_database_url` silently falls back to the production DB
**File:** `backend/app/config.py`, line 6  
**File:** `backend/tests/test_tickets_api.py`, line 16

`Settings` defines `test_database_url: str = ""` — empty string as default. The test file then
does `settings.test_database_url or settings.database_url`. If `TEST_DATABASE_URL` is not set
in the environment (e.g., running tests outside Docker), the test suite silently runs against
the production database and drops/recreates tables there (`DROP TABLE IF EXISTS tickets CASCADE`
at line 41–44). This is destructive with no warning.

Fix: either remove the default so `pydantic-settings` raises on missing config, or add a guard
in the test fixture that aborts if the resolved URL equals `database_url`.

---

## 3. Suggested Improvements

### 3.1 Service layer duplicates the `get_ticket` lookup for update and delete
**File:** `backend/app/service.py`, lines 32–36 and 39–43

`update_ticket` and `delete_ticket` both call `repo_get` to check existence, then pass the
ticket to the repository function. This means `service.get_ticket` (lines 17–21) exists as a
standalone function but the other service functions re-implement the same fetch-and-raise
pattern inline instead of reusing it. Either call `get_ticket(db, ticket_id)` internally (DRY),
or accept it as-is and add a comment explaining the pattern. Right now it just looks like the
author forgot about the helper they already wrote.

### 3.2 `_utcnow` is a private implementation detail leaking into the repository
**File:** `backend/app/repository.py`, line 6

`repository.py` imports `_utcnow` from `app.models`. A function prefixed with `_` signals it
is module-private. The timestamp helper belongs in a shared `utils.py` or should be exported
without the underscore. This is minor, but the current leakage will confuse future contributors.

### 3.3 `TicketUpdate` cannot update `title`
**File:** `backend/app/schemas.py`, lines 18–23

`TicketUpdate` omits `title`. Whether this is intentional business logic (title is immutable
after creation) is not documented anywhere. If it is intentional, add a comment. If it is an
oversight, add `title: str | None = None` to the schema.

### 3.4 `conftest.py` client fixture is unused by milestone 3 tests
**File:** `backend/tests/conftest.py`

The `client` fixture in `conftest.py` returns a plain `TestClient` with no DB override, so it
would hit a real database. Milestone 3 tests define their own `api_client` fixture with the
correct transaction-scoped override and never use `client`. The conftest fixture is misleading
— it should either be removed or updated to use the same override pattern so it can be reused.

### 3.5 `db_engine` fixture drops tables with raw SQL instead of using SQLAlchemy metadata
**File:** `backend/tests/test_tickets_api.py`, lines 41–44

```python
conn.execute(text("DROP TABLE IF EXISTS tickets CASCADE"))
conn.execute(text("DROP TYPE IF EXISTS ticketstatus CASCADE"))
conn.execute(text("DROP TYPE IF EXISTS ticketpriority CASCADE"))
```

Hard-coded table and type names create a maintenance burden — if the model or enum names
change, the test setup silently fails to clean up. `Base.metadata.drop_all(engine)` followed by
`Base.metadata.create_all(engine)` achieves the same result without the magic strings. The
existing `Base.metadata.drop_all(engine)` at the end of the fixture (line 48) shows this
pattern is already known.

### 3.6 `get_db` does not rollback on exception
**File:** `backend/app/database.py`, lines 13–18

The dependency yields the session but only calls `db.close()` in the `finally` block. If a
request handler raises an unhandled exception after a partial write, the session may have
unflushed state. The standard FastAPI pattern includes a `try/except` with `db.rollback()`:

```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
```

For this project's current usage (each repository function calls `db.commit()` explicitly),
the risk is low, but it is worth fixing before SSE streaming is added in the next milestone.

---

## 4. Final Verdict

**Approve with fixes required before merge.**

The two critical issues must be addressed:

1. `exclude_unset=True` in `update_ticket` — this is a data correctness bug.
2. The silent production-DB fallback in test config — this is a data safety issue.

The remaining items are clean-up that can land in this PR or be deferred to milestone 4, but
items 3.1 (DRY up service layer) and 3.5 (remove hard-coded SQL DDL) are worthwhile to address
now while the surface area is small.

The overall code quality is good: simple, readable, no unnecessary abstractions, correct layering.
