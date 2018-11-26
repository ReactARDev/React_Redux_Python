import base64
import os
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin

class MarketingCampaign(TimestampMixin, BaseUsers):
    __tablename__ = 'marketing_campaigns'

    id = Column(BigInteger, Sequence('marketing_campaign_id_seq'), primary_key=True)
    name = Column(Text)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    token = Column(Text) # akin to user activation token, but specific to the campaign
    notes = Column(Text)
    created_by_user_id = Column(BigInteger, ForeignKey('users.id'))

    # FIXME: this should just rely on a marketing_campaign_id on users, secondary table not necessary
    users = relationship("User", secondary="marketing_campaign_users", back_populates="marketing_campaigns")
    created_by_user = relationship("User")

    def __init__(self, params={}, name=None, start_date=None, end_date=None,
                 token=None, notes=None, created_by_user_id=None):
        self.name = name or params['name']
        self.start_date = start_date or params.get('start_date', None)
        self.end_date = end_date or params.get('end_date', None)
        self.token = token or params.get('token', None)
        self.notes = notes or params.get('notes', None)
        self.created_by_user_id = created_by_user_id or params.get('created_by_user_id', None)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'token': self.token,
            'notes': self.notes,
            'created_by': self.created_by_user.email,
            'num_users': len(self.users)
        }

    def gen_token(self):
        self.token = base64.encodestring(os.urandom(32)).strip()  # 256-bit token
