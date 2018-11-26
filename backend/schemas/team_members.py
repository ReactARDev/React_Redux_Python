from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, ForeignKey
from coaster.sqlalchemy import TimestampMixin

class TeamMember(TimestampMixin, BaseUsers):
    __tablename__ = 'team_members'

    id = Column(BigInteger, Sequence('team_member_id_seq'), primary_key=True)
    user_id  = Column(BigInteger, ForeignKey('users.id'), index=True)
    team_id  = Column(BigInteger, ForeignKey('teams.id'), index=True)

    def __init__(self, params={}, user_id=None, team_id=None):
        self.user_id = user_id or params['user_id']
        self.team_id = team_id or params['team_id']
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "team_id": self.team_id
        }