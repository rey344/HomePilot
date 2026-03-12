"""
PITI: Principal + Interest + (Property) Tax + (Homeowners) Insurance.
Uses standard monthly mortgage formula for P&I; tax and insurance as annual rates.
"""
from decimal import Decimal


def monthly_p_and_i(loan_amount: Decimal, annual_rate_pct: Decimal, term_years: int) -> Decimal:
    """Monthly principal + interest only (no tax/insurance)."""
    from app.calculation_engine.amortization import monthly_payment

    return monthly_payment(loan_amount, annual_rate_pct, term_years)


def monthly_tax_from_annual_pct(home_value: Decimal, annual_tax_pct: Decimal) -> Decimal:
    """Monthly property tax from annual rate (e.g. 1.2% of home value per year)."""
    return (home_value * annual_tax_pct / 100 / 12).quantize(Decimal("0.01"))


def monthly_insurance_from_annual_pct(home_value: Decimal, annual_insurance_pct: Decimal) -> Decimal:
    """Monthly homeowners insurance from annual rate (% of home value per year)."""
    return (home_value * annual_insurance_pct / 100 / 12).quantize(Decimal("0.01"))


def monthly_piti_full(
    home_value: Decimal,
    loan_amount: Decimal,
    annual_rate_pct: Decimal,
    term_years: int,
    annual_property_tax_pct: Decimal,
    annual_insurance_pct: Decimal,
) -> Decimal:
    """
    Total monthly PITI: P&I + tax + insurance.
    All percentages in standard form (e.g. 6.5 for 6.5%).
    """
    from app.calculation_engine.amortization import monthly_payment

    p_i = monthly_payment(loan_amount, annual_rate_pct, term_years)
    tax = monthly_tax_from_annual_pct(home_value, annual_property_tax_pct)
    insurance = monthly_insurance_from_annual_pct(home_value, annual_insurance_pct)
    return (p_i + tax + insurance).quantize(Decimal("0.01"))
