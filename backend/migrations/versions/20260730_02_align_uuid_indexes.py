"""Align UUID unique indexes.

Revision ID: 20260730_02
Revises: 20260730_01
Create Date: 2026-07-30
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260730_02"
down_revision: str | None = "20260730_01"

branch_labels: (
    str | Sequence[str] | None
) = None

depends_on: (
    str | Sequence[str] | None
) = None


def upgrade() -> None:
    op.drop_constraint(
        "saved_sources_uuid_key",
        "saved_sources",
        type_="unique",
    )

    op.create_index(
        "ix_saved_sources_uuid",
        "saved_sources",
        ["uuid"],
        unique=True,
    )

    op.drop_constraint(
        "users_uuid_key",
        "users",
        type_="unique",
    )

    op.create_index(
        "ix_users_uuid",
        "users",
        ["uuid"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_users_uuid",
        table_name="users",
    )

    op.create_unique_constraint(
        "users_uuid_key",
        "users",
        ["uuid"],
    )

    op.drop_index(
        "ix_saved_sources_uuid",
        table_name="saved_sources",
    )

    op.create_unique_constraint(
        "saved_sources_uuid_key",
        "saved_sources",
        ["uuid"],
    )
