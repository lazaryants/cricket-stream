"""Add user token version.

Revision ID: 20260801_01
Revises: 20260731_02
Create Date: 2026-08-01
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260801_01"
down_revision: str | None = "20260731_02"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "token_version",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "users",
        "token_version",
    )
