"""Pydantic schemas for AI API."""
from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """Summary of scenario + affordability result for AI explanation."""
    monthly_income: float = Field(..., gt=0)
    monthly_housing: float = Field(..., ge=0)
    other_needs: float = Field(..., ge=0)
    is_affordable: bool
    housing_pct_of_income: float = Field(..., ge=0)
    needs_budget_50: float = Field(..., ge=0)
    remaining_needs_after_housing: float = Field(...)
    pmi_monthly: float = Field(default=0, ge=0)
    term_years: int = Field(default=30, gt=0)


class ExplainResponse(BaseModel):
    """AI-generated explanation with provider metadata."""
    narrative: str
    suggestions: list[str]
    provider: str = "mock"  # "openai", "groq", "anthropic", or "mock"
    model: str = "rule-based"  # Specific model used
    tokens_used: int = 0  # For cost tracking and monitoring

