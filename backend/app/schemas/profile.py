"""Pydantic schemas for profile / affordability API."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator


class ScenarioCreate(BaseModel):
    name: str = Field(default="Untitled scenario", max_length=255)
    home_value: Decimal = Field(..., gt=0)
    down_payment: Decimal = Field(..., ge=0)
    annual_rate_pct: Decimal = Field(..., ge=0, le=30)
    term_years: int = Field(..., ge=1, le=30)
    annual_property_tax_pct: Decimal = Field(..., ge=0, le=10)
    annual_insurance_pct: Decimal = Field(..., ge=0, le=5)
    hoa_monthly: Decimal = Field(default=Decimal("0"), ge=0)
    maintenance_monthly_pct: Decimal = Field(default=Decimal("0.1"), ge=0, le=5)
    monthly_take_home_income: Decimal = Field(..., gt=0)
    other_monthly_needs: Decimal = Field(default=Decimal("0"), ge=0)

    @model_validator(mode="after")
    def validate_down_payment(self) -> "ScenarioCreate":
        if self.down_payment >= self.home_value:
            raise ValueError("Down payment must be less than home value.")
        return self


class ScenarioUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    home_value: Decimal | None = Field(default=None, gt=0)
    down_payment: Decimal | None = Field(default=None, ge=0)
    annual_rate_pct: Decimal | None = Field(default=None, ge=0, le=30)
    term_years: int | None = Field(default=None, ge=1, le=30)
    annual_property_tax_pct: Decimal | None = Field(default=None, ge=0, le=10)
    annual_insurance_pct: Decimal | None = Field(default=None, ge=0, le=5)
    hoa_monthly: Decimal | None = Field(default=None, ge=0)
    maintenance_monthly_pct: Decimal | None = Field(default=None, ge=0, le=5)
    monthly_take_home_income: Decimal | None = Field(default=None, gt=0)
    other_monthly_needs: Decimal | None = Field(default=None, ge=0)


class ScenarioResponse(BaseModel):
    id: int
    name: str
    home_value: Decimal
    down_payment: Decimal
    annual_rate_pct: Decimal
    term_years: int
    annual_property_tax_pct: Decimal
    annual_insurance_pct: Decimal
    hoa_monthly: Decimal
    maintenance_monthly_pct: Decimal
    monthly_take_home_income: Decimal
    other_monthly_needs: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AffordabilityRequest(BaseModel):
    monthly_take_home_income: Decimal = Field(..., gt=0, description="Monthly take-home income")
    monthly_housing_cost: Decimal = Field(..., ge=0, description="Total monthly housing (PITI + PMI + HOA + maintenance)")
    other_monthly_needs: Decimal = Field(default=Decimal("0"), ge=0, description="Other fixed needs (utilities, groceries, insurance, etc.)")


class AffordabilityResponse(BaseModel):
    monthly_income: Decimal
    needs_budget_50: Decimal
    wants_budget_30: Decimal
    savings_budget_20: Decimal
    monthly_housing: Decimal
    other_needs: Decimal
    remaining_needs_after_housing: Decimal
    housing_pct_of_income: Decimal
    is_affordable: bool
    message: str


class HomeRecommendationRequest(BaseModel):
    monthly_gross_income: Decimal = Field(..., gt=0, description="Monthly gross income before taxes")
    monthly_debt_payments: Decimal = Field(default=Decimal("0"), ge=0, description="Other debt payments (car, student loans, etc.)")
    down_payment_pct: Decimal = Field(default=Decimal("20"), ge=0, le=100, description="Down payment percentage (e.g., 20 for 20%)")
    interest_rate: Decimal = Field(
        default=Decimal("6.5"), 
        ge=0, 
        le=30, 
        description="Annual interest rate (e.g., 6.5 for 6.5%). Leave empty to use current market rate from FRED API"
    )
    term_years: int = Field(default=30, ge=1, le=30, description="Loan term in years")
    property_tax_rate: Decimal = Field(default=Decimal("1.2"), ge=0, le=10, description="Annual property tax rate as percentage")
    insurance_pct: Decimal = Field(default=Decimal("0.35"), ge=0, le=5, description="Annual insurance as percentage of home value")
    hoa_monthly: Decimal = Field(default=Decimal("0"), ge=0, description="Monthly HOA fees")


class HomeRecommendationResponse(BaseModel):
    recommended_price: Decimal
    maximum_price: Decimal
    safe_min_price: Decimal
    safe_max_price: Decimal
    monthly_payment_at_recommended: Decimal
    monthly_payment_at_maximum: Decimal
    assumptions: dict
