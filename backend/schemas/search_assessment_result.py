from datetime import datetime
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, DateTime, Numeric
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class SearchAssessmentResult(TimestampMixin, BaseUsers):
    __tablename__ = 'search_assessment_results'
    
    id       = Column(BigInteger, Sequence('search_assessment_result_id_seq'), primary_key=True)
    query_id = Column(BigInteger, ForeignKey('search_regression_queries.id'), nullable=False)
    build    = Column(Text, nullable=False)
    version  = Column(BigInteger, nullable=False)
    doc_ids  = Column(postgresql.ARRAY(BigInteger), nullable=False)
    results  = Column(postgresql.JSON, nullable=False)
    scores   = Column(postgresql.ARRAY(Numeric))
    
    def __init__(self, params):
        self.query_id = params['query_id']
        self.doc_ids  = params['doc_ids']
        self.scores   = params['scores']
        self.results  = params['results']
        self.build    = params['build']
        self.version  = params['version']

    def to_dict(self):
        return {
            'id':         self.id,
            'query_id':   self.query_id,
            'doc_ids':    self.doc_ids,
            'scores':     self.scores,
            'results':    self.results,
            'build':      self.build,
            'version':    self.version,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
