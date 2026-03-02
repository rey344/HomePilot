"""SQLAlchemy models."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled scenario")

    # Loan terms
    home_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    down_payment: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    annual_rate_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    term_years: Mapped[int] = mapped_column(nullable=False)
    annual_property_tax_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    annual_insurance_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    hoa_monthly: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    maintenance_monthly_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0.1"))

    # Profile (for 50/30/20)
    monthly_take_home_income: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    other_monthly_needs: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
