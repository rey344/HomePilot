"""Unit tests for AI explain service."""
from app.ai_services.explain import explain_affordability


def test_explain_affordable():
    r = explain_affordability(
        monthly_income=6000,
        monthly_housing=2000,
        other_needs=500,
        is_affordable=True,
        housing_pct_of_income=33.33,
        needs_budget_50=3000,
        remaining_needs_after_housing=500,
    )
    assert "fits" in r.narrative.lower() or "50" in r.narrative or "within" in r.narrative.lower()
    assert len(r.suggestions) >= 1
    # Check new fields
    assert r.provider in ["mock", "groq"]
    assert r.model is not None
    assert r.tokens_used >= 0


def test_explain_not_affordable():
    r = explain_affordability(
        monthly_income=6000,
        monthly_housing=3500,
        other_needs=0,
        is_affordable=False,
        housing_pct_of_income=58.33,
        needs_budget_50=3000,
        remaining_needs_after_housing=-500,
    )
    assert "exceed" in r.narrative.lower() or "over" in r.narrative.lower() or "50" in r.narrative
    assert any("down payment" in s.lower() or "price" in s.lower() for s in r.suggestions)
    # Check new fields
    assert r.provider in ["mock", "groq"]
    assert r.model is not None

