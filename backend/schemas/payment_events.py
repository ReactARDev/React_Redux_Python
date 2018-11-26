from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, Numeric
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.dialects import postgresql

class Payment_Event(TimestampMixin, BaseUsers):
    __tablename__ = 'payment_events'

    id = Column(BigInteger, Sequence('payment_event_id_seq'), primary_key=True)
    stripe_id = Column(Text)
    properties = Column(postgresql.JSON)

    def __init__(self, params={}, stripe_id = None, properties = None ):
        self.stripe_id = stripe_id or params.get('stripe_id', None)
        self.properties = properties or params.get('properties', None)

    def to_dict(self):
        return {
            "id": self.id,
            "stripe_id": self.stripe_id,
            "properties": self.properties
        }
