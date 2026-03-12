"""
AI-generated explanation of affordability result.
Integrates with Groq AI (free, fast Llama models) with fallback to rule-based mock.
"""
import json
from dataclasses import dataclass
from app.config import settings
from app.ai_services.providers import get_ai_provider, AIResponse


@dataclass
class ExplainResult:
    summary: str  # One-line takeaway
    narrative: str
    suggestions: list[str]
    provider: str = "mock"
    model: str = "rule-based"
    tokens_used: int = 0


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
    risk_summary: str | None = None,
    projection_summary: str | None = None,
) -> str:
    """Build a structured prompt for the AI with benchmarks and optional risk/projection."""
    total_needs = monthly_housing + other_needs
    prompt = f"""You are a sharp financial advisor. Analyze this homebuying scenario using standard benchmarks.

**Benchmarks to reference when relevant:**
- Front-end DTI (housing / gross): lenders prefer ≤28%, max often 35%.
- 50/30/20: 50% needs, 30% wants, 20% savings. Housing belongs in the 50% needs bucket.
- Emergency fund: 3–6 months of expenses; tight remaining-needs budget is a risk.

**Their numbers:**
- Monthly take-home: ${monthly_income:,.2f} → 50% needs budget = ${needs_budget_50:,.2f}
- Monthly housing (PITI + HOA + maintenance): ${monthly_housing:,.2f} ({housing_pct_of_income:.1f}% of take-home)
- Other monthly needs: ${other_needs:,.2f}
- Total needs used: ${total_needs:,.2f}; remaining in needs bucket: ${remaining_needs_after_housing:,.2f}
- PMI: ${pmi_monthly:,.2f}/month | Term: {term_years} years
- 50/30/20 affordable: {"Yes" if is_affordable else "No"}

"""
    if risk_summary:
        prompt += f"**Risk analysis (use this):**\n{risk_summary}\n\n"
    if projection_summary:
        prompt += f"**5-year projection (use if relevant):**\n{projection_summary}\n\n"

    prompt += """**Your task — keep output structured and easy to read:**

1. **summary** (one short sentence): The main takeaway, e.g. "This scenario is affordable but leaves little buffer" or "Housing cost is over the recommended limit."
2. **narrative** (2–3 short paragraphs): Use exactly two newlines (\\n\\n) between paragraphs. First paragraph: is it sound or stretched? Reference one benchmark (DTI, 50/30/20, or remaining needs). Second paragraph (optional): one concrete point from risk or 5-year projection if provided.
3. **suggestions**: Array of 3–4 clear action items. Start each with a verb, e.g. "Increase down payment to…", "Aim for a home price under…". One item per array element.

Return valid JSON only (no markdown, no code fence):
{
  "summary": "One sentence takeaway.",
  "narrative": "First paragraph here.\\n\\nSecond paragraph if needed.",
  "suggestions": ["First action.", "Second action.", "Third action."]
}"""
    return prompt


def _parse_ai_response(content: str) -> tuple[str, str, list[str]]:
    """Parse AI response; returns (summary, narrative, suggestions)."""
    try:
        data = json.loads(content)
        summary = data.get("summary") or ""
        narrative = data.get("narrative") or ""
        suggestions = data.get("suggestions") or []
        return summary, narrative, suggestions
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
        
        return "", narrative, suggestions


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
    
    summary = "Your scenario fits the 50/30/20 needs budget." if is_affordable else "Housing and needs exceed the 50% budget."
    return ExplainResult(
        summary=summary,
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
    risk_summary: str | None = None,
    projection_summary: str | None = None,
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
            pmi_monthly, term_years,
            risk_summary=risk_summary,
            projection_summary=projection_summary,
        )
        
        ai_response: AIResponse = provider.generate(
            prompt=prompt,
            temperature=settings.ai_temperature,
            max_tokens=settings.ai_max_tokens,
        )
        
        summary, narrative, suggestions = _parse_ai_response(ai_response.content)
        if not narrative or not suggestions:
            print("⚠️  AI returned incomplete response, falling back to rule-based")
            return _generate_rule_based_response(
                monthly_income, monthly_housing, other_needs, is_affordable,
                housing_pct_of_income, needs_budget_50, remaining_needs_after_housing,
                pmi_monthly, term_years
            )
        return ExplainResult(
            summary=summary or "See analysis below.",
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

