from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Index
from coaster.sqlalchemy import TimestampMixin

class UserFolderDocument(TimestampMixin, BaseUsers):
    __tablename__ = 'user_folder_documents'
    
    id = Column(BigInteger, Sequence('user_folder_doc_id_seq'), primary_key=True)
    user_folder_id = Column(BigInteger, ForeignKey('user_folders.id'), index=True)
    doc_id = Column(BigInteger, index=True)
    
    def __init__(self, params={}, user_folder_id=None, doc_id=None):
        self.user_folder_id = user_folder_id or params['user_folder_id']
        self.doc_id = doc_id or params['doc_id']
    
    def to_dict(self):
        return {
            "user_folder_id": self.user_folder_id,
            "doc_id": self.doc_id,
        }