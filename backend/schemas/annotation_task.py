from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Boolean
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import relationship

class AnnotationTask(TimestampMixin, BaseUsers):
    __tablename__ = 'annotation_tasks'

    ACTIVE_STATUS = 'active'
    INACTIVE_STATUS = 'inactive'

    TOPIC_ANNOTATION_TYPE = 'topic_annotation'
    DOCUMENT_REVIEW_TYPE = 'document_review'
    ANNOTATE_ANY_DOCUMENT_TYPE = 'annotate_any_document'
    SLOT_FILL_TYPE = 'slot_fill'

    id = Column(BigInteger, Sequence('annotation_task_id_seq'), primary_key=True)
    name = Column(Text, index=True)

    # forward thinking, but we could ultimately have a reason to break tasks down by a set of types
    # (other than the name)
    type = Column(Text, index=True)

    # annotation_task_topic_group that contains this annotation_task (optional, not all tasks have them)
    annotation_task_topic_group_id = Column(BigInteger, ForeignKey('annotation_task_topic_groups.id'), index=True)

    # whether this is a contributor only task
    is_contributor_task = Column(Boolean, index=True)

    # whether this is a training only task for training new annotators
    # this tag can only be set to True if this task is part of an AnnotationTaskTopicGroup (enforced at API level)
    is_training_task = Column(Boolean, index=True)

    # whether to occasionally include gold annotations in this task (defaults to True)
    # (useful for continuous assessment of raters)
    include_gold_annotations = Column(Boolean, index=True)

    # defines the set of topics that are relevant to the task as a dict, with the keys being the topic names
    # and the values being the details about that topic, such as topic_id, topic_table, etc
    # id/table is only required to connect these back to another table in the "data" database
    # n.b. these in effect serve as the set of labels, and for judgement type tasks, the number of keys would be 1
    # note: this column should be effectively immutable, if we want to edit the options here, we should generate a
    # new annotation task with the same details, and then transfer everything over. that way we always know which
    # topics were present for any annotation
    topics = Column(postgresql.JSON)

    # this is an optional field, but allows us to keep a relationship between tasks as their topics change
    # in other words, there will be one task that shows as active to a user, even if there are many inactive tasks
    # that were previous iterations of this task (before the topics changed). that way we can track things as a
    # group when we want to (as we will user-facingly) and individually (as we will for data integrity behind the scenes)
    # n.b. active tasks function as parents, inactive as children
    active_task_id = Column(BigInteger, ForeignKey('annotation_tasks.id'), index=True)

    # tracks the status of this task, active or inactive. inactive tasks are generally previous versions of an active
    # task where the topics have changed, and are linked to the active task
    status = Column(Text, index=True)

    # contains the set of users that explicitly chosen to work on this task, used as the set of possible users
    # that annotation jobs can be pre-assigned to
    user_ids = Column(postgresql.ARRAY(BigInteger, ForeignKey('users.id')))

    # allow any additional configuration details that might be relevant in here, this is primarily a stopgap
    # field for anything not thought of in the initial design
    config = Column(postgresql.JSON)

    active_task = relationship('AnnotationTask', remote_side=[id])

    # AnnotationTaskTopicGroup to which this annotation task belongs
    annotation_task_topic_group = relationship('AnnotationTaskTopicGroup', back_populates='annotation_tasks')

    topic_annotations = relationship("TopicAnnotation", back_populates="annotation_task")
    annotation_jobs = relationship("AnnotationJob", back_populates="annotation_task")

    def __init__(self, params):
        self.name = params['name']
        # must be set before is_training_task due to check when setting is_training_task
        self.annotation_task_topic_group_id = params.get('annotation_task_topic_group_id', None)
        self.topics = params.get('topics', {})
        self.is_contributor_task = params.get('is_contributor_task', False)
        self.is_training_task = False
        if self.annotation_task_topic_group_id:
            self.is_training_task = params.get('is_training_task', False)  # can only be true if task is part of group
        self.include_gold_annotations = params.get('include_gold_annotations', True)  # default includes golds
        self.user_ids = params.get('user_ids', [])
        self.type = params.get('type', None)
        self.status = params.get('status', AnnotationTask.ACTIVE_STATUS)
        self.config = params.get('config', {})

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "annotation_task_topic_group_id": self.annotation_task_topic_group_id,
            "topics": self.topics,
            "is_contributor_task": self.is_contributor_task,
            "is_training_task": self.is_training_task,
            "include_gold_annotations": self.include_gold_annotations,
            "user_ids": self.user_ids,
            "active_task_id": self.active_task_id,
            "status": self.status,
            "config": self.config,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
