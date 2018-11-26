from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class InsightsTable(TimestampMixin, BaseUsers):
    __tablename__ = 'insights_tables'

    id = Column(BigInteger, Sequence('insights_table_id_seq'), primary_key=True)
    slug      = Column(Text, index=True)
    name      = Column(Text, index=True)
    raw_data  = Column(postgresql.JSON)
    csv_table = Column(Text)

    def __init__(self, params):
        self.slug      = params['slug']
        self.csv_table = params['csv_table']
        self.name      = params.get('name', None)
        self.raw_data  = params.get('raw_data', {})

    def to_dict(self):
        return {
            'slug':      self.slug,
            'csv_table': self.csv_table,
            'raw_data':  self.raw_data,
            'name':      self.name
        }

