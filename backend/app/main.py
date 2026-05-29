from contextlib import asynccontextmanager
import logging
import sys

import openai
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.routers import chat, summary, tickets

# app.* loggers are not covered by uvicorn's log config — add a handler explicitly
_app_handler = logging.StreamHandler(sys.stdout)
_app_handler.setFormatter(logging.Formatter("%(levelname)-8s %(name)s - %(message)s"))
logging.getLogger("app").setLevel(logging.INFO)
logging.getLogger("app").addHandler(_app_handler)
logging.getLogger("app").propagate = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # DB
    engine = create_engine(settings.database_url)
    app.state.session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # LLM
    if settings.llm_base_url:
        app.state.llm_client = openai.AsyncOpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
        )
    else:
        app.state.llm_client = openai.AsyncOpenAI(api_key=settings.llm_api_key)
    yield
    await app.state.llm_client.close()
    engine.dispose()


app = FastAPI(title="Mini Help Desk", lifespan=lifespan)

app.include_router(tickets.router)
app.include_router(summary.router)
app.include_router(chat.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
