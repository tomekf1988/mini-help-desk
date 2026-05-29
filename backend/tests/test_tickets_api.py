"""API tests for the tickets CRUD endpoints."""
import uuid

from fastapi.testclient import TestClient


# --- helpers ---

def _create_ticket(client: TestClient, **kwargs) -> dict:
    payload = {"title": "Test ticket", **kwargs}
    resp = client.post("/api/tickets/", json=payload)
    assert resp.status_code == 201
    return resp.json()


# --- tests ---

def test_create_ticket(api_client: TestClient) -> None:
    data = _create_ticket(api_client, title="New ticket", priority="high", description="desc")
    assert data["title"] == "New ticket"
    assert data["priority"] == "high"
    assert data["description"] == "desc"
    assert data["status"] == "open"
    assert "id" in data


def test_create_ticket_defaults(api_client: TestClient) -> None:
    data = _create_ticket(api_client, title="Minimal ticket")
    assert data["status"] == "open"
    assert data["priority"] == "medium"
    assert data["description"] is None
    assert data["estimated_minutes"] is None
    assert data["due_date"] is None


def test_get_ticket(api_client: TestClient) -> None:
    created = _create_ticket(api_client, title="Fetch me")
    resp = api_client.get(f"/api/tickets/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Fetch me"


def test_get_ticket_not_found(api_client: TestClient) -> None:
    missing_id = str(uuid.uuid4())
    resp = api_client.get(f"/api/tickets/{missing_id}")
    assert resp.status_code == 404


def test_list_tickets(api_client: TestClient) -> None:
    _create_ticket(api_client, title="A")
    _create_ticket(api_client, title="B")
    resp = api_client.get("/api/tickets/")
    assert resp.status_code == 200
    titles = [t["title"] for t in resp.json()]
    assert "A" in titles
    assert "B" in titles


def test_list_tickets_filter_by_status(api_client: TestClient) -> None:
    _create_ticket(api_client, title="Open ticket", status="open")
    _create_ticket(api_client, title="Closed ticket", status="closed")

    resp = api_client.get("/api/tickets/?status=open")
    assert resp.status_code == 200
    statuses = [t["status"] for t in resp.json()]
    assert all(s == "open" for s in statuses)
    titles = [t["title"] for t in resp.json()]
    assert "Open ticket" in titles
    assert "Closed ticket" not in titles


def test_update_ticket(api_client: TestClient) -> None:
    created = _create_ticket(api_client, title="To update")
    resp = api_client.patch(
        f"/api/tickets/{created['id']}",
        json={"status": "in_progress", "priority": "high"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "in_progress"
    assert data["priority"] == "high"
    assert data["title"] == "To update"  # unchanged


def test_update_ticket_not_found(api_client: TestClient) -> None:
    missing_id = str(uuid.uuid4())
    resp = api_client.patch(f"/api/tickets/{missing_id}", json={"status": "closed"})
    assert resp.status_code == 404


def test_delete_ticket(api_client: TestClient) -> None:
    created = _create_ticket(api_client, title="To delete")
    resp = api_client.delete(f"/api/tickets/{created['id']}")
    assert resp.status_code == 204

    # Verify it's gone
    get_resp = api_client.get(f"/api/tickets/{created['id']}")
    assert get_resp.status_code == 404


def test_delete_ticket_not_found(api_client: TestClient) -> None:
    missing_id = str(uuid.uuid4())
    resp = api_client.delete(f"/api/tickets/{missing_id}")
    assert resp.status_code == 404


def test_full_crud_cycle(api_client: TestClient) -> None:
    # Create
    created = _create_ticket(
        api_client,
        title="Full cycle",
        description="Initial desc",
        status="open",
        priority="low",
        estimated_minutes=60,
    )
    ticket_id = created["id"]
    assert created["status"] == "open"

    # Get
    resp = api_client.get(f"/api/tickets/{ticket_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Full cycle"

    # Update
    resp = api_client.patch(
        f"/api/tickets/{ticket_id}",
        json={"status": "in_progress", "estimated_minutes": 90},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"
    assert resp.json()["estimated_minutes"] == 90

    # Close it
    resp = api_client.patch(f"/api/tickets/{ticket_id}", json={"status": "closed"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"

    # Delete
    resp = api_client.delete(f"/api/tickets/{ticket_id}")
    assert resp.status_code == 204

    # Confirm gone
    resp = api_client.get(f"/api/tickets/{ticket_id}")
    assert resp.status_code == 404