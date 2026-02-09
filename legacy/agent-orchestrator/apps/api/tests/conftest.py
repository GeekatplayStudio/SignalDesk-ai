import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure the app uses SQLite for tests before importing app modules.
TEST_DB_PATH = Path("/tmp/mva_api_test.db")
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

from api.database import Base, SessionLocal, engine, get_db  # noqa: E402
from api.main import app  # noqa: E402
from api.orchestrator import TOOL_CIRCUITS  # noqa: E402


def _override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    TOOL_CIRCUITS.clear()
    yield


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
