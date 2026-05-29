"""API tests for the tickets CRUD endpoints."""
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings
from app.database import Base, get_db
from app.main import app


def _test_db_url() -> str:
    if not settings.test_database_url:
        raise RuntimeError("TEST_DATABASE_URL is not set — refusing to run tests against the production database")
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
    """Each test gets a transaction that is rolled back after the test."""
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
    """TestClient with the DB session overridden to use the test transaction."""
    app.dependency_overrides[get_db] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


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
