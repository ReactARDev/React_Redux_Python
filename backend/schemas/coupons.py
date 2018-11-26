from .base_users import BaseUsers
from sqlalchemy import Column, Sequence, Text, Numeric, BigInteger
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship

# 7/19/2017 - this table is not currently used but will be in the future
class Coupon(TimestampMixin, BaseUsers):
    __tablename__ = 'coupons'

    id = Column(BigInteger, Sequence('coupon_id_seq'), primary_key=True)
    name = Column(Text)
    discount = Column(Numeric)

    def __init__(self, params={}, name = None, discount = None ):
        self.name = name or params.get('name', None)
        self.discount = discount or params.get('discount', None)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "discount": self.discount
        }
