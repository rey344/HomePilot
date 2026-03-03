"""API tests for /api/calc."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_piti_rejects_down_payment_gte_home_value():
    """Down payment must be less than home value."""
    resp = client.post(
        "/api/calc/piti",
        json={
            "home_value": 300000,
            "down_payment": 300000,
            "annual_rate_pct": 6,
            "term_years": 30,
            "annual_property_tax_pct": 1,
            "annual_insurance_pct": 0.3,
            "hoa_monthly": 0,
            "maintenance_monthly_pct": 0.5,
        },
    )
    assert resp.status_code == 422
    detail = resp.json().get("detail", [])
    if isinstance(detail, list) and detail:
        msg = detail[0].get("msg", "")
    else:
        msg = str(detail)
    assert "down" in msg.lower() or "value" in msg.lower()


def test_piti_accepts_valid_terms():
    resp = client.post(
        "/api/calc/piti",
        json={
            "home_value": 300000,
            "down_payment": 60000,
            "annual_rate_pct": 6,
            "term_years": 30,
            "annual_property_tax_pct": 1,
            "annual_insurance_pct": 0.3,
            "hoa_monthly": 0,
            "maintenance_monthly_pct": 0.5,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert float(data["total_monthly"]) > 0
