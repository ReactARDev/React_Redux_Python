"""add internal user flag for users

Revision ID: 7cc7f13762f3
Revises: 1d6ac45d4224
Create Date: 2017-05-04 19:48:22.255863

"""

# revision identifiers, used by Alembic.
revision = '7cc7f13762f3'
down_revision = '1d6ac45d4224'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('ix_search_queries_search_count', table_name='search_queries')
    op.drop_column('search_queries', 'search_count')
    op.add_column('users', sa.Column('is_internal_user', sa.Boolean(), nullable=True))
    op.create_index(op.f('ix_users_is_internal_user'), 'users', ['is_internal_user'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_is_internal_user'), table_name='users')
    op.drop_column('users', 'is_internal_user')
    op.add_column('search_queries', sa.Column('search_count', sa.BIGINT(), autoincrement=False, nullable=True))
    op.create_index('ix_search_queries_search_count', 'search_queries', ['search_count'], unique=False)
    ### end Alembic commands ###
