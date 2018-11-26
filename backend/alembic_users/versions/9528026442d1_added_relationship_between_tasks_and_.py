"""added relationship between tasks and task groups

Revision ID: 9528026442d1
Revises: 56a20b784a7b
Create Date: 2017-12-14 14:30:00.772792

"""

# revision identifiers, used by Alembic.
revision = '9528026442d1'
down_revision = '56a20b784a7b'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotation_tasks', sa.Column('annotation_task_topic_group_id', sa.BigInteger(), nullable=True))
    op.create_index(op.f('ix_annotation_tasks_annotation_task_topic_group_id'), 'annotation_tasks', ['annotation_task_topic_group_id'], unique=False)
    op.create_foreign_key(None, 'annotation_tasks', 'annotation_task_topic_groups', ['annotation_task_topic_group_id'], ['id'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'annotation_tasks', type_='foreignkey')
    op.drop_index(op.f('ix_annotation_tasks_annotation_task_topic_group_id'), table_name='annotation_tasks')
    op.drop_column('annotation_tasks', 'annotation_task_topic_group_id')
    # ### end Alembic commands ###
