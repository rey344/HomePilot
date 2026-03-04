"""add indexes to scenarios table

Revision ID: 002
Revises: 001
Create Date: 2026-03-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create indexes for better query performance
    op.create_index('ix_scenarios_updated_at', 'scenarios', ['updated_at'], unique=False)
    op.create_index('ix_scenarios_created_at', 'scenarios', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_scenarios_created_at', table_name='scenarios')
    op.drop_index('ix_scenarios_updated_at', table_name='scenarios')
