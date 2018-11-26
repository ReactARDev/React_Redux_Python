from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Index, Boolean
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship

class UserTag(TimestampMixin, BaseUsers):
    __tablename__ = 'user_tags'

    id = Column(BigInteger, Sequence('user_tag_id_seq'), primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)
    name = Column(Text)

    # where this came from, i.e. user/manual/lda/etc
    # would it be better to infer this from user_id/topic_id/topic_table?
    provenance = Column(Text)

    # n.b. this is optional and for system originated tags only, it is a reference to the system table
    # where this data lives, it could be topics, it could be some other table too.
    topic_id = Column(BigInteger)
    topic_table = Column(Text)

    # whether this tag is amongst the group of tags being actively suggested, which allows us for
    # system tags to easily control which system tags are active, but still keep around older ones
    # without them getting in the way
    active_suggestion = Column(Boolean, index=True)

    user = relationship("User", back_populates="user_tags")
    user_document_tags = relationship("UserDocumentTag", back_populates="user_tag")

    def __init__(self, params={}, name = None, user_id=None, topic_id = None, topic_table = None, provenance = None, active_suggestion = None):
        self.name = name or params['name']
        self.user_id = user_id or params.get('user_id', None)
        self.topic_id = topic_id or params.get('topic_id', None)
        self.topic_table = topic_table or params.get('topic_table', None)
        self.provenance = provenance or params.get('provenance', None)
        self.active_suggestion = active_suggestion or params.get('active_suggestion', None)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "user_id": self.user_id,
            "provenance": self.provenance,
            "active_suggestion": self.active_suggestion
        }

Index("topic_table_id_index", UserTag.topic_table, UserTag.topic_id)
