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
        description="Maintenance as % of home value per year (e.g. 0.5 for 0.5%)",
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
