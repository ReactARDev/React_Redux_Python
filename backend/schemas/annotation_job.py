from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Boolean, DateTime, Float
from coaster.sqlalchemy import TimestampMixin
from sqlalchemy.orm import relationship
from sqlalchemy.dialects import postgresql

class AnnotationJob(TimestampMixin, BaseUsers):
    __tablename__ = 'annotation_jobs'

    ERROR_STATUS = 'error'
    COMPLETE_STATUS = 'complete'
    ASSIGNED_STATUS = 'assigned'
    QUEUED_STATUS = 'queued'
    SKIPPED_STATUS = 'skipped'

    id = Column(BigInteger, Sequence('annotation_job_id_seq'), primary_key=True)
    annotation_task_id = Column(BigInteger, ForeignKey('annotation_tasks.id'), index=True)

    # the user id that actually worked on this job, sometimes pre-assigned, otherwise updated when assigned
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)

    # allows us to know whether this job was preassigned ..  the change the user_id when assigned logic
    # otherwise obviates this
    was_preassigned = Column(Boolean)

    # n.b. refers to a document in the other database
    doc_id = Column(BigInteger, index=True)

    # used to help sort items of the same criteria (type, etc)
    priority = Column(Float, index=True)

    # used to help differentiate different types of jobs (defined by a simple string value)
    type = Column(Text, index=True)

    # is this job in the queued / assigned / completed state?
    status = Column(Text, index=True)

    # whether or not this job is being used to evaluate a new annotator (True = "yes this is used for evaluation")
    is_gold_evaluation = Column(Boolean, index=True)

    # tracks when this job was marked as completed
    completed_at = Column(DateTime, index=True)

    # tracks when this job was marked as assigned
    # n.b. completed - assigned can provide a (crude) gauge of how fast a user is at completing any one job
    assigned_at = Column(DateTime, index=True)

    # allows us to record any arbitrary notes the user might have about this particular job when they submit it
    # n.b. better to have this on a job level than annotation level since a job can generate multiple annotations
    notes = Column(Text)

    # optional field that allows for annotations of other annotations, rather than other jobs. potentially useful
    # in the QA case, where a "better" annotator accepts/rejects the work of new or more error-prone annotators
    # splitting out subject_annotation_id and subject_annotation_table is intended to support additional table
    # that have annotations in the future, if for example we have another similar table to topic_annotations
    # TODO: this is probably worth re-visiting when we actually have a need for these fields
    subject_annotation_id = Column(BigInteger, index=True)
    subject_annotation_table = Column(Text, index=True)

    # allows us to know whether this job was skipped
    was_skipped = Column(Boolean)

    # new columns for updated research mode
    user_difficulty = Column(Text, index=True)  # easy/medium/hard (allowed column values enforced at frontend)
    arbitrary_tags = Column(postgresql.ARRAY(Text))  # tags from annotation_task_groups.arbitrary_tags

    user = relationship("User", back_populates="annotation_jobs")
    annotation_task = relationship("AnnotationTask", back_populates="annotation_jobs")
    topic_annotations = relationship("TopicAnnotation", back_populates="annotation_job", lazy="dynamic")

    def __init__(self, params):
        if 'annotation_task_id' in params:
            self.annotation_task_id = params['annotation_task_id']
        self.doc_id = params['doc_id']
        self.user_id = params.get('user_id', None)
        self.type = params.get('type', None)
        self.status = params.get('status', AnnotationJob.QUEUED_STATUS)
        self.was_preassigned = True if self.user_id is not None else params.get('was_preassigned', None)
        self.priority = params['priority']
        self.notes = params.get('notes', None)
        self.is_gold_evaluation = params.get('is_gold_evaluation', False)
        self.completed_at = params.get('completed_at', None)
        self.assigned_at = params.get('assigned_at', None)
        self.subject_annotation_id = params.get('subject_annotation_id', None)
        self.subject_annotation_table = params.get('subject_annotation_table', None)
        self.was_skipped = params.get('was_skipped', None)
        self.user_difficulty = params.get('user_difficulty', None)
        self.arbitrary_tags = params.get('arbitrary_tags', None)

    def to_dict(self, params={}):
        response_dict = {
            "id": self.id,
            "doc_id": self.doc_id,
            "user_id": self.user_id,
            "type": self.type,
            "status": self.status,
            "was_preassigned": self.was_preassigned,
            "annotation_task_id": self.annotation_task_id,
            "priority": self.priority,
            "notes": self.notes,
            "is_gold_evaluation": self.is_gold_evaluation,
            "completed_at": self.completed_at,
            "assigned_at": self.assigned_at,
            "created_at": self.created_at,
            "subject_annotation_id": self.subject_annotation_id,
            "subject_annotation_table": self.subject_annotation_table,
            'was_skipped': self.was_skipped,
            'user_difficulty': self.user_difficulty,
            'arbitrary_tags': self.arbitrary_tags
        }

        if 'topic_annotation_count' in params:
            response_dict['topic_annotation_count'] = self.topic_annotations.count()

        return response_dict
