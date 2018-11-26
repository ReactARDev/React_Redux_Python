from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, Index
from coaster.sqlalchemy import TimestampMixin

class Team(TimestampMixin, BaseUsers):
    __tablename__ = 'teams'

    id = Column(BigInteger, Sequence('team_id_seq'), primary_key=True)
    name = Column(Text, index=True)

    def __init__(self, params={}, name=None):
        self.name = name or params['name']
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }