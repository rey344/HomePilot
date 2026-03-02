"""Pydantic schemas for AI API."""
from pydantic import BaseModel, Field


class ExplainRequest(BaseModel):
    """Summary of scenario + affordability result for AI explanation."""
    monthly_income: float = Field(..., gt=0)
    monthly_housing: float = Field(..., ge=0)
    is_affordable: bool
    housing_pct_of_income: float = Field(..., ge=0)
    needs_budget_50: float = Field(..., ge=0)
    remaining_needs_after_housing: float = Field(...)


class ExplainResponse(BaseModel):
    narrative: str
    suggestions: list[str]
