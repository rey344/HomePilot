"""
AI-generated explanation of affordability result.
Stub implementation returns deterministic narrative; can be replaced with LLM provider.
"""
from dataclasses import dataclass


@dataclass
class ExplainResult:
    narrative: str
    suggestions: list[str]


def explain_affordability(
    monthly_income: float,
    monthly_housing: float,
    other_needs: float,
    is_affordable: bool,
    housing_pct_of_income: float,
    needs_budget_50: float,
    remaining_needs_after_housing: float,
) -> ExplainResult:
    """
    Produce a short narrative and suggestions based on 50/30/20 result.
    Logically consistent: affordable = (housing + other_needs) <= 50% of income.
    """
    if is_affordable:
        narrative = (
            f"Your housing cost (${monthly_housing:,.0f}/month) is {housing_pct_of_income:.1f}% of your "
            f"take-home income (${monthly_income:,.0f}). Together with other needs (${other_needs:,.0f}/month), "
            f"you stay within the 50% needs budget (${needs_budget_50:,.0f}), leaving room for essentials."
        )
        suggestions = [
            "Consider building an emergency fund with part of the 20% savings bucket.",
            "Review your wants (30%) to keep flexibility.",
        ]
    else:
        total_needs_used = monthly_housing + other_needs
        shortfall = -remaining_needs_after_housing if remaining_needs_after_housing < 0 else 0
        narrative = (
            f"Your housing (${monthly_housing:,.0f}/month, {housing_pct_of_income:.1f}% of income) plus "
            f"other needs (${other_needs:,.0f}/month) totals ${total_needs_used:,.0f}/month. "
            f"That exceeds your 50% needs budget (${needs_budget_50:,.0f}) by about ${shortfall:,.0f}/month."
        )
        suggestions = [
            "Increase your down payment to lower the monthly payment and PMI.",
            "Consider a longer term (e.g. 30 years) to reduce monthly P&I, or a lower price range.",
            "Look for ways to reduce other needs (utilities, insurance, subscriptions) to stay within 50%.",
        ]
    return ExplainResult(narrative=narrative, suggestions=suggestions)
