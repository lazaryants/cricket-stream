"""Align saved destinations UUID unique index.

Revision ID: 20260731_01
Revises: 20260730_04
Create Date: 2026-07-31
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260731_01"
down_revision: str | None = "20260730_04"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "uq_saved_destinations_uuid",
        "saved_destinations",
        type_="unique",
    )

    op.create_index(
        "ix_saved_destinations_uuid",
        "saved_destinations",
        ["uuid"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_saved_destinations_uuid",
        table_name="saved_destinations",
    )

    op.create_unique_constraint(
        "uq_saved_destinations_uuid",
        "saved_destinations",
        ["uuid"],
    )
