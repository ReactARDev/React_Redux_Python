from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Index
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.dialects import postgresql

class UserFlaggedDocument(TimestampMixin, BaseUsers):
    __tablename__ = 'user_flagged_documents'

    HIDE_NOW_SEVERITY = 'hide_now' # n.b. hide from the api/frontend asap
    REVIEW_SEVERITY = 'review'
    SHOW_NOW_SEVERITY = 'show_now'  # handles case where a previously hidden document should be un-hidden (shown)

    TECHNICAL_ISSUE_TYPE = 'technical'
    NOT_RELEVANT_ISSUE_TYPE = 'not relevant'
    SHOW_AGAIN_ISSUE_TYPE = 'show again'
    CONTRIBUTOR_ISSUE_TYPE = 'contributor'

    FLAGGED_STATUS = 'flagged'
    HIDDEN_STATUS = 'hidden'
    PROCESSED_STATUS = 'processed'
    SKIPPED_STATUS = 'skipped'
    FIXED_STATUS = 'fixed'

    id = Column(BigInteger, Sequence('user_flagged_document_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'))
    doc_id = Column(BigInteger)

    # is this a technical problem with the document or is it just not relevant (for financial services)
    # proposed values: technical/not relevant
    issue_type = Column(Text, index=True)

    # how severe is this issue, should it be removed immediately, or should we have somebody else review it
    # proposed values: delete now/review
    issue_severity = Column(Text, index=True)

    # allows the user to specify the field on the document that has a problem
    # title/category/regulations/etc
    field = Column(Text)

    # free form notes with any additional relevant details
    notes = Column(Text)

    # JSON with the set of document data in a reasonable key (field) -> value format
    # Store details about hidden document so we can display the relevant doc details to users.
    data = Column(postgresql.JSON)

    # track the status of this flagging of a document, i.e. when a doc with hide_now severity
    # actually gets hidden, update from FLAGGED_STATUS -> HIDDEN_STATUS
    status = Column(Text)

    # save multiple flagged fields in case contributor flaggs a document
    multiple_field = Column(postgresql.JSON)

    def __init__(self, params):
        self.user_id = params['user_id']
        self.doc_id = params['doc_id']
        self.issue_type = params['issue_type']
        self.issue_severity = params.get('issue_severity', self.REVIEW_SEVERITY)
        self.field = params.get('field', None)
        self.notes = params.get('notes', None)
        self.data = {}
        self.status = params.get('status', self.FLAGGED_STATUS)
        self.multiple_field = params.get('multiple_field', {})

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "doc_id": self.doc_id,
            "issue_type": self.issue_type,
            "issue_severity": self.issue_severity,
            "field": self.field,
            "notes": self.notes,
            "data": self.data,
            "status": self.status,
            "multiple_field": self.multiple_field
        }

Index("user_flagged_doc_status_severity_index", UserFlaggedDocument.status, UserFlaggedDocument.issue_severity)
