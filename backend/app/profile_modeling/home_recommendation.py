"""
Calculate recommended home price based on income and financial profile.
"""
from decimal import Decimal
from typing import NamedTuple


class HomeRecommendation(NamedTuple):
    """Recommended home prices based on affordability analysis."""
    recommended_price: Decimal  # Safe conservative price (28% rule)
    maximum_price: Decimal  # Stretch maximum (35% rule)
    safe_min_price: Decimal  # Lower safe range
    safe_max_price: Decimal  # Upper safe range
    monthly_payment_at_recommended: Decimal
    monthly_payment_at_maximum: Decimal
    assumptions: dict  # Interest rate, down payment %, etc.


def calculate_home_recommendation(
    monthly_gross_income: Decimal,
    monthly_debt_payments: Decimal = Decimal("0"),
    down_payment_pct: Decimal = Decimal("20"),
    interest_rate: Decimal = Decimal("6.5"),
    term_years: int = 30,
    property_tax_rate: Decimal = Decimal("1.2"),
    insurance_pct: Decimal = Decimal("0.35"),
    hoa_monthly: Decimal = Decimal("0"),
) -> HomeRecommendation:
    """
    Calculate recommended home price based on income.
    
    Uses industry-standard rules:
    - 28% rule: Housing costs should be ≤ 28% of gross monthly income (recommended)
    - 35% rule: Can stretch to 35% but risky (maximum)
    - Safe range: 20-28% of gross income
    
    Args:
        monthly_gross_income: Monthly gross income before taxes
        monthly_debt_payments: Other debt payments (car, student loans, credit cards)
        down_payment_pct: Down payment as percentage (e.g., 20 for 20%)
        interest_rate: Annual interest rate percentage (e.g., 6.5 for 6.5%)
        term_years: Loan term in years
        property_tax_rate: Annual property tax as percentage of home value
        insurance_pct: Annual insurance as percentage of home value
        hoa_monthly: Monthly HOA fees
    
    Returns:
        HomeRecommendation with price ranges and payment estimates
    """
    if monthly_gross_income <= 0:
        return HomeRecommendation(
            recommended_price=Decimal("0"),
            maximum_price=Decimal("0"),
            safe_min_price=Decimal("0"),
            safe_max_price=Decimal("0"),
            monthly_payment_at_recommended=Decimal("0"),
            monthly_payment_at_maximum=Decimal("0"),
            assumptions={},
        )
    
    # Calculate affordable monthly housing payment
    # 28% rule (recommended) and 35% rule (maximum stretch)
    recommended_monthly = (monthly_gross_income * Decimal("0.28")).quantize(Decimal("0.01"))
    maximum_monthly = (monthly_gross_income * Decimal("0.35")).quantize(Decimal("0.01"))
    
    # Safe range: 20-28% of income
    safe_min_monthly = (monthly_gross_income * Decimal("0.20")).quantize(Decimal("0.01"))
    safe_max_monthly = recommended_monthly
    
    # Convert monthly payment to home price
    # Formula: Home Price = Monthly Payment / (Monthly Rate Factor + Tax/Ins Factor)
    
    # Monthly interest rate
    monthly_rate = (interest_rate / Decimal("100") / Decimal("12"))
    
    # Calculate monthly payment factor for principal + interest
    # P&I per dollar of loan = r(1+r)^n / ((1+r)^n - 1)
    if monthly_rate > 0:
        n_payments = Decimal(str(term_years * 12))
        rate_factor = monthly_rate * (Decimal("1") + monthly_rate) ** n_payments
        rate_denominator = (Decimal("1") + monthly_rate) ** n_payments - Decimal("1")
        pi_factor = rate_factor / rate_denominator
    else:
        # 0% interest rate edge case
        pi_factor = Decimal("1") / Decimal(str(term_years * 12))
    
    # Monthly property tax and insurance as percentage of home value
    monthly_tax_factor = property_tax_rate / Decimal("100") / Decimal("12")
    monthly_ins_factor = insurance_pct / Decimal("100") / Decimal("12")
    
    # Loan amount factor (how much is financed)
    loan_to_value = (Decimal("100") - down_payment_pct) / Decimal("100")
    
    # Total monthly cost per dollar of home value
    # = (P&I factor × LTV) + (tax factor) + (ins factor) + (HOA / home value)
    # We'll approximate HOA impact separately since it's fixed
    
    def monthly_to_home_price(affordable_monthly: Decimal) -> Decimal:
        """Convert affordable monthly payment to home price."""
        # Subtract fixed HOA from affordable amount
        available_for_piti = affordable_monthly - hoa_monthly
        if available_for_piti <= 0:
            return Decimal("0")
        
        # Home value = available / (LTV × P&I factor + tax factor + ins factor)
        total_factor = (loan_to_value * pi_factor) + monthly_tax_factor + monthly_ins_factor
        
        if total_factor <= 0:
            return Decimal("0")
        
        home_price = available_for_piti / total_factor
        return home_price.quantize(Decimal("1"))
    
    recommended_price = monthly_to_home_price(recommended_monthly)
    maximum_price = monthly_to_home_price(maximum_monthly)
    safe_min_price = monthly_to_home_price(safe_min_monthly)
    safe_max_price = recommended_price
    
    return HomeRecommendation(
        recommended_price=recommended_price,
        maximum_price=maximum_price,
        safe_min_price=safe_min_price,
        safe_max_price=safe_max_price,
        monthly_payment_at_recommended=recommended_monthly,
        monthly_payment_at_maximum=maximum_monthly,
        assumptions={
            "interest_rate_pct": float(interest_rate),
            "down_payment_pct": float(down_payment_pct),
            "term_years": term_years,
            "property_tax_pct": float(property_tax_rate),
            "insurance_pct": float(insurance_pct),
            "hoa_monthly": float(hoa_monthly),
        },
    )
