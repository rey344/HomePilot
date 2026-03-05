"""AI API – explanations and coaching with real LLM integration."""
from fastapi import APIRouter

from app.ai_services.explain import explain_affordability
from app.schemas.ai import ExplainRequest, ExplainResponse

router = APIRouter()


@router.post("/explain", response_model=ExplainResponse)
def post_explain(req: ExplainRequest) -> ExplainResponse:
    """
    Get AI-generated narrative and suggestions for affordability result.
    
    Uses real AI providers (OpenAI, Groq, Anthropic) if configured,
    with automatic fallback to rule-based mock responses.
    
    Set GROQ_API_KEY or OPENAI_API_KEY environment variable to enable AI.
    """
    result = explain_affordability(
        monthly_income=req.monthly_income,
        monthly_housing=req.monthly_housing,
        other_needs=req.other_needs,
        is_affordable=req.is_affordable,
        housing_pct_of_income=req.housing_pct_of_income,
        needs_budget_50=req.needs_budget_50,
        remaining_needs_after_housing=req.remaining_needs_after_housing,
        pmi_monthly=req.pmi_monthly,
        term_years=req.term_years,
    )
    return ExplainResponse(
        narrative=result.narrative,
        suggestions=result.suggestions,
        provider=result.provider,
        model=result.model,
        tokens_used=result.tokens_used,
    )

