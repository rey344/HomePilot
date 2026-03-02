"""Unit tests for profile_modeling (50/30/20 affordability)."""
from decimal import Decimal

import pytest

from app.profile_modeling import affordability_503020


def test_affordable_housing_under_50_percent():
    # 6000 income → 3000 needs. Housing 2000 + 500 other = 2500 < 3000
    r = affordability_503020(
        monthly_take_home_income=Decimal("6000"),
        monthly_housing_cost=Decimal("2000"),
        other_monthly_needs=Decimal("500"),
    )
    assert r.is_affordable is True
    assert r.needs_budget_50 == Decimal("3000")
    assert r.remaining_needs_after_housing == Decimal("500")
    assert "fits" in r.message.lower()


def test_unaffordable_housing_over_50_percent():
    # 6000 income → 3000 needs. Housing 2800 + 500 other = 3300 > 3000
    r = affordability_503020(
        monthly_take_home_income=Decimal("6000"),
        monthly_housing_cost=Decimal("2800"),
        other_monthly_needs=Decimal("500"),
    )
    assert r.is_affordable is False
    assert r.needs_budget_50 == Decimal("3000")
    assert r.remaining_needs_after_housing == Decimal("-300")
    assert "exceed" in r.message.lower()


def test_buckets_50_30_20():
    r = affordability_503020(
        monthly_take_home_income=Decimal("10000"),
        monthly_housing_cost=Decimal("1000"),
        other_monthly_needs=Decimal("0"),
    )
    assert r.needs_budget_50 == Decimal("5000")
    assert r.wants_budget_30 == Decimal("3000")
    assert r.savings_budget_20 == Decimal("2000")
    assert r.housing_pct_of_income == Decimal("10")  # 1000/10000 = 10%


def test_zero_income_returns_not_affordable():
    r = affordability_503020(
        monthly_take_home_income=Decimal("0"),
        monthly_housing_cost=Decimal("2000"),
        other_monthly_needs=Decimal("0"),
    )
    assert r.is_affordable is False
    assert r.needs_budget_50 == Decimal("0")
    assert "income" in r.message.lower()
