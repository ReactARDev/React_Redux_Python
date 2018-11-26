from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text
from sqlalchemy.orm import relationship
from coaster.sqlalchemy import TimestampMixin


# table to store text excerpts that users select during TopicAnnotations to explain their decisions
class TopicAnnotationExcerpt(TimestampMixin, BaseUsers):
    __tablename__ = 'topic_annotation_excerpts'

    id = Column(BigInteger, Sequence('topic_annotation_excerpt_id_seq'), primary_key=True)

    topic_annotation_id = Column(BigInteger, ForeignKey('topic_annotations.id'), index=True)

    # how long the excerpt is (number of characters)
    length = Column(BigInteger, index=True)

    # where the excerpt starts in the document (character offset)
    offset = Column(BigInteger, index=True)

    # text of the excerpt
    text = Column(Text)

    # relationship to parent TopicAnnotation this excerpt is for
    topic_annotation = relationship("TopicAnnotation", back_populates="topic_annotation_excerpts")

    def __init__(self, params):
        if 'topic_annotation_id' in params:
            self.topic_annotation_id = params['topic_annotation_id']
        self.length = params['length']
        self.offset = params['offset']
        self.text = params['text']

    def to_dict(self):
        response_dict = {
            "id": self.id,
            "topic_annotation_id": self.topic_annotation_id,
            "length": self.length,
            "offset": self.offset,
            "text": self.text
        }

        return response_dict
