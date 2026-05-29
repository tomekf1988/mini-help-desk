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

    stream = await client.chat.completions.create(
        model=settings.llm_model,
        stream=True,
        messages=[{"role": "user", "content": prompt}],
    )

    async for chunk in stream:
        token = chunk.choices[0].delta.content
        if token:
            yield token
