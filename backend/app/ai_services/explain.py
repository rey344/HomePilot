"""
AI-generated explanation of affordability result.
Integrates with real LLM providers (OpenAI, Groq, Anthropic) with fallback to rule-based mock.
"""
import json
from dataclasses import dataclass
from app.config import settings
from app.ai_services.providers import get_ai_provider, AIResponse


@dataclass
class ExplainResult:
    narrative: str
    suggestions: list[str]
    provider: str = "mock"  # Which AI provider was used
    model: str = "rule-based"  # Which model was used
    tokens_used: int = 0  # For cost tracking


def _build_prompt(
    monthly_income: float,
    monthly_housing: float,
    other_needs: float,
    is_affordable: bool,
    housing_pct_of_income: float,
    needs_budget_50: float,
    remaining_needs_after_housing: float,
    pmi_monthly: float = 0,
    term_years: int = 30,
) -> str:
    """Build a structured prompt for the AI."""
    prompt = f"""Analyze this homebuying scenario and provide clear financial guidance:

**Income & Budget:**
- Monthly take-home income: ${monthly_income:,.2f}
- 50/30/20 rule: 50% needs budget = ${needs_budget_50:,.2f}

**Housing Costs:**
- Monthly housing payment (PITI + HOA): ${monthly_housing:,.2f}
- Housing as % of income: {housing_pct_of_income:.1f}%
- PMI included: ${pmi_monthly:,.2f}/month
- Mortgage term: {term_years} years

**Other Monthly Needs:**
- Other essential expenses: ${other_needs:,.2f}
- Total needs (housing + other): ${monthly_housing + other_needs:,.2f}
- Remaining needs budget after housing: ${remaining_needs_after_housing:,.2f}

**Affordability:**
- Is affordable under 50/30/20 rule: {"✅ YES" if is_affordable else "❌ NO"}

**Your Task:**
1. Write a 2-3 sentence narrative explaining whether this scenario is financially sound.
2. Provide 2-4 specific, actionable suggestions to improve their situation.

Return your response as JSON with this exact structure:
{{
  "narrative": "Your 2-3 sentence explanation here",
  "suggestions": [
    "First specific suggestion",
    "Second specific suggestion",
    "Third suggestion (if applicable)"
  ]
}}

Focus on practical financial advice. Be encouraging but realistic."""
    
    return prompt


def _parse_ai_response(content: str) -> tuple[str, list[str]]:
    """Parse AI response, handling both JSON and plain text formats."""
    try:
        # Try to parse as JSON first
        data = json.loads(content)
        return data.get("narrative", ""), data.get("suggestions", [])
    except json.JSONDecodeError:
        # Fallback: split by newlines and parse manually
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        # Try to find narrative (first substantial paragraph)
        narrative = ""
        suggestions = []
        in_suggestions = False
        
        for line in lines:
            if line.lower().startswith('narrative:'):
                narrative = line.split(':', 1)[1].strip()
            elif line.lower().startswith('suggestions:'):
                in_suggestions = True
            elif in_suggestions and (line.startswith('-') or line.startswith('•') or line[0].isdigit()):
                suggestion = line.lstrip('-•0123456789. ').strip()
                if suggestion:
                    suggestions.append(suggestion)
            elif not narrative and len(line) > 50:
                narrative = line
        
        return narrative, suggestions


def _generate_rule_based_response(
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
    Rule-based fallback response (used when no AI provider is configured).
    Logically consistent with 50/30/20 framework.
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
    
    return ExplainResult(
        narrative=narrative,
        suggestions=suggestions,
        provider="mock",
        model="rule-based",
        tokens_used=0,
    )


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
    Uses real AI providers (OpenAI, Groq, Anthropic) if configured,
    with automatic fallback to rule-based mock.
    """
    try:
        # Get AI provider (auto-selects based on config)
        provider = get_ai_provider()
        
        # If mock provider, use rule-based response directly
        if provider.provider_name == "mock":
            return _generate_rule_based_response(
                monthly_income, monthly_housing, other_needs, is_affordable,
                housing_pct_of_income, needs_budget_50, remaining_needs_after_housing,
                pmi_monthly, term_years
            )
        
        # Generate AI response
        prompt = _build_prompt(
            monthly_income, monthly_housing, other_needs, is_affordable,
            housing_pct_of_income, needs_budget_50, remaining_needs_after_housing,
            pmi_monthly, term_years
        )
        
        ai_response: AIResponse = provider.generate(
            prompt=prompt,
            temperature=settings.ai_temperature,
            max_tokens=settings.ai_max_tokens,
        )
        
        # Parse response
        narrative, suggestions = _parse_ai_response(ai_response.content)
        
        # Validate we got useful output
        if not narrative or not suggestions:
            print("⚠️  AI returned incomplete response, falling back to rule-based")
            return _generate_rule_based_response(
                monthly_income, monthly_housing, other_needs, is_affordable,
                housing_pct_of_income, needs_budget_50, remaining_needs_after_housing,
                pmi_monthly, term_years
            )
        
        return ExplainResult(
            narrative=narrative,
            suggestions=suggestions,
            provider=ai_response.provider,
            model=ai_response.model,
            tokens_used=ai_response.tokens_used,
        )
    
    except Exception as e:
        # Any error: fallback to rule-based
        print(f"⚠️  AI provider error: {e}, using rule-based fallback")
        return _generate_rule_based_response(
            monthly_income, monthly_housing, other_needs, is_affordable,
            housing_pct_of_income, needs_budget_50, remaining_needs_after_housing,
            pmi_monthly, term_years
        )

