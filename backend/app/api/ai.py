"""AI API – explanations, coaching, and scenario-aware chat with real LLM integration."""
from fastapi import APIRouter

from app.ai_services.explain import explain_affordability
from app.ai_services.chat import chat as chat_service
from app.schemas.ai import (
    ExplainRequest,
    ExplainResponse,
    ChatRequest,
    ChatResponse,
)

router = APIRouter()


@router.post("/explain", response_model=ExplainResponse)
def post_explain(req: ExplainRequest) -> ExplainResponse:
    """
    Get AI-generated narrative and suggestions for affordability result.
    Optionally include risk_summary and projection_summary for richer analysis.
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
        risk_summary=req.risk_summary,
        projection_summary=req.projection_summary,
    )
    return ExplainResponse(
        summary=result.summary,
        narrative=result.narrative,
        suggestions=result.suggestions,
        provider=result.provider,
        model=result.model,
        tokens_used=result.tokens_used,
    )


@router.post("/chat", response_model=ChatResponse)
def post_chat(req: ChatRequest) -> ChatResponse:
    """
    Scenario-aware chat: ask questions about your numbers, affordability, risk, next steps.
    The advisor has context (home value, payment, income, risk, 5-year projection).
    """
    return chat_service(req.messages, req.scenario_context)

