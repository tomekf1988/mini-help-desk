# PR: feat: milestone 5 — llm integration and streaming

https://github.com/tomekf1988/mini-help-desk/pull/5

## Summary

Implements token-by-token LLM summary streaming from backend to frontend via Server-Sent Events. Clicking "Generate Summary" on the ticket detail page opens an EventSource stream and renders each token as it arrives. Backend and frontend are both production-ready: DB engine and LLM client are lifecycle-managed via FastAPI lifespan, streaming logic lives in the service layer, and the router stays thin.

## Changes

### Backend
- `backend/app/llm.py` — new: `stream_summary(client, ticket)` async generator using `openai.AsyncOpenAI`; skips `None` delta chunks; no buffering
- `backend/app/routers/summary.py` — new: `GET /api/tickets/{id}/summary/stream`; upfront 404 check before headers are sent; `get_llm_client` dependency reads from `app.state`
- `backend/app/service.py` — added `stream_summary_events(client, ticket)` async generator: formats SSE events, yields `[DONE]` on completion, `[ERROR]` + logs on exception
- `backend/app/main.py` — added `lifespan` context manager: creates DB engine + session factory + `AsyncOpenAI` client at startup, disposes both at shutdown
- `backend/app/database.py` — removed module-level `engine`/`SessionLocal`; `get_db` now reads `session_factory` from `request.app.state`
- `backend/app/config.py` — added `llm_model` (default `gpt-4.1-mini`) and `llm_base_url` (default `""`)
- `backend/tests/test_summary_stream.py` — 3 tests: SSE event sequence, 404 for missing ticket, cache-control headers

### Frontend
- `frontend/src/hooks/useStreamingSummary.ts` — new: `EventSource` hook; guards `start()` on `esRef.current` (not stale `isStreaming`); handles `[DONE]` and `[ERROR]` sentinels; cleans up on unmount
- `frontend/src/components/SummaryPanel.tsx` — new: "Generate Summary" button, streaming text with blinking cursor, spinner while waiting for first token, error display
- `frontend/src/pages/TicketDetailPage.tsx` — replaced disabled AI Summary placeholder with `<SummaryPanel ticketId={ticket.id} />`
- `frontend/src/index.css` — added `@keyframes blink` for streaming cursor animation
- `frontend/src/hooks/useStreamingSummary.test.ts` — 8 tests: URL construction, start, token accumulation, `[DONE]`, error, double-start guard, reset on re-start

### Infrastructure
- No Docker/Makefile changes; env vars `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` documented in `.env.example`

## Acceptance criteria

- [x] `GET /api/tickets/{id}/summary/stream` SSE endpoint
- [x] Token-by-token streaming — no buffering
- [x] SSE format: `data: <token>\n\n` per event, `data: [DONE]\n\n` at end
- [x] 404 returned as proper HTTP response before stream opens
- [x] `useStreamingSummary` guards start on `esRef.current`
- [x] `SummaryPanel` renders tokens live with blinking cursor
- [x] LLM errors caught, logged, surfaced as `[ERROR]` sentinel to client
- [x] 20/20 backend tests pass, 12/12 frontend tests pass

## Technical decisions

- **Lifespan for DB + LLM client**: both are long-lived resources with connection pools; lifespan gives proper startup/shutdown instead of module-level globals
- **`stream_summary_events` in service, not router**: keeps the router to validation + `StreamingResponse`; service owns all streaming logic including error handling
- **Upfront 404 check**: `StreamingResponse` flushes headers immediately — once that happens the status code cannot change; pre-flight `service.get_ticket` returns a real 404 before headers are sent
- **`base_url` conditional**: passing `base_url=""` to `AsyncOpenAI` raises an SDK validation error; only set when non-empty
- **`[ERROR]` sentinel**: LLM exceptions after headers are sent cannot become HTTP errors; yielding `[ERROR]` lets the frontend show a user-facing message while the backend logs the full exception

## Testing

```bash
docker compose exec backend pytest -v          # 20/20 passed
docker compose exec frontend npm test -- --run  # 12/12 passed
# manual: open ticket detail → click Generate Summary → tokens stream in
```

## Remaining work

- Milestone 6: seed data script, README setup instructions, final review and delivery
