from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Index
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

# This table is intended to be used as a queue for requested document updates by users. A background job will
# then read from this table, making the requested changes to the document table and telling the text analysis
# pipeline to re-process and re-index it.
class UserDocumentUpdate(TimestampMixin, BaseUsers):
    __tablename__ = 'user_document_updates'

    QUEUED_STATUS = 'queued'
    UPDATED_STATUS = 'updated'

    id = Column(BigInteger, Sequence('user_document_update_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    doc_id = Column(BigInteger)

    # JSON with the set of changes in a reasonable key (field) -> value format
    changes = Column(postgresql.JSON)

    # free form notes with any additional relevant details (to be stashed in the audit table)
    notes = Column(Text)

    # track the status of this document update request, when a user submits the document to be
    # updated, it is set to QUEUED_STATUS, after the background script picks it up and updates the values
    # it is set to UPDATED_STATUS
    status = Column(Text, index=True)

    def __init__(self, params):
        self.user_id = params['user_id']
        self.doc_id = params['doc_id']
        self.notes = params['notes']
        self.changes = params['changes']

        # default to queued for new items
        self.status = params.get('status', self.QUEUED_STATUS)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "doc_id": self.doc_id,
            "notes": self.notes,
            "changes": self.changes,
            "status": self.status
        }
