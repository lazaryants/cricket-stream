"""Add saved source timestamp defaults.

Revision ID: 20260730_03
Revises: 20260730_02
Create Date: 2026-07-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260730_03"
down_revision: str | None = "20260730_02"

branch_labels: (
    str | Sequence[str] | None
) = None

depends_on: (
    str | Sequence[str] | None
) = None


def upgrade() -> None:
    op.alter_column(
        "saved_sources",
        "created_at",
        server_default=sa.text(
            "CURRENT_TIMESTAMP"
        ),
        existing_type=sa.DateTime(
            timezone=True
        ),
        existing_nullable=False,
    )

    op.alter_column(
        "saved_sources",
        "updated_at",
        server_default=sa.text(
            "CURRENT_TIMESTAMP"
        ),
        existing_type=sa.DateTime(
            timezone=True
        ),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "saved_sources",
        "updated_at",
        server_default=None,
        existing_type=sa.DateTime(
            timezone=True
        ),
        existing_nullable=False,
    )

    op.alter_column(
        "saved_sources",
        "created_at",
        server_default=None,
        existing_type=sa.DateTime(
            timezone=True
        ),
        existing_nullable=False,
    )
