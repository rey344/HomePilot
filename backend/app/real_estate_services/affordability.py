"""Real estate listing affordability analyzer."""
from decimal import Decimal
from typing import Optional

from app.calculation_engine.piti import monthly_piti_full
from app.calculation_engine.pmi import monthly_pmi
from app.schemas.real_estate import AffordabilityIndicator


def analyze_listing_affordability(
    home_price: float,
    down_payment_pct: float,
    interest_rate: float,
    term_years: int,
    property_tax_rate: float,
    insurance_annual: float,
    hoa_monthly: float,
    monthly_income: float,
    annual_income: float
) -> AffordabilityIndicator:
    """
    Analyze if a listing is affordable based on user's financial profile.
    
    Args:
        home_price: Property price
        down_payment_pct: Down payment as percentage (e.g., 20.0 for 20%)
        interest_rate: Annual interest rate (e.g., 6.5 for 6.5%)
        term_years: Loan term in years
        property_tax_rate: Annual property tax as percentage
        insurance_annual: Annual home insurance cost
        hoa_monthly: Monthly HOA fees
        monthly_income: Monthly take-home income
        annual_income: Annual gross income
        
    Returns:
        AffordabilityIndicator with status and details
    """
    # Convert to Decimal for calculation precision
    home_price_dec = Decimal(str(home_price))
    down_payment_pct_dec = Decimal(str(down_payment_pct))
    interest_rate_dec = Decimal(str(interest_rate))
    term_years_int = int(term_years)
    property_tax_rate_dec = Decimal(str(property_tax_rate))
    insurance_annual_dec = Decimal(str(insurance_annual))
    hoa_monthly_dec = Decimal(str(hoa_monthly))
    monthly_income_dec = Decimal(str(monthly_income))
    
    # Calculate loan amount
    down_payment_amount = home_price_dec * down_payment_pct_dec / Decimal("100")
    loan_amount = home_price_dec - down_payment_amount
    
    # Convert insurance from annual dollar amount to percentage of home value
    annual_insurance_pct = (insurance_annual_dec / home_price_dec * Decimal("100")) if home_price_dec > 0 else Decimal("0")
    
    # Calculate PITI
    piti_total = monthly_piti_full(
        home_value=home_price_dec,
        loan_amount=loan_amount,
        annual_rate_pct=interest_rate_dec,
        term_years=term_years_int,
        annual_property_tax_pct=property_tax_rate_dec,
        annual_insurance_pct=annual_insurance_pct
    )
    
    # Calculate PMI if down payment < 20%
    pmi = monthly_pmi(
        loan_amount=home_price_dec * (Decimal("100") - down_payment_pct_dec) / Decimal("100"),
        down_payment_pct=down_payment_pct_dec
    )
    
    # Total monthly housing cost
    monthly_payment_dec = piti_total + pmi + hoa_monthly_dec
    monthly_payment = float(monthly_payment_dec.quantize(Decimal("0.01")))
    
    # Calculate housing percentage of income
    housing_pct = float((monthly_payment_dec / monthly_income_dec * Decimal("100")).quantize(Decimal("0.1")))
    
    # Determine affordability status
    # Safe: < 25%, Good: 25-30%, Stretch: 30-35%, Risky: > 35%
    if housing_pct < 25.0:
        status = "safe"
        message = f"Well within budget at {housing_pct}% of income"
        is_affordable = True
    elif housing_pct < 30.0:
        status = "good"
        message = f"Comfortable fit at {housing_pct}% of income"
        is_affordable = True
    elif housing_pct < 35.0:
        status = "stretch"
        message = f"Stretching budget at {housing_pct}% of income"
        is_affordable = True
    else:
        status = "risky"
        message = f"Over budget at {housing_pct}% of income"
        is_affordable = False
    
    return AffordabilityIndicator(
        status=status,
        monthly_payment=monthly_payment,
        housing_pct_of_income=housing_pct,
        is_affordable=is_affordable,
        message=message
    )
