"""
Amortization: monthly payment and schedule (principal, interest, balance per period).
"""
from decimal import Decimal
from typing import NamedTuple


class AmortizationRow(NamedTuple):
    month: int
    payment: Decimal
    principal: Decimal
    interest: Decimal
    balance: Decimal


def monthly_payment(loan_amount: Decimal, annual_rate_pct: Decimal, term_years: int) -> Decimal:
    """
    Fixed monthly P&I payment (standard annuity formula).
    rate in percent (e.g. 6.5 for 6.5%), term in years.
    """
    if term_years <= 0 or loan_amount <= 0:
        return Decimal("0")
    r = annual_rate_pct / 100 / 12  # monthly rate
    n = term_years * 12
    if r == 0:
        return (loan_amount / n).quantize(Decimal("0.01"))
    # P * (r * (1+r)^n) / ((1+r)^n - 1)
    one_plus_r = 1 + r
    factor = (r * (one_plus_r ** n)) / ((one_plus_r ** n) - 1)
    return (loan_amount * factor).quantize(Decimal("0.01"))


def amortization_schedule(
    loan_amount: Decimal,
    annual_rate_pct: Decimal,
    term_years: int,
    max_months: int | None = None,
) -> list[AmortizationRow]:
    """
    Full amortization schedule. Each row: month, payment, principal, interest, balance.
    Optionally cap at max_months for large terms.
    """
    if term_years <= 0 or loan_amount <= 0:
        return []
    payment = monthly_payment(loan_amount, annual_rate_pct, term_years)
    r = annual_rate_pct / 100 / 12
    rows: list[AmortizationRow] = []
    balance = loan_amount
    n = term_years * 12
    for month in range(1, int(n) + 1):
        if max_months and month > max_months:
            break
        interest = (balance * r).quantize(Decimal("0.01"))
        principal = (payment - interest).quantize(Decimal("0.01"))
        if month == int(n):
            principal = balance  # last month: pay off remainder
            payment = principal + interest
        balance = (balance - principal).quantize(Decimal("0.01"))
        if balance < 0:
            balance = Decimal("0")
        rows.append(
            AmortizationRow(month=month, payment=payment, principal=principal, interest=interest, balance=balance)
        )
        if balance <= 0:
            break
    return rows
