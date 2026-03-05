"""
Financial risk analysis for home affordability.
Implements industry-standard risk thresholds and warnings.
"""
from decimal import Decimal
from typing import NamedTuple


class RiskIndicator(NamedTuple):
    """Individual risk indicator."""
    level: str  # "safe", "moderate", "high"
    message: str
    value: Decimal
    threshold: Decimal


class RiskAnalysis(NamedTuple):
    """Complete risk analysis result."""
    overall_risk: str  # "low", "moderate", "high"
    indicators: list[RiskIndicator]
    warnings: list[str]
    strengths: list[str]


def analyze_risks(
    monthly_gross_income: Decimal,
    monthly_take_home_income: Decimal,
    monthly_housing_cost: Decimal,
    monthly_debt_payments: Decimal,
    home_value: Decimal,
    loan_amount: Decimal,
    remaining_needs_budget: Decimal,
    total_interest_paid: Decimal | None = None,
    pmi_months: int | None = None,
) -> RiskAnalysis:
    """
    Analyze financial risks for home purchase.
    
    Implements industry-standard thresholds:
    - Housing ratio (front-end DTI): ≤ 28% is safe, >35% is risky
    - Total DTI (back-end): ≤ 36% is safe, >43% is risky
    - Housing share of take-home: ≤ 30% is good, >40% is high risk
    - LTV ratio: ≤ 80% is safe, >90% is risky
    - Remaining needs budget: < $500 is concerning
    
    Args:
        monthly_gross_income: Monthly gross income before taxes
        monthly_take_home_income: Monthly take-home after taxes
        monthly_housing_cost: Total housing payment (PITI + HOA + maintenance)
        monthly_debt_payments: Other debt payments
        home_value: Purchase price of home
        loan_amount: Mortgage loan amount
        remaining_needs_budget: Money left after housing in 50% needs bucket
        total_interest_paid: Total interest over loan term (optional)
        pmi_months: Number of months PMI will be paid (optional)
    
    Returns:
        RiskAnalysis with overall assessment and specific indicators
    """
    indicators = []
    warnings = []
    strengths = []
    
    # 1. Front-End DTI (Housing Ratio)
    if monthly_gross_income > 0:
        housing_ratio = (monthly_housing_cost / monthly_gross_income * 100).quantize(Decimal("0.1"))
        if housing_ratio <= 28:
            level = "safe"
            strengths.append("Housing cost within recommended 28% guideline")
        elif housing_ratio <= 35:
            level = "moderate"
            warnings.append(f"Housing consumes {housing_ratio}% of gross income (ideal ≤ 28%)")
        else:
            level = "high"
            warnings.append(f"Housing ratio {housing_ratio}% exceeds recommended 35% maximum")
        
        indicators.append(RiskIndicator(
            level=level,
            message=f"Housing ratio: {housing_ratio}% of gross income",
            value=housing_ratio,
            threshold=Decimal("28"),
        ))
    
    # 2. Back-End DTI (Total Debt Ratio)
    if monthly_gross_income > 0:
        total_dti = ((monthly_housing_cost + monthly_debt_payments) / monthly_gross_income * 100).quantize(Decimal("0.1"))
        if total_dti <= 36:
            level = "safe"
            strengths.append("Total debt ratio within lending standards")
        elif total_dti <= 43:
            level = "moderate"
            warnings.append(f"Total DTI {total_dti}% exceeds recommended 36% (lenders may cap at 43%)")
        else:
            level = "high"
            warnings.append(f"Total DTI {total_dti}% exceeds typical lending maximum of 43%")
        
        indicators.append(RiskIndicator(
            level=level,
            message=f"Total DTI: {total_dti}% (housing + other debts)",
            value=total_dti,
            threshold=Decimal("36"),
        ))
    
    # 3. Housing Share of Take-Home Income
    if monthly_take_home_income > 0:
        takehome_pct = (monthly_housing_cost / monthly_take_home_income * 100).quantize(Decimal("0.1"))
        if takehome_pct <= 30:
            level = "safe"
            strengths.append("Housing leaves flexibility in budget")
        elif takehome_pct <= 40:
            level = "moderate"
            warnings.append(f"Housing consumes {takehome_pct}% of take-home income (ideal ≤ 30%)")
        else:
            level = "high"
            warnings.append(f"Housing consumes {takehome_pct}% of take-home, limiting flexibility")
        
        indicators.append(RiskIndicator(
            level=level,
            message=f"Housing share: {takehome_pct}% of take-home income",
            value=takehome_pct,
            threshold=Decimal("30"),
        ))
    
    # 4. Loan-to-Value (LTV)
    if home_value > 0:
        ltv = (loan_amount / home_value * 100).quantize(Decimal("0.1"))
        if ltv <= 80:
            level = "safe"
            strengths.append("Loan-to-value ratio avoids PMI requirement")
        elif ltv <= 90:
            level = "moderate"
            warnings.append(f"LTV {ltv}% requires PMI (ideal ≤ 80%)")
        else:
            level = "high"
            warnings.append(f"LTV {ltv}% indicates high leverage and increased risk")
        
        indicators.append(RiskIndicator(
            level=level,
            message=f"Loan-to-value: {ltv}%",
            value=ltv,
            threshold=Decimal("80"),
        ))
    
    # 5. Remaining Needs Budget
    if remaining_needs_budget < 500:
        level = "high"
        warnings.append(f"Only ${remaining_needs_budget:.0f} remaining in needs budget for emergencies")
        indicators.append(RiskIndicator(
            level=level,
            message=f"Remaining needs budget: ${remaining_needs_budget:.0f}",
            value=remaining_needs_budget,
            threshold=Decimal("500"),
        ))
    else:
        strengths.append(f"Sufficient buffer (${remaining_needs_budget:.0f}) for unexpected costs")
    
    # 6. PMI Duration Warning (if applicable)
    if pmi_months and pmi_months > 0:
        years = pmi_months / 12
        if years > 5:
            warnings.append(f"PMI will remain active for approximately {years:.1f} years")
    
    # 7. Interest Burden (if provided)
    if total_interest_paid and loan_amount > 0:
        interest_ratio = (total_interest_paid / loan_amount * 100).quantize(Decimal("0.1"))
        if interest_ratio > 100:
            warnings.append(f"Total interest (${total_interest_paid:,.0f}) exceeds loan amount")
    
    # Determine overall risk level
    high_risk_count = sum(1 for ind in indicators if ind.level == "high")
    moderate_risk_count = sum(1 for ind in indicators if ind.level == "moderate")
    
    if high_risk_count >= 2:
        overall_risk = "high"
    elif high_risk_count >= 1 or moderate_risk_count >= 2:
        overall_risk = "moderate"
    else:
        overall_risk = "low"
    
    return RiskAnalysis(
        overall_risk=overall_risk,
        indicators=indicators,
        warnings=warnings,
        strengths=strengths,
    )
