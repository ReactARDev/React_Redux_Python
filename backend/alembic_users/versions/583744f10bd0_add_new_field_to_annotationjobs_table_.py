"""Add new field to AnnotationJobs table to allow us to know whether this job was skipped

Revision ID: 583744f10bd0
Revises: 35c098d746fd
Create Date: 2017-09-08 12:34:33.217326

"""

# revision identifiers, used by Alembic.
revision = '583744f10bd0'
down_revision = '35c098d746fd'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('annotation_jobs', sa.Column('was_skipped', sa.Boolean(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('annotation_jobs', 'was_skipped')
    ### end Alembic commands ###
