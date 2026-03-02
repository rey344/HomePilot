"""create scenarios table

Revision ID: 001
Revises:
Create Date: 2026-03-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scenarios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("home_value", sa.Numeric(14, 2), nullable=False),
        sa.Column("down_payment", sa.Numeric(14, 2), nullable=False),
        sa.Column("annual_rate_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("term_years", sa.Integer(), nullable=False),
        sa.Column("annual_property_tax_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("annual_insurance_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("hoa_monthly", sa.Numeric(12, 2), nullable=False),
        sa.Column("maintenance_monthly_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("monthly_take_home_income", sa.Numeric(14, 2), nullable=False),
        sa.Column("other_monthly_needs", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("scenarios")
