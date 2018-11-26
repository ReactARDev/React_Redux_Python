import base64
import os
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin

class ApiKey(TimestampMixin, BaseUsers):
    __tablename__ = 'api_keys'

    id = Column(BigInteger, Sequence('api_key_id_seq'), primary_key=True)
    token = Column(Text, index=True)
    notes = Column(Text)
    enabled = Column(Boolean)
    user_id = Column(BigInteger, ForeignKey('users.id'))  # n.b. optional, a user could have more than one

    user = relationship("User", back_populates="api_keys")

    def __init__(self, params={}, token=None, notes=None, user_id=None, enabled=None):
        self.token = token or params.get('token', None)
        self.notes = notes or params.get('notes', None)
        self.user_id = user_id or params.get('user_id', None)
        self.enabled = enabled or params.get('enabled', True)  # n.b. default to enabled on create

    def to_dict(self):
        return {
            'id': self.id,
            'token': self.token,
            'notes': self.notes,
            'user_id': self.user_id,
            'enabled': self.enabled
        }

    def gen_token(self):
        self.token = base64.encodestring(os.urandom(32)).strip()  # 256-bit token
