import bcrypt
import base64
import os
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Boolean, Text, ForeignKey
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin

class User(TimestampMixin, BaseUsers):
    __tablename__ = 'users'

    id            = Column(BigInteger, Sequence('user_id_seq'), primary_key=True)
    password_hash = Column(Text)
    email         = Column(Text, index=True, unique=True)
    first_name    = Column(Text)
    last_name     = Column(Text)
    enabled       = Column(Boolean)
    roles         = Column(postgresql.ARRAY(Text))
    reset_token   = Column(Text)# for registration and reset password
    properties    = Column(postgresql.JSON)
    suspended = Column(Boolean)
    suspended_reason = Column(Text)
    linkedin = Column(Text)
    google_id = Column(Text)
    is_internal_user = Column(Boolean, index=True)

    # fields where we are trying to gather a little more information about the user
    company = Column(Text)
    team_id  = Column(BigInteger, ForeignKey('teams.id'), index=True)
    industry = Column(Text)
    discipline = Column(Text)
    level = Column(Text)

    user_tags = relationship("UserTag", back_populates="user")
    user_saved_searches = relationship("UserSavedSearch", back_populates="user")
    user_search_result_ratings = relationship("UserSearchResultRating", back_populates="user")
    api_keys = relationship("ApiKey", back_populates="user")
    user_contributor_points = relationship("UserContributorPoint", back_populates="user")

    # FIXME: this should have been a marketing_campaign_id field on this table
    marketing_campaigns = relationship("MarketingCampaign", secondary="marketing_campaign_users", back_populates="users")

    annotation_jobs = relationship("AnnotationJob", back_populates="user")
    topic_annotations = relationship("TopicAnnotation", back_populates="user")

    def __init__(self, params={}, email=None, first_name=None, last_name=None,
                 password=None, company=None, team_id=None, industry=None, discipline=None,
                 level=None, roles=None):
        self.email         = email or params['email']
        self.first_name    = first_name or params.get('first_name', '')
        self.last_name     = last_name or params.get('last_name', '')
        self.enabled       = params.get('enabled', True)
        self.roles         = roles or params.get('roles',  [ ])
        self.reset_token   = params.get('reset_token', None)
        self.properties    = params.get('properties', {})
        self.company = company or params.get('company', None)
        self.team_id = team_id or params.get('team_id', None)
        self.industry = industry or params.get('industry', None)
        self.discipline = discipline or params.get('discipline', None)
        self.level = level or params.get('level', None)

        password = password or params.get('password', None)

        if password is not None:
            self.update_password(password)
        elif self.enabled is True:
            # prevent creating an enabled account with no password
            raise TypeError('Password must be specified')

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'properties': self.properties,
            'company': self.company,
            'team_id': self.team_id,
            'industry': self.industry,
            'discipline': self.discipline,
            'level': self.level,
            'enabled': self.enabled,
            'roles': self.roles,
            'suspended': self.suspended,
            'suspended_reason': self.suspended_reason,
            'is_internal_user': self.is_internal_user
        }

    def compare_password(self, password):
        if not (password and self.password_hash):
            return False

        return bcrypt.hashpw(password.encode('utf-8'), self.password_hash.encode('utf-8')) == self.password_hash

    def update_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10))

    def gen_reset_token(self):
        self.reset_token = base64.encodestring(os.urandom(32)).strip() #256-bit token
