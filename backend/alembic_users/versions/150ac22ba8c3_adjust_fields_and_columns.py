"""adjust fields and columns

Revision ID: 150ac22ba8c3
Revises: 824b7a3fdd47
Create Date: 2017-10-16 21:09:18.169682

"""

# revision identifiers, used by Alembic.
revision = '150ac22ba8c3'
down_revision = '824b7a3fdd47'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('team_members', 'user_id',
               existing_type=sa.BIGINT(),
               nullable=True)
    op.create_index(op.f('ix_team_members_team_id'), 'team_members', ['team_id'], unique=False)
    op.create_index(op.f('ix_team_members_user_id'), 'team_members', ['user_id'], unique=False)
    op.drop_index('ix_team_member_team_id', table_name='team_members')
    op.drop_index('ix_team_member_user_id', table_name='team_members')
    op.create_index(op.f('ix_teams_name'), 'teams', ['name'], unique=False)
    op.drop_index('ix_team_name', table_name='teams')
    op.alter_column('user_shared_folders', 'user_id',
               existing_type=sa.BIGINT(),
               nullable=True)
    op.create_index(op.f('ix_user_shared_folders_folder_id'), 'user_shared_folders', ['folder_id'], unique=False)
    op.create_index(op.f('ix_user_shared_folders_user_id'), 'user_shared_folders', ['user_id'], unique=False)
    op.drop_index('ix_user_shared_folder_id', table_name='user_shared_folders')
    op.drop_index('ix_user_shared_folder_user_id', table_name='user_shared_folders')
    op.create_index(op.f('ix_users_team_id'), 'users', ['team_id'], unique=False)
    op.drop_index('ix_user_team_id', table_name='users')
    op.create_foreign_key(None, 'users', 'teams', ['team_id'], ['id'])
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'users', type_='foreignkey')
    op.create_index('ix_user_team_id', 'users', ['team_id'], unique=False)
    op.drop_index(op.f('ix_users_team_id'), table_name='users')
    op.create_index('ix_user_shared_folder_user_id', 'user_shared_folders', ['user_id'], unique=False)
    op.create_index('ix_user_shared_folder_id', 'user_shared_folders', ['folder_id'], unique=False)
    op.drop_index(op.f('ix_user_shared_folders_user_id'), table_name='user_shared_folders')
    op.drop_index(op.f('ix_user_shared_folders_folder_id'), table_name='user_shared_folders')
    op.alter_column('user_shared_folders', 'user_id',
               existing_type=sa.BIGINT(),
               nullable=False)
    op.create_index('ix_team_name', 'teams', ['name'], unique=False)
    op.drop_index(op.f('ix_teams_name'), table_name='teams')
    op.create_index('ix_team_member_user_id', 'team_members', ['user_id'], unique=False)
    op.create_index('ix_team_member_team_id', 'team_members', ['team_id'], unique=False)
    op.drop_index(op.f('ix_team_members_user_id'), table_name='team_members')
    op.drop_index(op.f('ix_team_members_team_id'), table_name='team_members')
    op.alter_column('team_members', 'user_id',
               existing_type=sa.BIGINT(),
               nullable=False)
    ### end Alembic commands ###