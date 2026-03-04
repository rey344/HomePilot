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
    pmi_monthly: float = 0,
    term_years: int = 30,
) -> ExplainResult:
    """
    Produce a short narrative and suggestions based on 50/30/20 result.
    Logically consistent: affordable = (housing + other_needs) <= 50% of income.
    Suggestions are conditional based on actual scenario data.
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
        shortfall = total_needs_used - needs_budget_50
        narrative = (
            f"Your housing (${monthly_housing:,.0f}/month, {housing_pct_of_income:.1f}% of income) plus "
            f"other needs (${other_needs:,.0f}/month) totals ${total_needs_used:,.0f}/month. "
            f"That exceeds your 50% needs budget (${needs_budget_50:,.0f}) by ${shortfall:,.0f}/month."
        )
        
        # Build conditional suggestions based on actual scenario
        suggestions = []
        
        # Only suggest increasing down payment if PMI is actually being paid
        if pmi_monthly > 0:
            suggestions.append("Increase your down payment to 20% or more to eliminate PMI and lower your monthly payment.")
        else:
            suggestions.append("Increase your down payment to lower the loan amount and monthly payment.")
        
        # Only suggest longer term if current term is less than 30 years
        if term_years < 30:
            suggestions.append(f"Consider a longer term (e.g. 30 years vs. your current {term_years} years) to reduce monthly P&I.")
        elif term_years == 30:
            suggestions.append("Consider a lower price range to reduce your monthly payment.")
        
        suggestions.append("Look for ways to reduce other needs (utilities, insurance, subscriptions) to stay within 50%.")
    
    return ExplainResult(narrative=narrative, suggestions=suggestions)
