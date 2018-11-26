from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Index, Boolean
from coaster.sqlalchemy import TimestampMixin

class UserSharedFolder(TimestampMixin, BaseUsers):
    __tablename__ = 'user_shared_folders'

    id = Column(BigInteger, Sequence('user_shared_folder_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    folder_id = Column(BigInteger, ForeignKey('user_folders.id'), index=True)
    # mutally exclusive permissions, (ie. User cannot be Owner AND Editor or vice versa)
    owner = Column(Boolean)
    editor = Column(Boolean)
    viewer = Column(Boolean)

    def __init__(self, params={}, user_id=None, folder_id=None, owner=None, editor=None, viewer=None):
        self.user_id = user_id or params['user_id']
        self.folder_id = folder_id or params['folder_id']
        self.owner = owner or params.get('owner', None)
        self.editor = editor or params.get('editor', None)
        self.viewer = viewer or params.get('viewer', None)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "folder_id": self.folder_id,
            "owner": self.owner,
            "editor": self.editor,
            "viewer": self.viewer,
            "updated_at": self.updated_at
        }