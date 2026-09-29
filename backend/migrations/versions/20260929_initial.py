"""initial advisor schema

Revision ID: 20260929_initial
Revises:
"""
from alembic import op
from backend.app.db import Base
revision = "20260929_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade(): Base.metadata.create_all(op.get_bind())
def downgrade(): Base.metadata.drop_all(op.get_bind())
