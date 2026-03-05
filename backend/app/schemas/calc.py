"""Pydantic schemas for calculation API."""
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class LoanTermsRequest(BaseModel):
    home_value: Decimal = Field(..., gt=0, description="Purchase price / value of home")
    down_payment: Decimal = Field(..., ge=0, description="Down payment amount")
    annual_rate_pct: Decimal = Field(..., ge=0, le=30, description="Interest rate %")
    term_years: int = Field(..., ge=1, le=30, description="Loan term in years")
    annual_property_tax_pct: Decimal = Field(..., ge=0, le=10, description="Property tax % of value per year")
    annual_insurance_pct: Decimal = Field(..., ge=0, le=5, description="Homeowners insurance % of value per year")
    hoa_monthly: Decimal = Field(default=Decimal("0"), ge=0, description="Monthly HOA")
    maintenance_monthly_pct: Decimal = Field(
        default=Decimal("0.1"),
        ge=0,
        le=5,
        description="Annual maintenance as % of home value per year (e.g. 0.5 for 0.5%/year)",
    )

    @model_validator(mode="after")
    def down_payment_less_than_home_value(self) -> "LoanTermsRequest":
        if self.down_payment >= self.home_value:
            raise ValueError("Down payment must be less than home value.")
        return self

    @property
    def loan_amount(self) -> Decimal:
        return self.home_value - self.down_payment


class PitiResponse(BaseModel):
    principal_and_interest: Decimal
    property_tax_monthly: Decimal
    insurance_monthly: Decimal
    piti_total: Decimal
    pmi_monthly: Decimal
    hoa_monthly: Decimal
    maintenance_monthly: Decimal
    total_monthly: Decimal


class AmortizationRowResponse(BaseModel):
    month: int
    payment: Decimal
    principal: Decimal
    interest: Decimal
    balance: Decimal


class AmortizationResponse(BaseModel):
    monthly_payment: Decimal
    schedule: list[AmortizationRowResponse]
    total_months: int


class CostBreakdown(BaseModel):
    """Detailed breakdown of monthly housing costs."""
    principal_and_interest: Decimal
    property_tax: Decimal
    insurance: Decimal
    pmi: Decimal
    hoa: Decimal
    maintenance: Decimal
    total: Decimal


class RiskIndicatorResponse(BaseModel):
    """Individual risk indicator."""
    level: str  # "safe", "moderate", "high"
    message: str
    value: Decimal
    threshold: Decimal


class RiskAnalysisResponse(BaseModel):
    """Financial risk assessment."""
    overall_risk: str  # "low", "moderate", "high"
    indicators: list[RiskIndicatorResponse]
    warnings: list[str]
    strengths: list[str]


class YearProjectionResponse(BaseModel):
    """Projection for a single year."""
    year: int
    home_value: Decimal
    loan_balance: Decimal
    equity: Decimal
    cumulative_interest_paid: Decimal
    cumulative_principal_paid: Decimal


class FiveYearProjectionResponse(BaseModel):
    """5-year home ownership projection."""
    initial_home_value: Decimal
    projected_home_value: Decimal
    home_value_increase: Decimal
    home_value_increase_pct: Decimal
    
    initial_loan_balance: Decimal
    projected_loan_balance: Decimal
    principal_paid: Decimal
    
    initial_equity: Decimal
    projected_equity: Decimal
    equity_increase: Decimal
    
    total_interest_paid: Decimal
    total_payments: Decimal
    
    net_worth_change: Decimal
    
    annual_appreciation_rate: Decimal
    
    yearly_details: list[YearProjectionResponse]


class EnhancedLoanAnalysisRequest(BaseModel):
    """Enhanced request that includes income for risk analysis."""
    home_value: Decimal = Field(..., gt=0)
    down_payment: Decimal = Field(..., ge=0)
    annual_rate_pct: Decimal = Field(..., ge=0, le=30)
    term_years: int = Field(..., ge=1, le=30)
    annual_property_tax_pct: Decimal = Field(..., ge=0, le=10)
    annual_insurance_pct: Decimal = Field(..., ge=0, le=5)
    hoa_monthly: Decimal = Field(default=Decimal("0"), ge=0)
    maintenance_monthly_pct: Decimal = Field(default=Decimal("0.1"), ge=0, le=5)
    
    # Additional fields for risk analysis
    monthly_gross_income: Decimal = Field(..., gt=0, description="Monthly gross income before taxes")
    monthly_take_home_income: Decimal = Field(..., gt=0, description="Monthly take-home income after taxes")
    monthly_debt_payments: Decimal = Field(default=Decimal("0"), ge=0, description="Other monthly debt payments")
    other_monthly_needs: Decimal = Field(default=Decimal("0"), ge=0, description="Other essential expenses")
    
    @model_validator(mode="after")
    def down_payment_less_than_home_value(self) -> "EnhancedLoanAnalysisRequest":
        if self.down_payment >= self.home_value:
            raise ValueError("Down payment must be less than home value.")
        return self

    @property
    def loan_amount(self) -> Decimal:
        return self.home_value - self.down_payment


class EnhancedLoanAnalysisResponse(BaseModel):
    """Complete loan analysis with costs, risks, and projections."""
    cost_breakdown: CostBreakdown
    risk_analysis: RiskAnalysisResponse
    five_year_projection: FiveYearProjectionResponse
    affordability: dict  # Similar to AffordabilityResponse fields
