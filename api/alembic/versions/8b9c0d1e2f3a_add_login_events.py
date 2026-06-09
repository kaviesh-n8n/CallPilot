"""add login events

Revision ID: 8b9c0d1e2f3a
Revises: 4c1f1e3e8ef2
Create Date: 2026-06-09 15:55:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8b9c0d1e2f3a"
down_revision: Union[str, Sequence[str], None] = "4c1f1e3e8ef2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "login_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("auth_provider", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_login_events_email"), "login_events", ["email"], unique=False)
    op.create_index(op.f("ix_login_events_id"), "login_events", ["id"], unique=False)
    op.create_index("ix_login_events_created_at", "login_events", ["created_at"], unique=False)
    op.create_index(
        "ix_login_events_organization_created",
        "login_events",
        ["organization_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_login_events_user_created",
        "login_events",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_login_events_user_created", table_name="login_events")
    op.drop_index("ix_login_events_organization_created", table_name="login_events")
    op.drop_index("ix_login_events_created_at", table_name="login_events")
    op.drop_index(op.f("ix_login_events_id"), table_name="login_events")
    op.drop_index(op.f("ix_login_events_email"), table_name="login_events")
    op.drop_table("login_events")
