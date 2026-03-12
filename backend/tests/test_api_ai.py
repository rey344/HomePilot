"""API tests for /api/ai/explain and /api/ai/chat."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_explain_endpoint_affordable():
    resp = client.post(
        "/api/ai/explain",
        json={
            "monthly_income": 6000,
            "monthly_housing": 2000,
            "other_needs": 500,
            "is_affordable": True,
            "housing_pct_of_income": 33.33,
            "needs_budget_50": 3000,
            "remaining_needs_after_housing": 500,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data
    assert "narrative" in data
    assert "suggestions" in data
    assert "provider" in data
    assert "model" in data
    assert "tokens_used" in data
    assert isinstance(data["suggestions"], list)
    assert len(data["suggestions"]) >= 1
    # Should use mock provider in tests (no API keys set)
    assert data["provider"] in ["mock", "groq"]


def test_explain_endpoint_not_affordable():
    resp = client.post(
        "/api/ai/explain",
        json={
            "monthly_income": 6000,
            "monthly_housing": 3200,
            "other_needs": 0,
            "is_affordable": False,
            "housing_pct_of_income": 53.33,
            "needs_budget_50": 3000,
            "remaining_needs_after_housing": -200,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "narrative" in data
    assert "provider" in data
    assert any("down payment" in s.lower() for s in data["suggestions"])


def test_chat_endpoint():
    resp = client.post(
        "/api/v1/ai/chat",
        json={
            "messages": [{"role": "user", "content": "Is this affordable?"}],
            "scenario_context": {
                "home_value": 350000,
                "down_payment": 70000,
                "monthly_payment_total": 2200,
                "monthly_income": 6500,
                "is_affordable": True,
                "housing_pct_of_income": 33.8,
            },
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "message" in data
    assert data["message"]["role"] == "assistant"
    assert len(data["message"]["content"]) > 0
    assert data["provider"] in ["mock", "groq"]
