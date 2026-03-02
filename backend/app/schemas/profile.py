"""Pydantic schemas for profile / affordability API."""
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


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


class ScenarioUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    home_value: Decimal | None = None
    down_payment: Decimal | None = None
    annual_rate_pct: Decimal | None = None
    term_years: int | None = None
    annual_property_tax_pct: Decimal | None = None
    annual_insurance_pct: Decimal | None = None
    hoa_monthly: Decimal | None = None
    maintenance_monthly_pct: Decimal | None = None
    monthly_take_home_income: Decimal | None = None
    other_monthly_needs: Decimal | None = None


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
