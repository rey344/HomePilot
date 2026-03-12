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
    risk_summary: str | None = Field(default=None, description="Optional: risk indicators and warnings from analysis")
    projection_summary: str | None = Field(default=None, description="Optional: 5-year equity/projection summary")


class ExplainResponse(BaseModel):
    """AI-generated explanation with provider metadata."""
    summary: str = ""  # One-line takeaway
    narrative: str
    suggestions: list[str]
    provider: str = "mock"
    model: str = "rule-based"
    tokens_used: int = 0


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ScenarioContext(BaseModel):
    """Current scenario summary for the chat advisor."""
    home_value: float = Field(..., ge=0)
    down_payment: float = Field(..., ge=0)
    monthly_payment_total: float = Field(..., ge=0)
    monthly_income: float = Field(..., gt=0)
    is_affordable: bool = False
    housing_pct_of_income: float = Field(..., ge=0)
    risk_summary: str | None = None
    projection_summary: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., max_length=20)
    scenario_context: ScenarioContext


class ChatResponse(BaseModel):
    message: ChatMessage
    provider: str = "mock"
    model: str = "rule-based"
    tokens_used: int = 0

