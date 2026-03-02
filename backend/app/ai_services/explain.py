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
    is_affordable: bool,
    housing_pct_of_income: float,
    needs_budget_50: float,
    remaining_needs_after_housing: float,
) -> ExplainResult:
    """
    Produce a short narrative and suggestions based on 50/30/20 result.
    Stub: template-based. Replace with LLM call for real AI responses.
    """
    if is_affordable:
        narrative = (
            f"Your housing cost (${monthly_housing:,.0f}/month) is {housing_pct_of_income:.1f}% of your "
            f"take-home income (${monthly_income:,.0f}). It fits within the 50% needs bucket "
            f"(${needs_budget_50:,.0f}), leaving room for other essentials."
        )
        suggestions = [
            "Consider building an emergency fund with part of the 20% savings bucket.",
            "Review your wants (30%) to keep flexibility.",
        ]
    else:
        shortfall = -remaining_needs_after_housing if remaining_needs_after_housing < 0 else 0
        narrative = (
            f"Your housing cost (${monthly_housing:,.0f}/month) is {housing_pct_of_income:.1f}% of income, "
            f"which exceeds the 50% needs budget (${needs_budget_50:,.0f}). "
            f"You're about ${shortfall:,.0f}/month over the recommended needs cap."
        )
        suggestions = [
            "Increase your down payment to lower the monthly payment and PMI.",
            "Consider a longer term (e.g. 30 years) to reduce monthly P&I, or a lower price range.",
            "Look for ways to reduce other needs (utilities, insurance, subscriptions) to stay within 50%.",
        ]
    return ExplainResult(narrative=narrative, suggestions=suggestions)
