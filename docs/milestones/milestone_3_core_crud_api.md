# Milestone 3 — Core CRUD API

## Goal

Full ticket CRUD via REST API, service layer, clean error handling.

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tickets` | List all tickets (optional `?status=` filter) |
| `POST` | `/api/tickets` | Create ticket |
| `GET` | `/api/tickets/{id}` | Get ticket by ID |
| `PATCH` | `/api/tickets/{id}` | Update status / priority / description |
| `DELETE` | `/api/tickets/{id}` | Delete ticket |

## Deliverables

| File | Description |
|---|---|
| `backend/app/schemas.py` | Pydantic `TicketCreate`, `TicketUpdate`, `TicketResponse` |
| `backend/app/repository.py` | DB queries (select, insert, update, delete) |
| `backend/app/service.py` | Business logic; raises `NotFoundError` (never `HTTPException`) |
| `backend/app/errors.py` | `NotFoundError` definition |
| `backend/app/routers/__init__.py` | Empty package init |
| `backend/app/routers/tickets.py` | FastAPI router; maps `NotFoundError` → 404 |
| `backend/app/main.py` | Updated: includes tickets router |
| `backend/tests/test_tickets_api.py` | 11 API tests |

## Key conventions enforced

- Service layer imports nothing from FastAPI
- `config.py` is the only place env vars are read
- Repository returns `None` on not-found; service raises `NotFoundError`
- Router return types are ORM `Ticket` objects — FastAPI serializes via `response_model`
- `updated_at` is explicitly set in `update_ticket` repository function (ORM `onupdate` does not fire on attribute-level setattr)

## Implementation decisions

- `TicketUpdate` uses `None` sentinel for "not provided" — all fields optional, only non-None fields are applied in the repository
- Test isolation: each test runs inside a rolled-back transaction using `db.dependency_overrides[get_db]` to inject the test session into the FastAPI app
- Test DB setup follows the same session-scoped engine + per-test rollback pattern established in milestone 2's `test_models.py`
- mypy error in `config.py:10` (`settings = Settings()`) is pre-existing from milestone 2 — pydantic-settings resolves env vars at runtime, not at type-check time; no new mypy errors introduced in this milestone

## Tests

- `backend/tests/test_tickets_api.py` — 11 tests:
  - `test_create_ticket` — creates with explicit fields
  - `test_create_ticket_defaults` — verifies default status/priority/nullable fields
  - `test_get_ticket` — fetches by ID
  - `test_get_ticket_not_found` — 404 on missing UUID
  - `test_list_tickets` — returns multiple tickets
  - `test_list_tickets_filter_by_status` — `?status=open` excludes other statuses
  - `test_update_ticket` — PATCH changes status and priority
  - `test_update_ticket_not_found` — 404 on missing UUID
  - `test_delete_ticket` — 204 then 404 on re-fetch
  - `test_delete_ticket_not_found` — 404 on missing UUID
  - `test_full_crud_cycle` — create → get → update (twice) → delete → 404

## Verification

```bash
docker compose exec backend pytest tests/test_tickets_api.py -v
# 11 passed

docker compose exec backend pytest tests/ -v
# 17 passed (6 pre-existing + 11 new)

docker compose exec backend ruff check app tests
# All checks passed!

docker compose exec backend mypy app
# 1 pre-existing error in config.py (pydantic-settings runtime env var)
# 0 new errors introduced by milestone 3
```

## Startup

`make down && docker compose up --build -d` — no ERROR or FATAL lines in logs.
