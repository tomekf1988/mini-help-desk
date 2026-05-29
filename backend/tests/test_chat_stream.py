"""Tests for the chat SSE endpoint and related components."""
import json
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import get_db
from app.events import SSEEvent
from app.main import app
from app.models import TicketStatus
from app.schemas import TicketCreate
import app.repository as repo


@pytest.fixture
def api_client(db_session: Session) -> TestClient:
    """Override get_db for tests; run_agent_stream is always mocked."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_search_tickets_repository(db_session):
    """Verify search_tickets filters correctly by status."""
    repo.create_ticket(db_session, TicketCreate(title="Open task one", status=TicketStatus.open))
    repo.create_ticket(db_session, TicketCreate(title="Open task two", status=TicketStatus.open))
    repo.create_ticket(db_session, TicketCreate(title="Closed task", status=TicketStatus.closed))

    results = repo.search_tickets(db_session, status=TicketStatus.open)

    assert len(results) == 2
    assert all(t.status == TicketStatus.open for t in results)


def test_chat_stream_returns_sse(api_client: TestClient):
    """chat_stream endpoint returns text/event-stream content type."""

    async def mock_stream(*args, **kwargs):
        yield SSEEvent(type="thinking", content="Thinking...")
        yield SSEEvent(type="done", content="")

    with patch("app.agent_service.run_agent_stream", side_effect=mock_stream):
        response = api_client.post(
            "/api/chat/stream",
            json={"messages": [{"role": "user", "content": "hi"}]},
        )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


def test_chat_stream_done_event(api_client: TestClient):
    """Response body contains a done event."""

    async def mock_stream(*args, **kwargs):
        yield SSEEvent(type="done", content="")

    with patch("app.agent_service.run_agent_stream", side_effect=mock_stream):
        response = api_client.post(
            "/api/chat/stream",
            json={"messages": [{"role": "user", "content": "hello"}]},
        )

    assert response.status_code == 200
    found_done = any(
        json.loads(line[len("data: "):])["type"] == "done"
        for line in response.text.splitlines()
        if line.startswith("data: ")
    )
    assert found_done, f"No done event found in: {response.text!r}"


def test_chat_stream_422_on_missing_messages(api_client: TestClient):
    """Request body without messages field returns 422."""
    response = api_client.post("/api/chat/stream", json={})
    assert response.status_code == 422
