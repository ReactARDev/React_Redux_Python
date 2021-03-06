"""add active_suggestion to user_tags

Revision ID: b30ee377fbe3
Revises: 524d305ee49a
Create Date: 2016-09-27 22:05:59.839130

"""

# revision identifiers, used by Alembic.
revision = 'b30ee377fbe3'
down_revision = '524d305ee49a'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user_tags', sa.Column('active_suggestion', sa.Boolean(), nullable=True))
    op.create_index(op.f('ix_user_tags_active_suggestion'), 'user_tags', ['active_suggestion'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_user_tags_active_suggestion'), table_name='user_tags')
    op.drop_column('user_tags', 'active_suggestion')
    ### end Alembic commands ###
