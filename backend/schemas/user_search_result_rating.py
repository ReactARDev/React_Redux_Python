from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship

class UserSearchResultRating(TimestampMixin, BaseUsers):
    __tablename__ = 'user_search_result_ratings'

    id = Column(BigInteger, Sequence('user_search_result_rating_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    search_query_id = Column(BigInteger, ForeignKey('search_queries.id'), index=True)
    doc_id = Column(BigInteger, index=True)
    is_relevant = Column(Boolean)

    search_query = relationship("SearchQuery", back_populates="user_search_result_ratings")
    user = relationship("User", back_populates="user_search_result_ratings")

    def __init__(self, params={}, user_id=None, search_query_id=None, doc_id=None):
        self.user_id = user_id or params.get('user_id', None)
        self.doc_id = doc_id or params.get('doc_id', None)
        self.search_query_id = search_query_id or params.get('search_query_id', None)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "search_query_id": self.search_query_id
        }