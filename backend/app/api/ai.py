"""AI API – explanations and coaching."""
from fastapi import APIRouter

from app.ai_services.explain import explain_affordability
from app.schemas.ai import ExplainRequest, ExplainResponse

router = APIRouter()


@router.post("/explain", response_model=ExplainResponse)
def post_explain(req: ExplainRequest) -> ExplainResponse:
    """
    Get a short narrative and suggestions for the given affordability result.
    Uses a stub implementation; can be wired to an LLM provider via env.
    """
    result = explain_affordability(
        monthly_income=req.monthly_income,
        monthly_housing=req.monthly_housing,
        is_affordable=req.is_affordable,
        housing_pct_of_income=req.housing_pct_of_income,
        needs_budget_50=req.needs_budget_50,
        remaining_needs_after_housing=req.remaining_needs_after_housing,
    )
    return ExplainResponse(narrative=result.narrative, suggestions=result.suggestions)
