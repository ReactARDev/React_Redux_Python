from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, Index
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin

class UserDocumentTag(TimestampMixin, BaseUsers):
    __tablename__ = 'user_document_tags'

    id       = Column(BigInteger, Sequence('user_document_tag_id_seq'), primary_key=True)
    doc_id   = Column(BigInteger, index=True)
    user_tag_id = Column(BigInteger, ForeignKey('user_tags.id'))

    # we need this for system tags, and it will probably help to have for user-sourced tags too in the long
    # run when we start thinking about collapsing them
    user_id  = Column(BigInteger, ForeignKey('users.id'))

    # for representing the difference between positive and negative examples for training
    is_positive = Column(Boolean, default=True)

    # how this tag was presented to the user i.e. dropdown/modal/autosuggest/etc
    # we may experiment with multiple ui's for offering tag suggestions to users. it will probably
    # be useful to record in here where this came from
    # is there a better name for this than display_style?
    display_style = Column(Text)

    user_tag = relationship("UserTag", back_populates="user_document_tags")

    def __init__(self, params):
        self.doc_id  = params['doc_id']
        self.user_id = params['user_id']
        self.user_tag_id = params['user_tag_id']
        self.is_positive = params['is_positive']
        self.display_style = params['display_style']

    def to_dict(self):
        return {
            "doc_id": self.doc_id,
            "user_id": self.user_id,
            "user_tag_id": self.user_tag_id,
            "is_positive": self.is_positive,
            "display_style": self.display_style,
        }


Index("user_id_doc_id_is_positive_index", UserDocumentTag.user_id, UserDocumentTag.doc_id, UserDocumentTag.is_positive)
Index("user_tag_id_display_style_index", UserDocumentTag.user_tag_id, UserDocumentTag.display_style)
