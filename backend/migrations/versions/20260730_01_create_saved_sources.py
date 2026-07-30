"""Create saved sources table.

Revision ID: 20260730_01
Revises: 20260729_01
Create Date: 2026-07-30
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260730_01"
down_revision: str | None = "20260729_01"
branch_labels: (
    str | Sequence[str] | None
) = None
depends_on: (
    str | Sequence[str] | None
) = None


def upgrade() -> None:
    op.create_table(
        "saved_sources",
        sa.Column(
            "name",
            sa.String(length=200),
            nullable=False,
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "provider",
            postgresql.ENUM(
                "YOUTUBE",
                "TWITCH",
                "KICK",
                "VIMEO",
                "CUSTOM",
                "UNKNOWN",
                name="providertype",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "source_url",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "enabled",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "uuid",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint(
            "id",
        ),
        sa.UniqueConstraint(
            "source_url",
            name=(
                "uq_saved_sources_"
                "source_url"
            ),
        ),
        sa.UniqueConstraint(
            "uuid",
        ),
    )

    op.create_index(
        op.f(
            "ix_saved_sources_enabled"
        ),
        "saved_sources",
        ["enabled"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_saved_sources_name"
        ),
        "saved_sources",
        ["name"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_saved_sources_provider"
        ),
        "saved_sources",
        ["provider"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f(
            "ix_saved_sources_provider"
        ),
        table_name="saved_sources",
    )

    op.drop_index(
        op.f(
            "ix_saved_sources_name"
        ),
        table_name="saved_sources",
    )

    op.drop_index(
        op.f(
            "ix_saved_sources_enabled"
        ),
        table_name="saved_sources",
    )

    op.drop_table(
        "saved_sources"
    )
