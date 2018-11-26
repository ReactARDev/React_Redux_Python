from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, ForeignKey, Text, Sequence
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship


class AnnotationTaskTopicGroup(TimestampMixin, BaseUsers):
    __tablename__ = 'annotation_task_topic_groups'

    id = Column(BigInteger, Sequence('annotation_task_groups_id_seq'), primary_key=True)
    name = Column(Text, index=True)
    description = Column(Text)  # description of task group
    annotation_task_ids = Column(postgresql.ARRAY(BigInteger, ForeignKey('annotation_tasks.id')))  # annotation tasks in group
    arbitrary_tags = Column(postgresql.ARRAY(Text))  # for arbitrary categorization, e.g. classification bucket
    gold_annotator_user_ids = Column(postgresql.ARRAY(BigInteger, ForeignKey('users.id')))  # gold annotator user ids in group
    active_topic_annotation_model_id = Column(BigInteger)
    topic_id = Column(BigInteger, index=True)

    # annotation tasks belonging to this AnnotationTaskTopicGroup
    annotation_tasks = relationship("AnnotationTask", back_populates="annotation_task_topic_group")

    #  assume params is a dict, use dict.get(key, default), which returns default if key doesn't exist
    def __init__(self, params):
        self.name = params["name"]
        self.topic_id = params["topic_id"]
        self.description = params.get("description", None)
        self.annotation_task_ids = params.get("annotation_task_ids", [])
        self.arbitrary_tags = params.get("arbitrary_tags", [])
        self.gold_annotator_user_ids = params.get("gold_annotator_user_ids", [])
        self.active_topic_annotation_model_id = params.get("active_topic_annotation_model_id", None)

    def to_dict(self):
        response_dict = {
            "id": self.id,
            "name": self.name,
            'description': self.description,
            "annotation_task_ids": self.annotation_task_ids,
            "arbitrary_tags": self.arbitrary_tags,
            "gold_annotator_user_ids": self.gold_annotator_user_ids,
            "active_topic_annotation_model_id": self.active_topic_annotation_model_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "topic_id": self.topic_id
        }

        return response_dict
