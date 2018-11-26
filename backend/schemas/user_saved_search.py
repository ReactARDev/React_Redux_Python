from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Boolean
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import relationship

class UserSavedSearch(TimestampMixin, BaseUsers):
    __tablename__ = 'user_saved_searches'

    id = Column(BigInteger, Sequence('user_saved_search_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    name = Column(Text)
    search_args = Column(postgresql.JSON)

    user = relationship("User", back_populates="user_saved_searches")

    def __init__(self, params={}, name = None, user_id=None, search_args = None):
        self.name = name or params.get('name', None)
        self.user_id = user_id or params['user_id']
        self.search_args = search_args or params.get('search_args', None)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_id": self.user_id,
            "search_args": self.search_args,
            "updated_at": self.updated_at
        }
