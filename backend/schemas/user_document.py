from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Index
from coaster.sqlalchemy import TimestampMixin

class UserDocument(TimestampMixin, BaseUsers):
    __tablename__ = 'user_documents'

    id       = Column(BigInteger, Sequence('user_document_id_seq'), primary_key=True)
    doc_id   = Column(BigInteger)
    user_id  = Column(BigInteger, ForeignKey('users.id'))
    read     = Column(Boolean)
    bookmarked = Column(Boolean)

    def __init__(self, params):
        self.doc_id  = params['doc_id']
        self.user_id = params['user_id']
        self.read    = params.get('read', False)
        self.bookmarked = params.get('bookmarked', False)

Index("user_document_updated_at_index", UserDocument.updated_at)
Index("user_id_read_index", UserDocument.user_id, UserDocument.read)
Index("user_id_bookmark_index", UserDocument.user_id, UserDocument.bookmarked)
Index("user_id_doc_id_index", UserDocument.user_id, UserDocument.doc_id)
