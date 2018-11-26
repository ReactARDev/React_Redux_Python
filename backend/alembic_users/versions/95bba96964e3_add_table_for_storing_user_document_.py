"""add table for storing user document update requests

Revision ID: 95bba96964e3
Revises: ff7d37775df1
Create Date: 2016-11-02 15:17:39.413969

"""

# revision identifiers, used by Alembic.
revision = '95bba96964e3'
down_revision = 'ff7d37775df1'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import Sequence, CreateSequence

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user_document_updates',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('doc_id', sa.BigInteger(), nullable=True),
    sa.Column('changes', postgresql.JSON(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('status', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('user_document_update_id_seq')))
    op.create_index(op.f('ix_user_document_updates_status'), 'user_document_updates', ['status'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_user_document_updates_status'), table_name='user_document_updates')
    op.drop_table('user_document_updates')
    ### end Alembic commands ###