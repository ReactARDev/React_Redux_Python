"""added is_gold_evaluation cols to jobs and topic annotations

Revision ID: ed860c399094
Revises: 9528026442d1
Create Date: 2017-12-18 12:43:18.402875

"""

# revision identifiers, used by Alembic.
revision = 'ed860c399094'
down_revision = '9528026442d1'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotation_jobs', sa.Column('is_gold_evaluation', sa.Boolean(), nullable=True))
    op.create_index(op.f('ix_annotation_jobs_is_gold_evaluation'), 'annotation_jobs', ['is_gold_evaluation'], unique=False)
    op.add_column('topic_annotations', sa.Column('is_gold_evaluation', sa.Boolean(), nullable=True))
    op.create_index(op.f('ix_topic_annotations_is_gold_evaluation'), 'topic_annotations', ['is_gold_evaluation'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_topic_annotations_is_gold_evaluation'), table_name='topic_annotations')
    op.drop_column('topic_annotations', 'is_gold_evaluation')
    op.drop_index(op.f('ix_annotation_jobs_is_gold_evaluation'), table_name='annotation_jobs')
    op.drop_column('annotation_jobs', 'is_gold_evaluation')
    # ### end Alembic commands ###
