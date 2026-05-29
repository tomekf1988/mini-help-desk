# Milestone 5 — LLM Integration & Streaming

## Goal

Token-by-token LLM summary streamed from backend to frontend via SSE.

## What was built

### Backend

| File | Description |
|---|---|
| `backend/app/config.py` | Added `llm_model` (default `"gpt-4.1-mini"`) and `llm_base_url` (default `""`) — env vars `LLM_MODEL`, `LLM_BASE_URL`; `llm_api_key` was already present |
| `backend/app/llm.py` | `stream_summary(ticket)` async generator; `AsyncOpenAI` client with `api_key=settings.llm_api_key`; `base_url` set only when non-empty (passing `""` raises SDK error); skips `None` delta chunks |
| `backend/app/routers/summary.py` | `GET /api/tickets/{id}/summary/stream`; upfront 404 check before opening stream; `StreamingResponse(media_type="text/event-stream")`; headers: `Cache-Control: no-cache`, `X-Accel-Buffering: no` |
| `backend/app/main.py` | Includes summary router |

### SSE event format

```
data: <token>\n\n
data: [DONE]\n\n
```

### Frontend

| File | Description |
|---|---|
| `frontend/src/hooks/useStreamingSummary.ts` | Opens `EventSource`, accumulates tokens; guards start on `esRef.current` (not stale `isStreaming`); closes on `[DONE]` or error |
| `frontend/src/components/SummaryPanel.tsx` | "Generate Summary" button + streaming text with blinking cursor + spinner + error state; inline styles |
| `frontend/src/pages/TicketDetailPage.tsx` | AI Summary placeholder replaced with `<SummaryPanel ticketId={ticket.id} />` |

## Key decisions

- `base_url` only passed to `AsyncOpenAI` when non-empty — passing an empty string raises an SDK validation error
- Router does an upfront `service.get_ticket` call before opening the SSE stream so a missing ticket returns a proper HTTP 404 (once `StreamingResponse` headers are flushed the status code cannot change)
- `SummaryPanel.tsx` requires explicit `import React from 'react'` for `React.CSSProperties` type annotation

## Env vars

| Variable | Default | Description |
|---|---|---|
| `LLM_API_KEY` | (required) | OpenAI-compatible API key |
| `LLM_MODEL` | `gpt-4.1-mini` | Model name |
| `LLM_BASE_URL` | `""` | Custom base URL; empty = use OpenAI default |

## Tests

- `backend/tests/test_summary_stream.py` — 3 tests: SSE events, 404 for missing ticket, cache-control headers
- `frontend/src/hooks/useStreamingSummary.test.ts` — 8 tests: URL, start, token accumulation, `[DONE]`, error, double-start guard, reset

## Test results

```
backend: 20/20 passed
frontend: 12/12 passed
```

## Verification

```bash
docker compose exec backend pytest tests/test_summary_stream.py -v
docker compose exec frontend npm test -- --run
# open ticket detail in browser
# click "Generate Summary" — text appears token by token
```