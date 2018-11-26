from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, ForeignKey, Boolean, DateTime
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.dialects import postgresql

class Subscription(TimestampMixin, BaseUsers):
    __tablename__ = 'subscriptions'

    ACTIVE_STATUS = 'active'
    INACTIVE_STATUS = 'inactive'
    PENDING_STATUS = 'pending'

    EXPIRED_STATUS_REASON = 'expired'
    SUSPENDED_STATUS_REASON = 'suspended'
    REACTIVATED_STATUS_REASON = ''

    id = Column(BigInteger, Sequence('subscription_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    stripe_id = Column(Text)
    plan_id = Column(BigInteger, ForeignKey('plans.id'), index=True)
    latest = Column(Boolean)
    payment_type = Column(Text)
    status = Column(Text)
    status_reason = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    expiration_date = Column(DateTime)
    suspension_date = Column(DateTime)
    period_count = Column(BigInteger)
    user_cancellation_date = Column(DateTime)
    properties = Column(postgresql.JSON)
    modified_by_user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    notes = Column(Text)

    def __init__(self, params={},  user_id = None, stripe_id = None, plan_id = None, latest=None, payment_type=None, status=None, status_reason=None, start_date=None, end_date=None, expiration_date=None, suspension_date=None, user_cancellation_date=None, modified_by_user_id=None, properties = None, notes=None, period_count=None):
        self.user_id = user_id or params.get('user_id', None)
        self.stripe_id = stripe_id or params.get('stripe_id', None)
        self.plan_id = plan_id or params.get('plan_id', None)
        self.latest = latest or params.get('latest', None)
        self.payment_type = payment_type or params.get('payment_type', None)
        self.status = status or params.get('status', None)
        self.status_reason = status_reason or params.get('status_reason', None)
        self.start_date = start_date or params.get('start_date', None)
        self.end_date = end_date or params.get('end_date', None)
        self.expiration_date = expiration_date or params.get('expiration_date', None)
        self.suspension_date = suspension_date or params.get('suspension_date', None)
        self.user_cancellation_date = user_cancellation_date or params.get('user_cancellation_date', None)
        self.modified_by_user_id = modified_by_user_id or params.get('modified_by_user_id', None)
        self.notes = notes or params.get('notes', None)
        self.period_count = notes or params.get('period_count', None)
        self.properties = properties or params.get('properties', None)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "stripe_id": self.stripe_id,
            "plan_id": self.plan_id,
            "latest": self.latest,
            "payment_type": self.payment_type,
            "status": self.status,
            "status_reason": self.status_reason,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "expiration_date": self.expiration_date,
            "suspension_date": self.suspension_date,
            "user_cancellation_date": self.user_cancellation_date,
            "modified_by_user_id": self.modified_by_user_id,
            "notes": self.notes,
            "period_count": self.period_count,
            "properties": self.properties
        }