from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Index
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship

class UserSearchQuery(TimestampMixin, BaseUsers):
    __tablename__ = 'user_search_queries'

    id = Column(BigInteger, Sequence('user_search_query_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    search_query_id = Column(BigInteger, ForeignKey('search_queries.id'), index=True)

    search_query = relationship("SearchQuery", back_populates="user_search_queries")

    def __init__(self, params={}, user_id=None, search_query_id=None):
        self.user_id = user_id or params.get('user_id', None)
        self.search_query_id = search_query_id or params.get('search_query_id', None)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "search_query_id": self.search_query_id
        }

Index("user_search_queries_updated_at_index", UserSearchQuery.updated_at)