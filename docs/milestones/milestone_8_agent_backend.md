# Milestone 8 — Agent Backend: Tool Calling & Chat SSE

## Goal

Add an AI chat agent endpoint that can create and search tickets via tool calling,
streamed token-by-token over SSE.

**Updated**: Implementation was initially written with plain OpenAI SDK, then refactored
to use LangChain (`ChatOpenAI`, `bind_tools`, `astream`, `@tool`, `PromptTemplate.from_file()`),
matching the claude-skill-lab reference pattern.

## Deliverables

| File | Action | Description |
|---|---|---|
| `backend/app/events.py` | New | `SSEEvent` dataclass with `.to_sse()` — serializes to `data: {"type":…,"content":…}\n\n` |
| `backend/app/prompts/__init__.py` | New | Empty package marker |
| `backend/app/prompts/assistant.md` | New | Prompt template file with `{today}`, `{tomorrow}`, `{create_ticket_examples}`, `{search_tickets_examples}` variables |
| `backend/app/prompts/assistant.py` | New | `get_system_prompt() -> str` — loads template via `PromptTemplate.from_file()` |
| `backend/app/agent_tools.py` | New | `@tool`-decorated `create_ticket_tool` / `search_tickets_tool`; each opens its own `SessionLocal`; `CREATE_TICKET_EXAMPLES` / `SEARCH_TICKETS_EXAMPLES` constants |
| `backend/app/agent_service.py` | New | `run_agent_stream(messages) -> AsyncGenerator[SSEEvent]` — `ChatOpenAI` + `bind_tools` + `astream` |
| `backend/app/database.py` | Modified | Added module-level `SessionLocal` (used by tools) alongside existing `get_db` |
| `backend/app/routers/chat.py` | New | `POST /api/chat/stream` — no `app.state` args; calls `agent_service.run_agent_stream` directly |
| `backend/app/schemas.py` | Modified | Added `ChatMessage`, `ChatRequest` Pydantic models |
| `backend/app/repository.py` | Modified | Added `search_tickets(db, title, status, priority, due_date)` with dynamic WHERE |
| `backend/app/main.py` | Modified | Include chat router at `/api/chat` |
| `backend/pyproject.toml` | Modified | Added `langchain-openai>=0.3` and `langchain-core>=0.3` |
| `backend/tests/test_chat_stream.py` | New | 4 tests; `api_client` fixture no longer sets `app.state` stubs |

## Architecture

### SSEEvent

```python
@dataclass
class SSEEvent:
    type: str   # thinking|message|tool_call|ticket_created|search_results|tasks_updated|done|error
    content: str

    def to_sse(self) -> str:
        return f"data: {json.dumps({'type': self.type, 'content': self.content})}\n\n"
```

### agent_tools.py

LangChain `@tool`-decorated functions. Each tool opens its own `SessionLocal` context manager
and calls `repo.create_ticket` / `repo.search_tickets` directly. No session passed from outside.
Tool names: `create_ticket_tool` and `search_tickets_tool`.

### agent_service.py streaming loop

```
1. yield SSEEvent(type="thinking", content="Thinking...")
2. Build LangChain messages via _to_langchain_messages():
   [SystemMessage(get_system_prompt())] + HumanMessage/AIMessage from history
3. Async stream: _llm_with_tools.astream(langchain_messages)
4. Per chunk (AIMessageChunk):
   - chunk.content → yield SSEEvent(type="message", content=token) if no tool call yet
   - chunk.tool_call_chunks → set has_tool_call = True; accumulate
5. After stream:
   - If tool call: yield tool_call event, ainvoke the tool, emit result events:
     create_ticket_tool → ticket_created + tasks_updated
     search_tickets_tool → search_results (JSON array)
6. yield SSEEvent(type="done", content="")
```

### Chat router

```python
@router.post("/stream")
async def chat_stream(body: ChatRequest) -> StreamingResponse:
    async def gen():
        async for ev in agent_service.run_agent_stream([m.model_dump() for m in body.messages]):
            yield ev.to_sse()
    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
```

### database.py — SessionLocal

```python
from app.config import settings

_engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
```

`get_db(request)` kept unchanged for the existing ticket/summary routers.

### repository.py addition

```python
def search_tickets(
    db: Session,
    title: str | None = None,
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    due_date: date | None = None,
) -> list[Ticket]:
    q = select(Ticket)
    if title:
        q = q.where(Ticket.title.ilike(f"%{title}%"))
    if status:
        q = q.where(Ticket.status == status)
    if priority:
        q = q.where(Ticket.priority == priority)
    if due_date:
        q = q.where(Ticket.due_date == due_date)
    return list(db.scalars(q.order_by(Ticket.created_at.desc())))
```

## Key decisions

- **LangChain**: `ChatOpenAI` + `bind_tools` + `astream` replaces plain `openai.AsyncOpenAI`. Matches the claude-skill-lab reference pattern.
- **`@tool` with self-contained sessions**: Each tool opens `SessionLocal()` internally — no session_factory parameter threading through the call stack.
- **`PromptTemplate.from_file()`**: Prompt content lives in `app/prompts/assistant.md`; template variables injected at call time.
- **`llm_base_url` support**: `if settings.llm_base_url:` conditional before `_llm` construction — claude-skill-lab doesn't have this; added for Qwen3/vLLM compatibility.
- **`run_agent_stream(messages)` signature**: No `client` or `session_factory` params — LangChain LLM and tools are module-level singletons.
- **Service layer convention**: `agent_service.py` does not import `HTTPException` — errors become `SSEEvent(type="error", ...)`.
- **Single tool call per turn**: The agent loop handles one tool call per LLM response.
- **mypy AIMessageChunk**: `astream` return type needs explicit `isinstance` check + `# type: ignore[assignment]` on accumulation due to `__add__` return type being `BaseMessageChunk`.

## Tests

- `test_search_tickets_repository` — filter by status in SQLite in-memory
- `test_chat_stream_returns_sse` — mock `run_agent_stream`, verify `text/event-stream` content type
- `test_chat_stream_done_event` — verify `done` event is present in response
- `test_chat_stream_422_on_missing_messages` — verify 422 on missing messages field

## Deviations from original spec

- LangChain added as dependency (original spec said "No LangChain" — refactored per milestone 8 LangChain refactor task).
- `agent_tools.py`: `@tool` functions replace plain-dict `TOOLS` schema + plain Python functions.
- `agent_service.py`: `ChatOpenAI`/`bind_tools`/`astream` replaces `openai.AsyncOpenAI`; no `session_factory` parameter.
- `routers/chat.py`: No `request: Request` param needed — no `app.state` access.
- `test_chat_stream.py`: `api_client` fixture no longer sets `app.state.llm_client` or `app.state.session_factory`.
- `database.py`: Added `SessionLocal` — original had none.
- `prompts/assistant.py`: Uses `PromptTemplate.from_file()` + `assistant.md` — original used f-string inline.

## Verification results

```
pytest -v: 24/24 passed
ruff check app tests: All checks passed
mypy app: Success: no issues found in 20 source files
docker compose startup: no ERROR/FATAL in backend logs
```

## PR target branch

`extra_milestone`
