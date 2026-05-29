# Milestone 5 — LLM Integration & Streaming

## Goal

Token-by-token LLM summary streamed from backend to frontend via SSE.

## Backend

| File | Description |
|---|---|
| `backend/app/config.py` | Add `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` |
| `backend/app/llm.py` | `stream_summary(ticket)` — openai async streaming, yields tokens |
| `backend/app/routers/summary.py` | `GET /api/tickets/{id}/summary/stream` — SSE endpoint |

### SSE event format

```
data: <token>\n\n
data: [DONE]\n\n
```

## Frontend

| File | Description |
|---|---|
| `frontend/src/hooks/useStreamingSummary.ts` | Opens `EventSource`, accumulates tokens; guards start on `esRef.current` |
| `frontend/src/components/SummaryPanel.tsx` | "Generate Summary" button + streaming text display |
| `frontend/src/pages/TicketDetailPage.tsx` | Updated: includes `SummaryPanel` |

## Key conventions enforced

- No LangChain — use `openai` SDK directly with async streaming
- Do not buffer the full response; yield each token immediately
- `useStreamingSummary` closes `EventSource` on `[DONE]` or error
- Guard on `esRef.current`, not stale `isStreaming` state

## Tests

- `backend/tests/test_summary_stream.py` — mock LLM, verify SSE event sequence
- `frontend/src/hooks/useStreamingSummary.test.ts` — mock EventSource, verify state transitions

## Agent delegation

- `python-dev`: llm.py, summary router, backend tests
- `react-dev`: useStreamingSummary hook, SummaryPanel, frontend tests

## Verification

```bash
docker compose exec backend pytest tests/test_summary_stream.py
docker compose exec frontend npm test
# open ticket detail in browser
# click "Generate Summary" — text appears token by token
```