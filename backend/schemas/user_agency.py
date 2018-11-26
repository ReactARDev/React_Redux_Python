from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Index
from coaster.sqlalchemy import TimestampMixin

class UserAgency(TimestampMixin, BaseUsers):
    __tablename__ = 'user_agencies'

    id       = Column(BigInteger, Sequence('user_agency_id_seq'), primary_key=True)
    agency_id   = Column(BigInteger)
    user_id  = Column(BigInteger, ForeignKey('users.id'))

    # tracks whether a user is "following" an agency or not
    following = Column(Boolean)

    def __init__(self, params):
        self.agency_id  = params['agency_id']
        self.user_id = params['user_id']
        self.following = params.get('following', False)

Index("user_id_following_index", UserAgency.user_id, UserAgency.following)
