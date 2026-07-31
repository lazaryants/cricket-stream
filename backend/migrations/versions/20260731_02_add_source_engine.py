"""Add selectable source engine.

Revision ID: 20260731_02
Revises: 20260731_01
Create Date: 2026-07-31
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260731_02"
down_revision: str | None = "20260731_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


source_engine_enum = sa.Enum(
    "AUTO",
    "STREAMLINK",
    "YT_DLP",
    name="sourceengine",
)


def upgrade() -> None:
    source_engine_enum.create(
        op.get_bind(),
        checkfirst=True,
    )
    op.add_column(
        "streams",
        sa.Column(
            "source_engine",
            source_engine_enum,
            server_default="AUTO",
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "streams",
        "source_engine",
    )
    source_engine_enum.drop(
        op.get_bind(),
        checkfirst=True,
    )
