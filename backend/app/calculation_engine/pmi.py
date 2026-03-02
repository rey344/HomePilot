"""
PMI (Private Mortgage Insurance) – credit-score and LTV based.
Rule-based annual rate bands; returns monthly PMI in dollars.
"""
from decimal import Decimal

# Simplified PMI annual rate (as decimal) by LTV band. Real tables vary by insurer.
# LTV > 95%: higher rate; 90–95%; 80–90%; below 80% typically no PMI.
# Credit tier can adjust these; here we use a single LTV-based band.
_PMI_ANNUAL_RATE_BY_LTV = [
    (Decimal("0.80"), Decimal("0")),       # LTV <= 80%: no PMI
    (Decimal("0.90"), Decimal("0.0032")),  # 80–90%
    (Decimal("0.95"), Decimal("0.0045")),  # 90–95%
    (Decimal("1.00"), Decimal("0.0060")),  # 95–100%
]


def ltv(loan_amount: Decimal, home_value: Decimal) -> Decimal:
    """Loan-to-value ratio (e.g. 0.85 for 85%)."""
    if home_value <= 0:
        return Decimal("1.00")
    return (loan_amount / home_value).quantize(Decimal("0.0001"))


def _annual_pmi_rate(ltv_ratio: Decimal) -> Decimal:
    for threshold, rate in _PMI_ANNUAL_RATE_BY_LTV:
        if ltv_ratio <= threshold:
            return rate
    return _PMI_ANNUAL_RATE_BY_LTV[-1][1]


def monthly_pmi(loan_amount: Decimal, home_value: Decimal) -> Decimal:
    """
    Monthly PMI in dollars. Uses LTV-based annual rate.
    Returns 0 when LTV <= 80%.
    """
    if loan_amount <= 0 or home_value <= 0:
        return Decimal("0")
    ltv_ratio = ltv(loan_amount, home_value)
    if ltv_ratio <= Decimal("0.80"):
        return Decimal("0")
    annual_rate = _annual_pmi_rate(ltv_ratio)
    annual_pmi_dollars = loan_amount * annual_rate
    return (annual_pmi_dollars / 12).quantize(Decimal("0.01"))
