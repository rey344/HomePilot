"""Pytest fixtures: in-memory SQLite for tests."""
import os

import pytest

# Use SQLite for all tests so no Postgres is required (set before app imports)
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")


@pytest.fixture(scope="function")
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def db_session():
    """Direct DB session for tests that need it (e.g. to clear data)."""
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def clear_scenarios(client, db_session):
    """Clear scenarios table before each test (runs after client so tables exist)."""
    from app.db.models import Scenario
    db_session.query(Scenario).delete()
    db_session.commit()
    yield
