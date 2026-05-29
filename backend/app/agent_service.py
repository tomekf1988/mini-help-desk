import json
from collections.abc import AsyncGenerator

from langchain_core.messages import AIMessage, AIMessageChunk, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.config import settings
from app.events import SSEEvent
from app.prompts.assistant import get_system_prompt
from app.agent_tools import create_ticket_tool, search_tickets_tool

if settings.llm_base_url:
    _llm = ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.llm_api_key,  # type: ignore[arg-type]
        base_url=settings.llm_base_url,
    )
else:
    _llm = ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.llm_api_key,  # type: ignore[arg-type]
    )

_llm_with_tools = _llm.bind_tools([create_ticket_tool, search_tickets_tool])

_tool_map = {
    "create_ticket_tool": create_ticket_tool,
    "search_tickets_tool": search_tickets_tool,
}


def _to_langchain_messages(messages: list[dict]) -> list:  # type: ignore[type-arg]
    result: list = [SystemMessage(content=get_system_prompt())]  # type: ignore[type-arg]
    for msg in messages:
        if msg["role"] == "user":
            result.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            result.append(AIMessage(content=msg["content"]))
    return result


async def run_agent_stream(messages: list[dict]) -> AsyncGenerator[SSEEvent, None]:  # type: ignore[type-arg]
    yield SSEEvent(type="thinking", content="Thinking...")

    try:
        langchain_messages = _to_langchain_messages(messages)

        accumulated: AIMessageChunk | None = None
        has_tool_call = False

        async for chunk in _llm_with_tools.astream(langchain_messages):
            # astream yields AIMessageChunk; cast so mypy knows the type
            msg_chunk = chunk if isinstance(chunk, AIMessageChunk) else AIMessageChunk(content=str(chunk.content))  # type: ignore[arg-type]
            accumulated = msg_chunk if accumulated is None else accumulated + msg_chunk  # type: ignore[assignment]

            # Emit text tokens before updating flag so content from a mixed chunk
            # (content + tool_call_chunks) is not dropped
            if not has_tool_call and msg_chunk.content:
                yield SSEEvent(type="message", content=str(msg_chunk.content))

            if msg_chunk.tool_call_chunks:
                has_tool_call = True

        if has_tool_call:
            if accumulated is None or not accumulated.tool_calls:
                yield SSEEvent(type="error", content="Tool call detected but could not be parsed.")
            else:
                tool_call = accumulated.tool_calls[0]
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]

                yield SSEEvent(type="tool_call", content=tool_name)

                lc_tool = _tool_map.get(tool_name)
                if lc_tool is None:
                    yield SSEEvent(type="error", content=f"Unknown tool: {tool_name}")
                else:
                    result = await lc_tool.ainvoke(tool_args)

                    if tool_name == "create_ticket_tool":
                        if isinstance(result, dict) and "error" not in result:
                            yield SSEEvent(type="ticket_created", content=json.dumps(result))
                            yield SSEEvent(type="tasks_updated", content="refresh")
                        else:
                            error_msg = (
                                result.get("error", str(result))
                                if isinstance(result, dict)
                                else str(result)
                            )
                            yield SSEEvent(type="message", content=f"Error: {error_msg}")
                    elif tool_name == "search_tickets_tool":
                        tickets = result.get("tickets", []) if isinstance(result, dict) else []
                        yield SSEEvent(type="search_results", content=json.dumps(tickets))
                    else:
                        yield SSEEvent(type="message", content=str(result))

        yield SSEEvent(type="done", content="")

    except Exception as exc:
        yield SSEEvent(type="error", content=str(exc))
