# PR — Milestone 8: Agent Backend: Tool Calling & Chat SSE

## Summary

- Added AI chat agent endpoint `POST /api/chat/stream` that streams SSE events token-by-token
- Used LangChain (`ChatOpenAI`, `bind_tools`, `astream`, `@tool`, `PromptTemplate.from_file()`) matching the claude-skill-lab reference pattern
- Agent can create tickets and search tickets via OpenAI tool calling
- Added `search_tickets()` to repository with dynamic WHERE filters
- Added `SessionLocal` to `database.py` for tool-internal session management
- Fixed `extra_body` / `chat_template_kwargs` to only send when using custom `llm_base_url` (Qwen3/vLLM); standard OpenAI API was returning 400

## Files

### New
- `backend/app/events.py` — `SSEEvent` dataclass with `.to_sse()`
- `backend/app/prompts/__init__.py` — package marker
- `backend/app/prompts/assistant.md` — prompt template
- `backend/app/prompts/assistant.py` — `get_system_prompt()` via `PromptTemplate.from_file()`
- `backend/app/agent_tools.py` — `@tool`-decorated `create_ticket_tool` / `search_tickets_tool`
- `backend/app/agent_service.py` — `run_agent_stream(messages)` async generator
- `backend/app/routers/chat.py` — `POST /api/chat/stream`
- `backend/tests/test_chat_stream.py` — 4 tests

### Modified
- `backend/app/database.py` — added `SessionLocal`
- `backend/app/repository.py` — added `search_tickets()`
- `backend/app/schemas.py` — added `ChatMessage`, `ChatRequest`
- `backend/app/main.py` — registered chat router
- `backend/app/llm.py` — conditional `extra_body` (Qwen3/vLLM only)
- `backend/pyproject.toml` — added `langchain-openai>=0.3`, `langchain-core>=0.3`
- `.claude/CLAUDE.md` — updated stack section to include LangChain

## Test results

- pytest: 24/24 passed
- ruff: clean
- mypy: clean (20 source files)
