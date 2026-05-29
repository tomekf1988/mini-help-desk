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
| `backend/app/routers/tickets.py` | FastAPI router; maps `NotFoundError` → 404 |
| `backend/app/main.py` | Updated: includes tickets router |

## Key conventions enforced

- Service layer imports nothing from FastAPI
- `config.py` is the only place env vars are read
- Repository returns `None` on not-found; service raises `NotFoundError`

## Tests

- `backend/tests/test_tickets_api.py` — full CRUD cycle, 404 on missing ID, filter by status

## Agent delegation

- `python-dev`: all of the above

## Verification

```bash
docker compose exec backend pytest tests/test_tickets_api.py
docker compose exec backend ruff check app tests
docker compose exec backend mypy app
```