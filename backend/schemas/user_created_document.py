from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class UserCreatedDocument(TimestampMixin, BaseUsers):
    __tablename__ = 'user_created_documents'

    QUEUED_STATUS = 'queued'
    PROCESSED_STATUS = 'processed'
    FAILED_STATUS = 'failed'

    id = Column(BigInteger, Sequence('user_created_document_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)

    # allows us to set the doc_id once it is created in the data database (assuming it succeeded)
    doc_id = Column(BigInteger)

    # free form notes with any additional relevant details
    notes = Column(Text)

    # record reason for any failures
    failure_notes = Column(Text)

    # track the status of this creating of a document, i.e. when a doc with queued status
    # actually gets created, update from QUEUED_STATUS -> PROCESSED_STATUS
    status = Column(Text, index=True)

    # JSON with all of the details necessary to create the document
    doc_details = Column(postgresql.JSON)

    def __init__(self, params):
        self.user_id = params['user_id']
        self.doc_id = params.get('doc_id', None)
        self.doc_details = params['doc_details']
        self.notes = params.get('notes', None)
        self.status = params.get('status', self.QUEUED_STATUS)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "doc_id": self.doc_id,
            "doc_details": self.doc_details,
            "notes": self.notes,
            "status": self.status,
            "failure_notes": self.failure_notes
        }
