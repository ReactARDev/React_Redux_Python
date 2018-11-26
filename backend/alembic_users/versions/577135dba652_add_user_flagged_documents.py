"""add user flagged documents

Revision ID: 577135dba652
Revises: 250dbeba710a
Create Date: 2016-09-30 21:16:31.792694

"""

# revision identifiers, used by Alembic.
revision = '577135dba652'
down_revision = '250dbeba710a'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.schema import Sequence, CreateSequence

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('user_flagged_documents',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('user_id', sa.BigInteger(), nullable=True),
    sa.Column('doc_id', sa.BigInteger(), nullable=True),
    sa.Column('issue_type', sa.Text(), nullable=True),
    sa.Column('issue_severity', sa.Text(), nullable=True),
    sa.Column('field', sa.Text(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('user_flagged_document_id_seq')))
    op.create_index(op.f('ix_user_flagged_documents_issue_severity'), 'user_flagged_documents', ['issue_severity'], unique=False)
    op.create_index(op.f('ix_user_flagged_documents_issue_type'), 'user_flagged_documents', ['issue_type'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_user_flagged_documents_issue_type'), table_name='user_flagged_documents')
    op.drop_index(op.f('ix_user_flagged_documents_issue_severity'), table_name='user_flagged_documents')
    op.drop_table('user_flagged_documents')
    ### end Alembic commands ###