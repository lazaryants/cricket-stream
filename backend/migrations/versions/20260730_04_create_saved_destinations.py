"""Create saved destinations table and seed places.

Revision ID: 20260730_04
Revises: 20260730_03
Create Date: 2026-07-30
"""

from collections.abc import Sequence
from datetime import (
    datetime,
    timezone,
)
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision: str = "20260730_04"
down_revision: str | None = "20260730_03"

branch_labels: (
    str | Sequence[str] | None
) = None

depends_on: (
    str | Sequence[str] | None
) = None


def upgrade() -> None:
    op.create_table(
        "saved_destinations",
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
            "destination_rtmp_url",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
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
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(
                timezone=True
            ),
            nullable=False,
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
        ),
        sa.PrimaryKeyConstraint(
            "id",
        ),
        sa.UniqueConstraint(
            "destination_rtmp_url",
            name=(
                "uq_saved_destinations_"
                "destination_rtmp_url"
            ),
        ),
        sa.UniqueConstraint(
            "uuid",
            name=(
                "uq_saved_destinations_uuid"
            ),
        ),
    )

    op.create_index(
        op.f(
            "ix_saved_destinations_enabled"
        ),
        "saved_destinations",
        ["enabled"],
        unique=False,
    )

    op.create_index(
        op.f(
            "ix_saved_destinations_name"
        ),
        "saved_destinations",
        ["name"],
        unique=False,
    )

    destination_table = sa.table(
        "saved_destinations",
        sa.column(
            "name",
            sa.String(length=200),
        ),
        sa.column(
            "description",
            sa.Text(),
        ),
        sa.column(
            "destination_rtmp_url",
            sa.Text(),
        ),
        sa.column(
            "enabled",
            sa.Boolean(),
        ),
        sa.column(
            "uuid",
            sa.Uuid(),
        ),
        sa.column(
            "created_at",
            sa.DateTime(
                timezone=True
            ),
        ),
        sa.column(
            "updated_at",
            sa.DateTime(
                timezone=True
            ),
        ),
    )

    now = datetime.now(
        timezone.utc
    )

    rows = []

    for place_number in range(
        1,
        17,
    ):
        rows.append(
            {
                "name": (
                    f"test place"
                    f"{place_number}"
                ),
                "description": (
                    f"RTMP destination for "
                    f"place{place_number}"
                ),
                "destination_rtmp_url": (
                    "rtmp://video.curling76.ru/"
                    f"place{place_number}/"
                    f"stream{place_number}"
                ),
                "enabled": True,
                "uuid": uuid4(),
                "created_at": now,
                "updated_at": now,
            }
        )

    op.bulk_insert(
        destination_table,
        rows,
    )


def downgrade() -> None:
    op.drop_index(
        op.f(
            "ix_saved_destinations_name"
        ),
        table_name=(
            "saved_destinations"
        ),
    )

    op.drop_index(
        op.f(
            "ix_saved_destinations_enabled"
        ),
        table_name=(
            "saved_destinations"
        ),
    )

    op.drop_table(
        "saved_destinations"
    )
