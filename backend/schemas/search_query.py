import hashlib
import json
from sqlalchemy import Column, BigInteger, Sequence, Text, Boolean, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql.functions import coalesce
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship
from .base_users import BaseUsers
import base_users as jorm

class SearchQuery(TimestampMixin, BaseUsers):
    __tablename__ = 'search_queries'

    id = Column(BigInteger, Sequence('search_query_id_seq'), primary_key=True)
    search_args_hash = Column(Text, index=True, unique=True)
    search_args = Column(postgresql.JSON)
    display_name = Column(Text)

    # to differentiate an arbitrary query entirely created by the user (typed in) from those that use
    # proposed entities to filter on, in other words, something that we've curated in some way
    is_arbitrary_query = Column(Boolean, index=True)

    user_search_queries = relationship("UserSearchQuery", back_populates="search_query")
    user_search_result_ratings = relationship("UserSearchResultRating", back_populates="search_query")

    def __init__(self, params={}, search_args=None, display_name=None, is_arbitrary_query=None):
        self.search_args = search_args or params.get('search_args', None)
        self.search_args_hash = hashlib.sha1(json.dumps(self.search_args)).hexdigest()
        self.display_name = display_name or params.get('display_name', None)
        self.is_arbitrary_query = is_arbitrary_query or params.get('is_arbitrary_query', None)

    def to_dict(self):
        return {
            'id': self.id,
            'search_args_hash': self.search_args_hash,
            'search_args': self.search_args,
            'display_name': self.display_name
        }

    # helper method to get the current query count in UserSearchQuery for this query
    # n.b. only returns results for external users
    def get_search_count(self):
        external_user_subquery = jorm.db_session_users.query(jorm.User.id)\
            .filter(coalesce(jorm.User.is_internal_user, False) != True).subquery()

        query_count = jorm.db_session_users.query(jorm.UserSearchQuery)\
            .filter(jorm.UserSearchQuery.user_id.in_(external_user_subquery)).filter_by(search_query_id=self.id)\
            .count()

        return query_count
