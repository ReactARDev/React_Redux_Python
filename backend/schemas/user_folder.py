from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Index
from coaster.sqlalchemy import TimestampMixin

class UserFolder(TimestampMixin, BaseUsers):
    __tablename__ = 'user_folders'

    id = Column(BigInteger, Sequence('user_folder_id_seq'), primary_key=True)
    
    # This is for future folder nesting options
    parent_folder_id = Column(BigInteger, index=True)
    
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    name = Column(Text, index=True)

    def __init__(self, params={}, user_id=None, parent_folder_id=None, name=None):
        self.parent_folder_id = parent_folder_id or params.get('parent_folder_id', None)
        self.user_id = user_id or params['user_id']
        self.name  = name or params['name']
    
    def to_dict(self):
        return {
            "id": self.id,
            "parent_folder_id": self.parent_folder_id,
            "name": self.name,
            "user_id": self.user_id,
            "updated_at": self.updated_at
        }