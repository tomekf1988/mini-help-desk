# Milestone 5 Review — LLM Integration and SSE Streaming

## Summary

Milestone 5 adds LLM-powered ticket summaries delivered over SSE. The overall
architecture is clean and follows project conventions well. The backend router,
LLM module, and streaming hook are all short and readable. There are a few real
issues — one broken UI animation, one unhandled in-band error sentinel on the
frontend, one double database lookup in the router, and one missing LLM error
handler on the backend — but none are architectural failures. The test suite is
solid.

---

## Critical Issues

### 1. `blink` CSS keyframe is undefined — cursor animation silently does nothing

`SummaryPanel.tsx` uses `animation: 'blink 1s step-end infinite'` for the
streaming cursor, but `@keyframes blink` is never defined anywhere. Only
`@keyframes spin` exists in `frontend/src/index.css`. The cursor element
renders but is static, making the "still streaming" signal invisible to the
user.

Fix: add `@keyframes blink { 50% { opacity: 0; } }` to
`frontend/src/index.css`.

### 2. `[NOT_FOUND]` in-band sentinel is never handled by the frontend

`backend/app/routers/summary.py` has a dead code path in `_event_generator`:
if the pre-flight 404 check passes but the ticket disappears between the two
lookups, the generator yields `data: [NOT_FOUND]\n\n`. The frontend's
`onmessage` handler has no branch for this sentinel — it would be appended
directly to the displayed summary text as the literal string `[NOT_FOUND]`.

Either:
- Remove `_event_generator`'s own `NotFoundError` catch entirely (the
  pre-flight guard makes it unreachable in practice), or
- Handle `[NOT_FOUND]` in `useStreamingSummary`'s `onmessage` the same way
  `[DONE]` is handled.

The current state is a silent user-facing corruption of the summary text in a
race that is unlikely but possible.

### 3. LLM errors during streaming are not caught — the SSE stream silently drops

`backend/app/llm.py` `stream_summary` performs no exception handling. If the
OpenAI call fails (bad key, network error, rate limit), the exception propagates
up through `_event_generator` after headers have already been sent. FastAPI
cannot convert it to an HTTP error at that point. The browser `EventSource`
fires `onerror` and the user sees the generic error message, but the backend
logs an unhandled exception on every LLM failure.

Wrapping the `async for` block in `try/except Exception` inside
`_event_generator` and yielding `data: [ERROR]\n\n` before closing would make
the failure explicit on both sides.

---

## Suggested Improvements

### 4. Double DB lookup in the router

`stream_ticket_summary` calls `service.get_ticket` to validate, then
`_event_generator` calls it again. The validated ticket is discarded. This is
two round-trips for every request. The ticket object could be passed directly
into `_event_generator` instead of re-fetching by ID.

```python
# current: two lookups
ticket = service.get_ticket(db, ticket_id)   # result thrown away
return StreamingResponse(_event_generator(ticket_id, db), ...)

# fix: pass ticket directly
return StreamingResponse(_event_generator(ticket, db), ...)
```

### 5. `_build_client()` constructs a new `AsyncOpenAI` on every request

Each call to `stream_summary` creates a fresh client with a fresh HTTPX
connection pool. For a low-traffic internal tool this is fine, but a
module-level singleton (lazily constructed once) would be the pragmatic
improvement if request volume grows.

### 6. `llm_api_key` defaults to empty string — no startup validation

`config.py` allows `llm_api_key = ""`. An empty key causes a confusing
`AuthenticationError` from the OpenAI SDK at streaming time rather than a clear
startup failure. A `@model_validator` or a simple warning log when the key is
empty would improve the developer experience when the env var is forgotten.

### 7. `stop()` is exposed in the hook return but never used by `SummaryPanel`

`useStreamingSummary` returns `stop` but `SummaryPanel` does not use it. There
is no "Cancel" button. Either wire up a cancel button or drop `stop` from the
public interface if no caller uses it.

### 8. Missing test: LLM error mid-stream (backend)

`backend/tests/test_summary_stream.py` tests the happy path, 404, and headers.
There is no test for an LLM exception thrown mid-stream. Given that this is the
only failure mode that reaches users as a silent hang-then-error (issue 3), a
test that patches `llm.stream_summary` to raise and asserts the stream closes
cleanly would be valuable.

---

## Final Verdict

**Pass with minor fixes required.**

The streaming pipeline is correctly implemented end to end: no buffering, proper
SSE format, correct guard on `esRef.current`, proper cleanup on unmount. The
conventions from CLAUDE.md are followed — no LangChain, `NotFoundError` in the
service layer, `config.py` as the single env var source, `[DONE]` terminator.

The two issues that need addressing before this is production-ready are the
missing `blink` keyframe (broken UI feedback) and the unhandled `[NOT_FOUND]`
sentinel (text corruption). The LLM error handling gap (issue 3) is worth
fixing for operational robustness. The double DB lookup (issue 4) is a
clean-up item.
