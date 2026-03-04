"""
50/30/20 affordability: compare housing cost to take-home income buckets.
Needs = 50%, Wants = 30%, Savings = 20%.
"""
from decimal import Decimal
from typing import NamedTuple


class AffordabilityResult(NamedTuple):
    monthly_income: Decimal
    needs_budget_50: Decimal
    wants_budget_30: Decimal
    savings_budget_20: Decimal
    monthly_housing: Decimal
    other_needs: Decimal
    remaining_needs_after_housing: Decimal
    housing_pct_of_income: Decimal
    is_affordable: bool  # housing fits within 50% needs bucket
    message: str


def affordability_503020(
    monthly_take_home_income: Decimal,
    monthly_housing_cost: Decimal,
    other_monthly_needs: Decimal = Decimal("0"),
) -> AffordabilityResult:
    """
    Apply 50/30/20: allocate income to needs (50%), wants (30%), savings (20%).
    Affordable = housing + other_needs <= 50% of income.
    """
    if monthly_take_home_income <= 0:
        return AffordabilityResult(
            monthly_income=Decimal("0"),
            needs_budget_50=Decimal("0"),
            wants_budget_30=Decimal("0"),
            savings_budget_20=Decimal("0"),
            monthly_housing=monthly_housing_cost,
            other_needs=other_monthly_needs,
            remaining_needs_after_housing=Decimal("0"),
            housing_pct_of_income=Decimal("0"),
            is_affordable=False,
            message="Monthly income must be positive.",
        )

    needs_50 = (monthly_take_home_income * Decimal("0.50")).quantize(Decimal("0.01"))
    wants_30 = (monthly_take_home_income * Decimal("0.30")).quantize(Decimal("0.01"))
    savings_20 = (monthly_take_home_income * Decimal("0.20")).quantize(Decimal("0.01"))

    total_needs_used = monthly_housing_cost + other_monthly_needs
    remaining_needs = (needs_50 - total_needs_used).quantize(Decimal("0.01"))
    housing_pct = (monthly_housing_cost / monthly_take_home_income * 100).quantize(Decimal("0.1"))

    fits = total_needs_used <= needs_50
    if fits:
        msg = "Housing fits within the 50% needs budget."
    else:
        msg = "Housing plus other needs exceed the 50% needs budget."

    return AffordabilityResult(
        monthly_income=monthly_take_home_income,
        needs_budget_50=needs_50,
        wants_budget_30=wants_30,
        savings_budget_20=savings_20,
        monthly_housing=monthly_housing_cost,
        other_needs=other_monthly_needs,
        remaining_needs_after_housing=remaining_needs,
        housing_pct_of_income=housing_pct,
        is_affordable=fits,
        message=msg,
    )
