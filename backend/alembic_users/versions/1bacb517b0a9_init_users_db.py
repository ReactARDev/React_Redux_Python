"""init users db

Revision ID: 1bacb517b0a9
Revises:
Create Date: 2016-06-14 19:38:23.993976

"""

# revision identifiers, used by Alembic.
revision = '1bacb517b0a9'
down_revision = None
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import Sequence, CreateSequence

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('password_hash', sa.Text(), nullable=True),
    sa.Column('email', sa.Text(), nullable=True),
    sa.Column('first_name', sa.Text(), nullable=True),
    sa.Column('last_name', sa.Text(), nullable=True),
    sa.Column('enabled', sa.Boolean(), nullable=True),
    sa.Column('roles', postgresql.ARRAY(sa.Text()), nullable=True),
    sa.Column('reset_token', sa.Text(), nullable=True),
    sa.Column('properties', postgresql.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('user_id_seq')))
    op.create_table('topic_judgments',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('doc_id', sa.BigInteger(), nullable=True),
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('status', sa.Text(), nullable=True),
    sa.Column('topic_table', sa.Text(), nullable=True),
    sa.Column('topic_id', sa.BigInteger(), nullable=True),
    sa.Column('topic_name', sa.Text(), nullable=True),
    sa.Column('judgment', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('topic_judgment_id_seq')))
    op.create_table('user_agencies',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('agency_id', sa.BigInteger(), nullable=True),
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('following', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('user_agency_id_seq')))
    op.create_index('user_id_following_index', 'user_agencies', ['user_id', 'following'], unique=False)
    op.create_table('user_documents',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('doc_id', sa.BigInteger(), nullable=True),
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('read', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('user_document_id_seq')))
    op.create_index('user_id_doc_id_index', 'user_documents', ['user_id', 'doc_id'], unique=False)
    op.create_index('user_id_read_index', 'user_documents', ['user_id', 'read'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('user_id_read_index', table_name='user_documents')
    op.drop_index('user_id_doc_id_index', table_name='user_documents')
    op.drop_table('user_documents')
    op.drop_index('user_id_following_index', table_name='user_agencies')
    op.drop_table('user_agencies')
    op.drop_table('topic_judgments')
    op.drop_table('users')
    ### end Alembic commands ###
