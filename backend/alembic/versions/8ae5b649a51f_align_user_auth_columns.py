"""align user auth columns

Revision ID: 8ae5b649a51f
Revises: eee6bfb7606b
Create Date: 2026-07-24 12:13:20.155765
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '8ae5b649a51f'
down_revision: str | None = 'eee6bfb7606b'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=120), nullable=True))
    op.execute(
        """
        UPDATE users
        SET
            first_name = COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), 'Unknown'),
            last_name = COALESCE(
                NULLIF(btrim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''),
                'User'
            )
        """
    )
    op.alter_column("users", "first_name", nullable=False)
    op.alter_column("users", "last_name", nullable=False)
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.BOOLEAN(),
        server_default=sa.text("true"),
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "is_platform_admin",
        existing_type=sa.BOOLEAN(),
        server_default=sa.text("false"),
        existing_nullable=False,
    )
    op.drop_column("users", "full_name")


def downgrade() -> None:
    op.add_column("users", sa.Column("full_name", sa.String(length=255), nullable=True))
    op.execute(
        """
        UPDATE users
        SET full_name = btrim(first_name || ' ' || last_name)
        """
    )
    op.alter_column("users", "full_name", nullable=False)
    op.alter_column(
        "users",
        "is_platform_admin",
        existing_type=sa.BOOLEAN(),
        server_default=None,
        existing_nullable=False,
    )
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.BOOLEAN(),
        server_default=None,
        existing_nullable=False,
    )
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
