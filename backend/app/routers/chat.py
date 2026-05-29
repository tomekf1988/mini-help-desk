from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app import agent_service
from app.schemas import ChatRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/stream")
async def chat_stream(body: ChatRequest) -> StreamingResponse:
    async def gen():
        async for ev in agent_service.run_agent_stream(
            [m.model_dump() for m in body.messages]
        ):
            yield ev.to_sse()

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
