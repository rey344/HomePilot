"""
Calculate 5-year home ownership projections.
"""
from decimal import Decimal
from typing import NamedTuple


class YearProjection(NamedTuple):
    """Projection for a single year."""
    year: int
    home_value: Decimal
    loan_balance: Decimal
    equity: Decimal
    cumulative_interest_paid: Decimal
    cumulative_principal_paid: Decimal


class FiveYearProjection(NamedTuple):
    """5-year projection summary."""
    initial_home_value: Decimal
    projected_home_value: Decimal  # After 5 years
    home_value_increase: Decimal
    home_value_increase_pct: Decimal
    
    initial_loan_balance: Decimal
    projected_loan_balance: Decimal  # After 5 years
    principal_paid: Decimal
    
    initial_equity: Decimal
    projected_equity: Decimal  # After 5 years
    equity_increase: Decimal
    
    total_interest_paid: Decimal  # Over 5 years
    total_payments: Decimal  # Over 5 years
    
    net_worth_change: Decimal  # Equity gain - interest paid
    
    annual_appreciation_rate: Decimal
    
    yearly_details: list[YearProjection]


def calculate_five_year_projection(
    home_value: Decimal,
    loan_amount: Decimal,
    monthly_payment: Decimal,  # Principal + Interest only
    annual_interest_rate: Decimal,
    annual_appreciation_rate: Decimal = Decimal("3.0"),  # 3% default
) -> FiveYearProjection:
    """
    Project home equity and value over 5 years.
    
    Args:
        home_value: Initial home purchase price
        loan_amount: Initial mortgage loan amount
        monthly_payment: Monthly principal + interest payment
        annual_interest_rate: Annual interest rate percentage (e.g., 6.5)
        annual_appreciation_rate: Expected annual home appreciation % (default 3%)
    
    Returns:
        FiveYearProjection with detailed year-by-year breakdown
    """
    if home_value <= 0 or loan_amount < 0:
        # Return empty projection
        return _empty_projection()
    
    monthly_rate = annual_interest_rate / Decimal("100") / Decimal("12")
    monthly_appreciation_rate = annual_appreciation_rate / Decimal("100") / Decimal("12")
    
    initial_equity = home_value - loan_amount
    
    # Track values month by month
    current_home_value = home_value
    current_balance = loan_amount
    cumulative_interest = Decimal("0")
    cumulative_principal = Decimal("0")
    
    yearly_details = []
    
    for month in range(1, 61):  # 60 months = 5 years
        # Apply appreciation to home value
        current_home_value = current_home_value * (Decimal("1") + monthly_appreciation_rate)
        
        # Calculate interest for this month
        interest_payment = (current_balance * monthly_rate).quantize(Decimal("0.01"))
        principal_payment = (monthly_payment - interest_payment).quantize(Decimal("0.01"))
        
        # Ensure we don't overpay the loan
        if principal_payment > current_balance:
            principal_payment = current_balance
        
        # Update balances
        current_balance = (current_balance - principal_payment).quantize(Decimal("0.01"))
        cumulative_interest += interest_payment
        cumulative_principal += principal_payment
        
        # At end of each year, record snapshot
        if month % 12 == 0:
            year_num = month // 12
            current_equity = current_home_value - current_balance
            
            yearly_details.append(YearProjection(
                year=year_num,
                home_value=current_home_value.quantize(Decimal("0.01")),
                loan_balance=current_balance.quantize(Decimal("0.01")),
                equity=current_equity.quantize(Decimal("0.01")),
                cumulative_interest_paid=cumulative_interest.quantize(Decimal("0.01")),
                cumulative_principal_paid=cumulative_principal.quantize(Decimal("0.01")),
            ))
    
    # Final values after 5 years
    final_home_value = current_home_value.quantize(Decimal("0.01"))
    final_balance = current_balance.quantize(Decimal("0.01"))
    final_equity = (final_home_value - final_balance).quantize(Decimal("0.01"))
    
    home_value_increase = (final_home_value - home_value).quantize(Decimal("0.01"))
    home_value_increase_pct = ((home_value_increase / home_value) * 100).quantize(Decimal("0.1")) if home_value > 0 else Decimal("0")
    
    principal_paid_5y = cumulative_principal.quantize(Decimal("0.01"))
    interest_paid_5y = cumulative_interest.quantize(Decimal("0.01"))
    total_payments_5y = (principal_paid_5y + interest_paid_5y).quantize(Decimal("0.01"))
    
    equity_increase = (final_equity - initial_equity).quantize(Decimal("0.01"))
    
    # Net worth change = equity increase - interest paid
    # (You gained equity but also paid interest which is money gone)
    net_worth_change = (equity_increase - interest_paid_5y).quantize(Decimal("0.01"))
    
    return FiveYearProjection(
        initial_home_value=home_value.quantize(Decimal("0.01")),
        projected_home_value=final_home_value,
        home_value_increase=home_value_increase,
        home_value_increase_pct=home_value_increase_pct,
        
        initial_loan_balance=loan_amount.quantize(Decimal("0.01")),
        projected_loan_balance=final_balance,
        principal_paid=principal_paid_5y,
        
        initial_equity=initial_equity.quantize(Decimal("0.01")),
        projected_equity=final_equity,
        equity_increase=equity_increase,
        
        total_interest_paid=interest_paid_5y,
        total_payments=total_payments_5y,
        
        net_worth_change=net_worth_change,
        
        annual_appreciation_rate=annual_appreciation_rate,
        
        yearly_details=yearly_details,
    )


def _empty_projection() -> FiveYearProjection:
    """Return empty projection for invalid inputs."""
    zero = Decimal("0")
    return FiveYearProjection(
        initial_home_value=zero,
        projected_home_value=zero,
        home_value_increase=zero,
        home_value_increase_pct=zero,
        initial_loan_balance=zero,
        projected_loan_balance=zero,
        principal_paid=zero,
        initial_equity=zero,
        projected_equity=zero,
        equity_increase=zero,
        total_interest_paid=zero,
        total_payments=zero,
        net_worth_change=zero,
        annual_appreciation_rate=Decimal("3.0"),
        yearly_details=[],
    )
