"""Calculation API – PITI, PMI, amortization."""
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.calculation_engine import amortization_schedule, monthly_payment, monthly_piti_full, monthly_pmi
from app.schemas.calc import (
    AmortizationResponse,
    AmortizationRowResponse,
    LoanTermsRequest,
    PitiResponse,
)

router = APIRouter()


@router.post("/piti", response_model=PitiResponse)
def compute_piti(req: LoanTermsRequest) -> PitiResponse:
    """
    Compute full monthly housing cost: PITI + PMI + HOA + maintenance.
    """
    loan_amount = req.loan_amount
    if loan_amount <= 0:
        raise HTTPException(status_code=400, detail="Loan amount must be positive (down payment < home value)")

    p_i = monthly_payment(loan_amount, req.annual_rate_pct, req.term_years)
    tax = (req.home_value * req.annual_property_tax_pct / 100 / 12).quantize(Decimal("0.01"))
    insurance = (req.home_value * req.annual_insurance_pct / 100 / 12).quantize(Decimal("0.01"))
    piti_total = monthly_piti_full(
        req.home_value,
        loan_amount,
        req.annual_rate_pct,
        req.term_years,
        req.annual_property_tax_pct,
        req.annual_insurance_pct,
    )
    pmi = monthly_pmi(loan_amount, req.home_value)
    maintenance = (req.home_value * req.maintenance_monthly_pct / 100 / 12).quantize(Decimal("0.01"))

    total = piti_total + pmi + req.hoa_monthly + maintenance

    return PitiResponse(
        principal_and_interest=p_i,
        property_tax_monthly=tax,
        insurance_monthly=insurance,
        piti_total=piti_total,
        pmi_monthly=pmi,
        hoa_monthly=req.hoa_monthly,
        maintenance_monthly=maintenance,
        total_monthly=total,
    )


@router.post("/amortization", response_model=AmortizationResponse)
def compute_amortization(req: LoanTermsRequest, max_months: int | None = 360) -> AmortizationResponse:
    """
    Return amortization schedule for the loan. Optional max_months to limit response size.
    """
    loan_amount = req.loan_amount
    if loan_amount <= 0:
        raise HTTPException(status_code=400, detail="Loan amount must be positive")

    payment = monthly_payment(loan_amount, req.annual_rate_pct, req.term_years)
    rows = amortization_schedule(loan_amount, req.annual_rate_pct, req.term_years, max_months=max_months)

    return AmortizationResponse(
        monthly_payment=payment,
        schedule=[AmortizationRowResponse(month=r.month, payment=r.payment, principal=r.principal, interest=r.interest, balance=r.balance) for r in rows],
        total_months=len(rows),
    )
