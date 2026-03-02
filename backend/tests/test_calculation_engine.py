"""Unit tests for calculation engine (pure logic, no mocks)."""
from decimal import Decimal

import pytest

from app.calculation_engine import amortization_schedule, monthly_payment, monthly_piti_full, monthly_pmi


def test_monthly_payment_basic():
    # 300k, 6.5%, 30 years – approximate P&I
    p = monthly_payment(Decimal("300000"), Decimal("6.5"), 30)
    assert 1890 < p < 1960


def test_monthly_pmi_zero_when_ltv_80():
    # 200k loan on 300k home = 66.7% LTV
    assert monthly_pmi(Decimal("200000"), Decimal("300000")) == Decimal("0")


def test_monthly_pmi_positive_when_ltv_above_80():
    # 270k loan on 300k home = 90% LTV
    pmi = monthly_pmi(Decimal("270000"), Decimal("300000"))
    assert pmi > 0


def test_monthly_piti_full():
    # 300k home, 60k down = 240k loan, 6%, 30 yr, 1.2% tax, 0.35% insurance
    total = monthly_piti_full(
        home_value=Decimal("300000"),
        loan_amount=Decimal("240000"),
        annual_rate_pct=Decimal("6"),
        term_years=30,
        annual_property_tax_pct=Decimal("1.2"),
        annual_insurance_pct=Decimal("0.35"),
    )
    assert total > 0
    assert total < 5000


def test_amortization_schedule_length():
    rows = amortization_schedule(Decimal("240000"), Decimal("6"), 30, max_months=12)
    assert len(rows) == 12
    assert rows[0].month == 1
    assert rows[0].balance == Decimal("240000") - rows[0].principal
