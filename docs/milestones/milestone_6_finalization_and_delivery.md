# Milestone 6 — Finalization & Delivery

## Goal

Polished, deliverable application — one-command start, seeded, documented, all checks green.

## Deliverables

| File | Description |
|---|---|
| `backend/scripts/seed.py` | Finalized: wired into docker-compose startup |
| `.env.example` | All vars documented with comments |
| `README.md` | Final: prerequisites, `make up`, open `http://localhost:5173`, env vars table |

## Final review checklist

- [ ] No `HTTPException` imports in service layer
- [ ] All env vars go through `config.py`
- [ ] SSE endpoint: `GET /api/tickets/{id}/summary/stream`
- [ ] `useStreamingSummary` guards on `esRef.current`
- [ ] Inline styles only in frontend
- [ ] No LangChain; no mocked DB in integration tests
- [ ] `ruff check` — clean
- [ ] `mypy` — no errors
- [ ] `pytest` — all green
- [ ] `npm test` — all green
- [ ] `npm run build` — build succeeds

## Agent delegation

- `python-dev`: seed wiring, final backend checks
- `react-dev`: final frontend polish, build check
- `reviewer`: full-project review

## End-to-End Verification

```bash
make up
curl http://localhost:8000/api/health          # → {"status": "ok"}
# open http://localhost:5173                   # list shows seeded tickets
# create a ticket                             # appears in list
# open ticket detail, click Generate Summary  # streams token by token
docker compose exec backend pytest            # all green
docker compose exec backend ruff check app tests
docker compose exec backend mypy app
docker compose exec frontend npm test
docker compose exec frontend npm run build
```