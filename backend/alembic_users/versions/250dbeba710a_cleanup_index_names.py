"""cleanup index names

Revision ID: 250dbeba710a
Revises: d695e6da69b0
Create Date: 2016-09-30 21:15:48.424128

"""

# revision identifiers, used by Alembic.
revision = '250dbeba710a'
down_revision = 'd695e6da69b0'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_index(op.f('ix_user_folder_documents_doc_id'), 'user_folder_documents', ['doc_id'], unique=False)
    op.create_index(op.f('ix_user_folder_documents_user_folder_id'), 'user_folder_documents', ['user_folder_id'], unique=False)
    op.drop_index('ix_user_folder_document_doc_id', table_name='user_folder_documents')
    op.drop_index('ix_user_folder_document_user_folder_id', table_name='user_folder_documents')
    op.create_index(op.f('ix_user_folders_name'), 'user_folders', ['name'], unique=False)
    op.create_index(op.f('ix_user_folders_parent_folder_id'), 'user_folders', ['parent_folder_id'], unique=False)
    op.create_index(op.f('ix_user_folders_user_id'), 'user_folders', ['user_id'], unique=False)
    op.drop_index('ix_user_folder_name', table_name='user_folders')
    op.drop_index('ix_user_folder_parent_folder_id', table_name='user_folders')
    op.drop_index('ix_user_folder_user_id', table_name='user_folders')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_index('ix_user_folder_user_id', 'user_folders', ['user_id'], unique=False)
    op.create_index('ix_user_folder_parent_folder_id', 'user_folders', ['parent_folder_id'], unique=False)
    op.create_index('ix_user_folder_name', 'user_folders', ['name'], unique=False)
    op.drop_index(op.f('ix_user_folders_user_id'), table_name='user_folders')
    op.drop_index(op.f('ix_user_folders_parent_folder_id'), table_name='user_folders')
    op.drop_index(op.f('ix_user_folders_name'), table_name='user_folders')
    op.create_index('ix_user_folder_document_user_folder_id', 'user_folder_documents', ['user_folder_id'], unique=False)
    op.create_index('ix_user_folder_document_doc_id', 'user_folder_documents', ['doc_id'], unique=False)
    op.drop_index(op.f('ix_user_folder_documents_user_folder_id'), table_name='user_folder_documents')
    op.drop_index(op.f('ix_user_folder_documents_doc_id'), table_name='user_folder_documents')
    ### end Alembic commands ###
