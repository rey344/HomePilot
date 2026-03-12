"""API tests for /api/profile/affordability."""
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_affordability_endpoint_affordable():
    resp = client.post(
        "/api/profile/affordability",
        json={
            "monthly_take_home_income": "6000",
            "monthly_housing_cost": "2000",
            "other_monthly_needs": "500",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_affordable"] is True
    assert float(data["needs_budget_50"]) == 3000
    assert float(data["monthly_housing"]) == 2000
    assert "fits" in data["message"].lower()


def test_affordability_endpoint_unaffordable():
    resp = client.post(
        "/api/profile/affordability",
        json={
            "monthly_take_home_income": "6000",
            "monthly_housing_cost": "3200",
            "other_monthly_needs": "0",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_affordable"] is False
    assert float(data["needs_budget_50"]) == 3000


def test_affordability_validation_rejects_zero_income():
    resp = client.post(
        "/api/profile/affordability",
        json={
            "monthly_take_home_income": "0",
            "monthly_housing_cost": "2000",
            "other_monthly_needs": "0",
        },
    )
    assert resp.status_code == 422
