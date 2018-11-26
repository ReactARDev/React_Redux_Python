"""add join table for ann tasks and term sampling groups

Revision ID: 700869c6a3d1
Revises: 59f532bb2197
Create Date: 2017-06-08 19:44:54.766976

"""

# revision identifiers, used by Alembic.
revision = '700869c6a3d1'
down_revision = '59f532bb2197'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.schema import Sequence, CreateSequence


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('annotation_task_term_sampling_groups',
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('annotation_task_id', sa.BigInteger(), nullable=True),
    sa.Column('term_sampling_group_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['annotation_task_id'], ['annotation_tasks.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.execute(CreateSequence(Sequence('annotation_task_term_sampling_group_id_seq')))
    op.create_index(op.f('ix_annotation_task_term_sampling_groups_annotation_task_id'), 'annotation_task_term_sampling_groups', ['annotation_task_id'], unique=False)
    op.create_index(op.f('ix_annotation_task_term_sampling_groups_term_sampling_group_id'), 'annotation_task_term_sampling_groups', ['term_sampling_group_id'], unique=False)
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_annotation_task_term_sampling_groups_term_sampling_group_id'), table_name='annotation_task_term_sampling_groups')
    op.drop_index(op.f('ix_annotation_task_term_sampling_groups_annotation_task_id'), table_name='annotation_task_term_sampling_groups')
    op.drop_table('annotation_task_term_sampling_groups')
    ### end Alembic commands ###
