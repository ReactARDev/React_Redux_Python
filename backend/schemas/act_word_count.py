from datetime import datetime
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

from settings import ACTIVE_INDEX_NAME

class ActWordCount(TimestampMixin, BaseUsers):
    __tablename__ = 'act_word_counts'
    
    id            = Column(BigInteger, Sequence('act_word_count_id_seq'), primary_key=True)
    act_id        = Column(BigInteger, nullable=False) ## NB: key in data db
    build_name    = Column(Text, nullable=False)
    month_counts  = Column(postgresql.JSON)    
    month_tfidf   = Column(postgresql.JSON)    
    
    def __init__(self, params):
        self.act_id       = params['act_id']
        self.build_name   = params.get('build_name', ACTIVE_INDEX_NAME)
        self.month_counts = params.get('word_count', None)
        self.month_tfidf  = params.get('tfidf', None)

    def to_dict(self):
        return {
            'id':            self.id,
            'act_id':        self.act_id,
            'build_name':    self.build_name,
            '30_day_counts': self.month_counts,
            '30_day_tfidf':  self.month_tfidf,
            'created_at':    self.created_at
        }
