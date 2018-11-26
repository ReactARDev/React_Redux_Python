from .base_users import BaseUsers
from sqlalchemy import Column, Sequence, Text, Numeric, BigInteger, ForeignKey
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship

class Invoice(TimestampMixin, BaseUsers):
    __tablename__ = 'invoices'

    id = Column(BigInteger, Sequence('invoice_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    plan_id = Column(BigInteger, ForeignKey('plans.id'), index=True)
    po_number = Column(BigInteger)
    status = Column(Text)
    notes = Column(Text)

    def __init__(self, params={}, user_id = None, plan_id = None, po_number=None, status=None, notes=None ):
        self.user_id = user_id or params.get('user_id', None)
        self.plan_id = plan_id or params.get('plan_id', None)
        self.po_number = po_number or params.get('po_number', None)
        self.status = status or params.get('status', None)
        self.notes = notes or params.get('notes', None)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "plan_id": self.plan_id,
            "po_number": self.po_number,
            "status": self.status,
            "notes": self.notes
        }
