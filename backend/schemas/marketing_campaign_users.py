
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence,  ForeignKey
from coaster.sqlalchemy import TimestampMixin

class MarketingCampaignUsers(TimestampMixin, BaseUsers):
    __tablename__ = 'marketing_campaign_users'

    id = Column(BigInteger, Sequence('marketing_campaign_user_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    marketing_campaign_id = Column(BigInteger, ForeignKey('marketing_campaigns.id'))

    def __init__(self, params={}):
        self.user_id = params['user_id']
        self.marketing_campaign_id = params['marketing_campaign_id']
