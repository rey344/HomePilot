"""Calculation API – PITI, PMI, amortization."""
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.calculation_engine import amortization_schedule, monthly_payment, monthly_piti_full, monthly_pmi
from app.profile_modeling.affordability import affordability_503020
from app.profile_modeling.risk_analysis import analyze_risks
from app.profile_modeling.projection import calculate_five_year_projection
from app.schemas.calc import (
    AmortizationResponse,
    AmortizationRowResponse,
    CostBreakdown,
    EnhancedLoanAnalysisRequest,
    EnhancedLoanAnalysisResponse,
    FiveYearProjectionResponse,
    LoanTermsRequest,
    PitiResponse,
    RiskAnalysisResponse,
    RiskIndicatorResponse,
    YearProjectionResponse,
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

    total = (piti_total + pmi + req.hoa_monthly + maintenance).quantize(Decimal("0.01"))

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


@router.post("/analyze", response_model=EnhancedLoanAnalysisResponse)
def analyze_loan(req: EnhancedLoanAnalysisRequest) -> EnhancedLoanAnalysisResponse:
    """
    Complete loan analysis with cost breakdown, risk assessment, and 5-year projection.
    
    This endpoint provides:
    - Detailed monthly cost breakdown
    - Financial risk analysis with industry-standard thresholds
    - 5-year projection of equity, home value, and payments
    - Affordability assessment using 50/30/20 rule
    """
    loan_amount = req.loan_amount
    if loan_amount <= 0:
        raise HTTPException(status_code=400, detail="Loan amount must be positive")
    
    # Calculate monthly costs
    p_i = monthly_payment(loan_amount, req.annual_rate_pct, req.term_years)
    tax = (req.home_value * req.annual_property_tax_pct / Decimal("100") / Decimal("12")).quantize(Decimal("0.01"))
    insurance = (req.home_value * req.annual_insurance_pct / Decimal("100") / Decimal("12")).quantize(Decimal("0.01"))
    pmi = monthly_pmi(loan_amount, req.home_value)
    maintenance = (req.home_value * req.maintenance_monthly_pct / Decimal("100") / Decimal("12")).quantize(Decimal("0.01"))
    
    total_monthly = (p_i + tax + insurance + pmi + req.hoa_monthly + maintenance).quantize(Decimal("0.01"))
    
    # Cost breakdown
    cost_breakdown = CostBreakdown(
        principal_and_interest=p_i,
        property_tax=tax,
        insurance=insurance,
        pmi=pmi,
        hoa=req.hoa_monthly,
        maintenance=maintenance,
        total=total_monthly,
    )
    
    # Affordability check (50/30/20 rule)
    affordability_result = affordability_503020(
        monthly_take_home_income=req.monthly_take_home_income,
        monthly_housing_cost=total_monthly,
        other_monthly_needs=req.other_monthly_needs,
    )
    
    # Calculate total interest over loan term
    total_interest = Decimal("0")
    schedule = amortization_schedule(loan_amount, req.annual_rate_pct, req.term_years)
    for row in schedule:
        total_interest += row.interest
    
    # Calculate PMI months (when will LTV reach 80%?)
    ltv = (loan_amount / req.home_value * Decimal("100")).quantize(Decimal("0.1"))
    pmi_months = 0
    if ltv > 80:
        # Approximate: how many months until principal paid reaches 20% of home value
        target_principal = req.home_value * Decimal("0.20")
        cumulative_principal = Decimal("0")
        for row in schedule:
            if cumulative_principal >= target_principal:
                break
            cumulative_principal += row.principal
            pmi_months += 1
    
    # Risk analysis
    risk_result = analyze_risks(
        monthly_gross_income=req.monthly_gross_income,
        monthly_take_home_income=req.monthly_take_home_income,
        monthly_housing_cost=total_monthly,
        monthly_debt_payments=req.monthly_debt_payments,
        home_value=req.home_value,
        loan_amount=loan_amount,
        remaining_needs_budget=affordability_result.remaining_needs_after_housing,
        total_interest_paid=total_interest,
        pmi_months=pmi_months if pmi_months > 0 else None,
    )
    
    risk_analysis = RiskAnalysisResponse(
        overall_risk=risk_result.overall_risk,
        indicators=[
            RiskIndicatorResponse(
                level=ind.level,
                message=ind.message,
                value=ind.value,
                threshold=ind.threshold,
            )
            for ind in risk_result.indicators
        ],
        warnings=risk_result.warnings,
        strengths=risk_result.strengths,
    )
    
    # 5-year projection
    projection_result = calculate_five_year_projection(
        home_value=req.home_value,
        loan_amount=loan_amount,
        monthly_payment=p_i,  # P&I only for projection
        annual_interest_rate=req.annual_rate_pct,
        annual_appreciation_rate=Decimal("3.0"),  # 3% default
    )
    
    five_year_projection = FiveYearProjectionResponse(
        initial_home_value=projection_result.initial_home_value,
        projected_home_value=projection_result.projected_home_value,
        home_value_increase=projection_result.home_value_increase,
        home_value_increase_pct=projection_result.home_value_increase_pct,
        initial_loan_balance=projection_result.initial_loan_balance,
        projected_loan_balance=projection_result.projected_loan_balance,
        principal_paid=projection_result.principal_paid,
        initial_equity=projection_result.initial_equity,
        projected_equity=projection_result.projected_equity,
        equity_increase=projection_result.equity_increase,
        total_interest_paid=projection_result.total_interest_paid,
        total_payments=projection_result.total_payments,
        net_worth_change=projection_result.net_worth_change,
        annual_appreciation_rate=projection_result.annual_appreciation_rate,
        yearly_details=[
            YearProjectionResponse(
                year=yd.year,
                home_value=yd.home_value,
                loan_balance=yd.loan_balance,
                equity=yd.equity,
                cumulative_interest_paid=yd.cumulative_interest_paid,
                cumulative_principal_paid=yd.cumulative_principal_paid,
            )
            for yd in projection_result.yearly_details
        ],
    )
    
    return EnhancedLoanAnalysisResponse(
        cost_breakdown=cost_breakdown,
        risk_analysis=risk_analysis,
        five_year_projection=five_year_projection,
        affordability={
            "monthly_income": float(affordability_result.monthly_income),
            "needs_budget_50": float(affordability_result.needs_budget_50),
            "wants_budget_30": float(affordability_result.wants_budget_30),
            "savings_budget_20": float(affordability_result.savings_budget_20),
            "monthly_housing": float(affordability_result.monthly_housing),
            "other_needs": float(affordability_result.other_needs),
            "remaining_needs_after_housing": float(affordability_result.remaining_needs_after_housing),
            "housing_pct_of_income": float(affordability_result.housing_pct_of_income),
            "is_affordable": affordability_result.is_affordable,
            "message": affordability_result.message,
        },
    )
