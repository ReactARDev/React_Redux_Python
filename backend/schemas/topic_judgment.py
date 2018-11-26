from datetime import datetime
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class TopicJudgment(TimestampMixin, BaseUsers):
    __tablename__ = 'topic_judgments'
    
    id          = Column(BigInteger, Sequence('topic_judgment_id_seq'), primary_key=True)
    doc_id      = Column(BigInteger)
    user_id     = Column(BigInteger, ForeignKey('users.id'))
    status      = Column(Text)
    topic_table = Column(Text)
    topic_id    = Column(BigInteger)
    topic_name  = Column(Text)
    judgment    = Column(Boolean)
    
    def __init__(self, params):
        self.doc_id      = params['doc_id']
        self.topic_id    = params['topic_id']
        self.topic_name  = params['topic_name']
        self.topic_table = params.get('topic_table', 'topics')
        self.status      = params.get('status', 'queued')
        self.user_id     = None
        self.judgment    = None

    def to_dict(self):
        return {
            'id': self.id,
            'status': self.status,
            'topic_id': self.topic_id,
            'doc_id': self.doc_id,
            'topic_name': self.topic_name,
            'judgment': self.judgment,
            'user_id': self.user_id
        }
