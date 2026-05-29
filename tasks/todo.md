# TODO

## Milestone 5 — LLM Integration and Streaming

### Backend
- [x] config.py — add llm_model, llm_base_url fields (llm_api_key already exists)
- [x] backend/app/llm.py — stream_summary(ticket) using openai async streaming, yields tokens
- [x] backend/app/routers/summary.py — GET /api/tickets/{id}/summary/stream SSE endpoint
- [x] backend/app/main.py — include summary router
- [x] backend/tests/test_summary_stream.py — mock LLM, verify SSE event sequence

### Frontend
- [x] frontend/src/hooks/useStreamingSummary.ts — DONE
- [x] frontend/src/components/SummaryPanel.tsx — DONE
- [x] frontend/src/pages/TicketDetailPage.tsx — DONE
- [x] frontend/src/hooks/useStreamingSummary.test.ts — DONE

## Milestone 6 — Finalization and Delivery

- [ ] seed data script
- [ ] README setup instructions
- [ ] docker compose one-command startup verified
- [ ] final review and cleanup
