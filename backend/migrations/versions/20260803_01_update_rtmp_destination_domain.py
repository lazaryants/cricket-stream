"""Update RTMP destination domain.

Revision ID: 20260803_01
Revises: 20260801_01
Create Date: 2026-08-03
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260803_01"
down_revision: str | None = "20260801_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


OLD_DOMAIN = "video.curling76.ru"
NEW_DOMAIN = "rtmp.cricket-stream.icu"


def upgrade() -> None:
    op.execute(
        f"""
        UPDATE saved_destinations
        SET
            destination_rtmp_url = replace(
                destination_rtmp_url,
                '{OLD_DOMAIN}',
                '{NEW_DOMAIN}'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE destination_rtmp_url
              LIKE '%{OLD_DOMAIN}%'
        """
    )

    op.execute(
        f"""
        UPDATE streams
        SET
            destination_rtmp_url = replace(
                destination_rtmp_url,
                '{OLD_DOMAIN}',
                '{NEW_DOMAIN}'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE destination_rtmp_url
              LIKE '%{OLD_DOMAIN}%'
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        UPDATE saved_destinations
        SET
            destination_rtmp_url = replace(
                destination_rtmp_url,
                '{NEW_DOMAIN}',
                '{OLD_DOMAIN}'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE destination_rtmp_url
              LIKE '%{NEW_DOMAIN}%'
        """
    )

    op.execute(
        f"""
        UPDATE streams
        SET
            destination_rtmp_url = replace(
                destination_rtmp_url,
                '{NEW_DOMAIN}',
                '{OLD_DOMAIN}'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE destination_rtmp_url
              LIKE '%{NEW_DOMAIN}%'
        """
    )
