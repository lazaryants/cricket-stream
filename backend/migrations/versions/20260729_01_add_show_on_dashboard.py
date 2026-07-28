"""Add show_on_dashboard to streams.

Revision ID: 20260729_01
Revises: 20260728_01
Create Date: 2026-07-29
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260729_01"
down_revision: str | None = "20260728_01"

branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "streams",
        sa.Column(
            "show_on_dashboard",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "streams",
        "show_on_dashboard",
    )
