"""LLM streaming integration using the OpenAI SDK."""
from typing import AsyncGenerator

import openai

from app.config import settings
from app.models import Ticket


async def stream_summary(client: openai.AsyncOpenAI, ticket: Ticket) -> AsyncGenerator[str, None]:
    """Stream a concise AI-generated summary of a ticket token by token."""
    prompt = (
        f"Write a concise summary (2-3 sentences) of the following support ticket.\n\n"
        f"Title: {ticket.title}\n"
        f"Status: {ticket.status.value}\n"
        f"Priority: {ticket.priority.value}\n"
        f"Description: {ticket.description or 'No description provided.'}\n"
    )

    # extra_body with chat_template_kwargs is Qwen3/vLLM-specific; skip for standard OpenAI
    extra: dict = (
        {"chat_template_kwargs": {"enable_thinking": False}} if settings.llm_base_url else {}
    )

    stream = await client.chat.completions.create(
        model=settings.llm_model,
        stream=True,
        messages=[
            {
                "role": "system",
                "content": "You are a concise technical assistant. Reply directly without any preamble or thinking. Always respond in the same language as the ticket content.",
            },
            {"role": "user", "content": prompt},
        ],
        extra_body=extra or None,
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token
