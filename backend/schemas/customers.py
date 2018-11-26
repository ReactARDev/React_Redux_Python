from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, ForeignKey
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.dialects import postgresql

class Customer(TimestampMixin, BaseUsers):
    __tablename__ = 'customers'

    id = Column(BigInteger, Sequence('customer_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    stripe_id = Column(Text)
    properties = Column(postgresql.JSON)

    def __init__(self, params={},  user_id = None, stripe_id = None, properties = None):
        self.user_id = user_id or params.get('user_id', None)
        self.stripe_id = stripe_id or params.get('stripe_id', None)
        self.properties = properties or params.get('properties', None)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "stripe_id": self.stripe_id,
            "properties": self.properties
        }
