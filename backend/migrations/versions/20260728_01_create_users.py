"""Create users table.

Revision ID: 20260728_01
Revises: 20260727_01
Create Date: 2026-07-28
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260728_01"
down_revision: str | None = "20260727_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


USER_ROLE_VALUES = (
    "VIEWER",
    "OPERATOR",
    "ADMIN",
)


def upgrade() -> None:
    # Объект для явного создания PostgreSQL ENUM.
    user_role_create = postgresql.ENUM(
        *USER_ROLE_VALUES,
        name="userrole",
    )

    user_role_create.create(
        op.get_bind(),
        checkfirst=True,
    )

    # Этот объект используется в колонке.
    # create_type=False запрещает create_table()
    # повторно выполнять CREATE TYPE userrole.
    user_role_column = postgresql.ENUM(
        *USER_ROLE_VALUES,
        name="userrole",
        create_type=False,
    )

    op.create_table(
        "users",
        sa.Column(
            "username",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=320),
            nullable=True,
        ),
        sa.Column(
            "password_hash",
            sa.String(length=500),
            nullable=False,
        ),
        sa.Column(
            "role",
            user_role_column,
            server_default=sa.text(
                "'VIEWER'::userrole"
            ),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
        sa.Column(
            "is_superuser",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
        sa.Column(
            "last_login_at",
            sa.DateTime(timezone=True),
            nullable=True,
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
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "now()"
            ),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "now()"
            ),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint(
            "id",
        ),
        sa.UniqueConstraint(
            "uuid",
        ),
    )

    op.create_index(
        "ix_users_username",
        "users",
        ["username"],
        unique=True,
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    op.create_index(
        "ix_users_role",
        "users",
        ["role"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_users_role",
        table_name="users",
    )

    op.drop_index(
        "ix_users_email",
        table_name="users",
    )

    op.drop_index(
        "ix_users_username",
        table_name="users",
    )

    op.drop_table(
        "users"
    )

    user_role = postgresql.ENUM(
        *USER_ROLE_VALUES,
        name="userrole",
    )

    user_role.drop(
        op.get_bind(),
        checkfirst=True,
    )
