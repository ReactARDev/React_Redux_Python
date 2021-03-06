"""add_insights_id_sequence

Revision ID: ca7004d8de23
Revises: 44ca1259e052
Create Date: 2017-07-09 08:39:00.168599

"""

# revision identifiers, used by Alembic.
revision = 'ca7004d8de23'
down_revision = '44ca1259e052'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
from sqlalchemy.schema import Sequence, CreateSequence


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute(CreateSequence(Sequence('insights_table_id_seq')))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    pass
    ### end Alembic commands ###
