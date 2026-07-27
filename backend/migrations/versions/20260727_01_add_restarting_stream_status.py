"""Add RESTARTING stream status.

Revision ID: 20260727_01
Revises: 50e70d24c1b6
Create Date: 2026-07-27
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260727_01"
down_revision: str | None = "50e70d24c1b6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """
    Add RESTARTING to the PostgreSQL streamstatus enum.

    IF NOT EXISTS makes the migration safe for the current
    server, where the value was previously added manually.
    """
    with op.get_context().autocommit_block():
        op.execute(
            """
            ALTER TYPE streamstatus
            ADD VALUE IF NOT EXISTS 'RESTARTING'
            """
        )


def downgrade() -> None:
    """
    PostgreSQL cannot safely remove a single enum value
    without rebuilding the enum type and dependent columns.

    The value is therefore intentionally preserved during
    downgrade.
    """
    pass
