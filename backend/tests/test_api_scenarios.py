"""API tests for scenario CRUD."""
from decimal import Decimal

from fastapi.testclient import TestClient


def test_create_and_get_scenario(client: TestClient, clear_scenarios):
    resp = client.post(
        "/api/profile/scenarios",
        json={
            "name": "First home",
            "home_value": "350000",
            "down_payment": "70000",
            "annual_rate_pct": "6.5",
            "term_years": 30,
            "annual_property_tax_pct": "1.2",
            "annual_insurance_pct": "0.35",
            "hoa_monthly": "0",
            "maintenance_monthly_pct": "0.5",
            "monthly_take_home_income": "6500",
            "other_monthly_needs": "800",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "First home"
    assert data["home_value"] == "350000.00"
    assert "id" in data

    scenario_id = data["id"]
    get_resp = client.get(f"/api/profile/scenarios/{scenario_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "First home"


def test_list_scenarios(client: TestClient, clear_scenarios):
    client.post(
        "/api/profile/scenarios",
        json={
            "name": "Scenario A",
            "home_value": "300000",
            "down_payment": "60000",
            "annual_rate_pct": "6",
            "term_years": 30,
            "annual_property_tax_pct": "1",
            "annual_insurance_pct": "0.3",
            "monthly_take_home_income": "6000",
            "other_monthly_needs": "0",
        },
    )
    resp = client.get("/api/profile/scenarios")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert any(s["name"] == "Scenario A" for s in items)


def test_update_scenario(client: TestClient, clear_scenarios):
    create = client.post(
        "/api/profile/scenarios",
        json={
            "name": "To update",
            "home_value": "250000",
            "down_payment": "50000",
            "annual_rate_pct": "6",
            "term_years": 30,
            "annual_property_tax_pct": "1",
            "annual_insurance_pct": "0.3",
            "monthly_take_home_income": "5000",
            "other_monthly_needs": "0",
        },
    )
    scenario_id = create.json()["id"]
    resp = client.put(
        f"/api/profile/scenarios/{scenario_id}",
        json={"name": "Updated name"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Updated name"


def test_delete_scenario(client: TestClient, clear_scenarios):
    create = client.post(
        "/api/profile/scenarios",
        json={
            "name": "To delete",
            "home_value": "200000",
            "down_payment": "40000",
            "annual_rate_pct": "6",
            "term_years": 30,
            "annual_property_tax_pct": "1",
            "annual_insurance_pct": "0.3",
            "monthly_take_home_income": "4500",
            "other_monthly_needs": "0",
        },
    )
    scenario_id = create.json()["id"]
    resp = client.delete(f"/api/profile/scenarios/{scenario_id}")
    assert resp.status_code == 204
    get_resp = client.get(f"/api/profile/scenarios/{scenario_id}")
    assert get_resp.status_code == 404


def test_get_scenario_404(client: TestClient, clear_scenarios):
    resp = client.get("/api/profile/scenarios/99999")
    assert resp.status_code == 404