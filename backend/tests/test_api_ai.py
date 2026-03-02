"""API tests for /api/ai/explain."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_explain_endpoint_affordable():
    resp = client.post(
        "/api/ai/explain",
        json={
            "monthly_income": 6000,
            "monthly_housing": 2000,
            "is_affordable": True,
            "housing_pct_of_income": 33.33,
            "needs_budget_50": 3000,
            "remaining_needs_after_housing": 500,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "narrative" in data
    assert "suggestions" in data
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) >= 1


def test_explain_endpoint_not_affordable():
    resp = client.post(
        "/api/ai/explain",
        json={
            "monthly_income": 6000,
            "monthly_housing": 3200,
            "is_affordable": False,
            "housing_pct_of_income": 53.33,
            "needs_budget_50": 3000,
            "remaining_needs_after_housing": -200,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "narrative" in data
    assert any("down payment" in s.lower() for s in data["suggestions"])
