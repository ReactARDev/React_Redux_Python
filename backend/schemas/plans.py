from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, Numeric, Boolean
from coaster.sqlalchemy import TimestampMixin

class Plan(TimestampMixin, BaseUsers):
    __tablename__ = 'plans'

    id = Column(BigInteger, Sequence('plan_id_seq'), primary_key=True)
    name = Column(Text)
    category = Column(Text)
    stripe_id = Column(Text)
    price = Column(Numeric)
    stripe_price = Column(Numeric)
    price_period = Column(Numeric)
    recurring = Column(Boolean)

    def __init__(self, params={}, name = None, category=None, stripe_id=None, price=None, stripe_price=None, price_period=None, recurring=None ):
        self.name = name or params.get('name', None)
        self.stripe_id = stripe_id or params.get('stripe_id', None)
        self.price = price or params.get('price', None)
        self.stripe_price = stripe_price or params.get('stripe_price', None)
        self.category = category or params.get('category', None)
        self.price_period = price_period or params.get('price_period', None)
        self.recurring = recurring or params.get('recurring', None)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "stripe_id": self.stripe_id,
            "price": self.price,
            "stripe_price": self.stripe_price,
            "price_period": self.price_period,
            "recurring": self.recurring
        }
