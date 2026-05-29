"""LLM streaming integration using the OpenAI SDK."""
from typing import AsyncGenerator

import openai

from app.config import settings
from app.models import Ticket

# Models that require thinking mode to be disabled via chat_template_kwargs
_NO_THINKING_MODELS = {
    "unsloth/Qwen3.5-9B",
    "Qwen/Qwen3-8B",
    "Qwen/Qwen3-14B",
    "Qwen/Qwen3-32B",
}


async def stream_summary(client: openai.AsyncOpenAI, ticket: Ticket) -> AsyncGenerator[str, None]:
    """Stream a concise AI-generated summary of a ticket token by token."""
    prompt = (
        f"Write a concise summary (2-3 sentences) of the following support ticket.\n\n"
        f"Title: {ticket.title}\n"
        f"Status: {ticket.status.value}\n"
        f"Priority: {ticket.priority.value}\n"
        f"Description: {ticket.description or 'No description provided.'}\n"
    )

    extra: dict = {}
    if settings.llm_model in _NO_THINKING_MODELS:
        extra = {"extra_body": {"chat_template_kwargs": {"enable_thinking": False}}}

    stream = await client.chat.completions.create(
        model=settings.llm_model,
        stream=True,
        messages=[
            {
                "role": "system",
                "content": "You are a concise technical assistant. Reply directly without any preamble or thinking.",
            },
            {"role": "user", "content": prompt},
        ],
        **extra,
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token
