"""API tests for the SSE summary streaming endpoint."""
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.routers.summary import get_llm_client


# --- DB fixtures (same pattern as test_tickets_api.py) ---

def _test_db_url() -> str:
    if not settings.test_database_url:
        raise RuntimeError(
            "TEST_DATABASE_URL is not set — refusing to run tests against the production database"
        )
    return settings.test_database_url


def _ensure_test_db_exists(url: str) -> None:
    parsed = make_url(url)
    db_name = parsed.database
    admin_url = parsed.set(database="postgres")
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": db_name},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def db_engine():
    url = _test_db_url()
    _ensure_test_db_exists(url)
    engine = create_engine(url)

    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS tickets CASCADE"))
        conn.execute(text("DROP TYPE IF EXISTS ticketstatus CASCADE"))
        conn.execute(text("DROP TYPE IF EXISTS ticketpriority CASCADE"))
        conn.commit()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    factory = sessionmaker(bind=connection)
    session: Session = factory()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def api_client(db_session: Session) -> TestClient:
    app.dependency_overrides[get_db] = lambda: db_session
    # Provide a stub so the endpoint never touches app.state.llm_client.
    # The actual LLM call is always mocked out in these tests anyway.
    app.dependency_overrides[get_llm_client] = lambda: None
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# --- helpers ---

def _create_ticket(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Stream test ticket", **kwargs}
    resp = client.post("/api/tickets/", json=payload)
    assert resp.status_code == 201
    return resp.json()


async def _fake_stream(*_args, **_kwargs):
    """Async generator that yields a predictable sequence of tokens."""
    for token in ["Hello", " ", "world", "!"]:
        yield token


# --- tests ---

def test_stream_returns_sse_events(api_client: TestClient) -> None:
    """Happy path: tokens arrive as SSE data events, stream ends with [DONE]."""
    ticket = _create_ticket(api_client, title="Streaming ticket")

    with patch("app.service.llm.stream_summary", side_effect=_fake_stream):
        resp = api_client.get(f"/api/tickets/{ticket['id']}/summary/stream")

    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]

    lines = resp.text.splitlines()
    data_lines = [line for line in lines if line.startswith("data: ")]

    assert data_lines[:-1] == ["data: Hello", "data:  ", "data: world", "data: !"]
    assert data_lines[-1] == "data: [DONE]"


def test_stream_returns_404_for_missing_ticket(api_client: TestClient) -> None:
    """A non-existent ticket ID must produce a 404 before the stream opens."""
    missing_id = str(uuid.uuid4())

    resp = api_client.get(f"/api/tickets/{missing_id}/summary/stream")

    assert resp.status_code == 404


def test_stream_cache_control_headers(api_client: TestClient) -> None:
    """SSE response must carry the correct no-cache headers."""
    ticket = _create_ticket(api_client, title="Header check ticket")

    with patch("app.service.llm.stream_summary", side_effect=_fake_stream):
        resp = api_client.get(f"/api/tickets/{ticket['id']}/summary/stream")

    assert resp.headers.get("cache-control") == "no-cache"
    assert resp.headers.get("x-accel-buffering") == "no"
