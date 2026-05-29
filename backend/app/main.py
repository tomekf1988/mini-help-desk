from contextlib import asynccontextmanager

import openai
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.routers import summary, tickets


@asynccontextmanager
async def lifespan(app: FastAPI):
    # DB
    engine = create_engine(settings.database_url)
    app.state.session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # LLM
    kwargs: dict[str, str] = {"api_key": settings.llm_api_key}
    if settings.llm_base_url:
        kwargs["base_url"] = settings.llm_base_url
    app.state.llm_client = openai.AsyncOpenAI(**kwargs)
    yield
    await app.state.llm_client.aclose()
    engine.dispose()


app = FastAPI(title="Mini Help Desk", lifespan=lifespan)

app.include_router(tickets.router)
app.include_router(summary.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
