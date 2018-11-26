from datetime import datetime
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, DateTime, Numeric
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class SearchRegressionQuery(TimestampMixin, BaseUsers):
    __tablename__ = 'search_regression_queries'
    
    id    = Column(BigInteger, Sequence('search_regression_query_id_seq'), primary_key=True)
    query = Column(Text, unique=True, nullable=False)
    
    def __init__(self, params):
        self.query = params['query']

    def to_dict(self):
        return {'id': self.id, 'query': self.query, 'created_at': self.creaated_at }
