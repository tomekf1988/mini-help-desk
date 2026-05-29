"""API tests for the SSE summary streaming endpoint."""
import uuid
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_db
from app.main import app
from app.routers.summary import get_llm_client


@pytest.fixture
def api_client(db_session: Session) -> TestClient:
    app.dependency_overrides[get_db] = lambda: db_session
    # Stub LLM client — actual LLM call is always mocked out in these tests.
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