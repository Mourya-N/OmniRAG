import pytest
from app.core.config import settings, EnvironmentType


@pytest.fixture(autouse=True)
def configure_test_environment(monkeypatch):
    """Ensure testing environment is set during pytest executions."""
    monkeypatch.setattr(settings, "ENVIRONMENT", EnvironmentType.TESTING)

