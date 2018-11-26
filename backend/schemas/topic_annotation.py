from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Boolean, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class TopicAnnotation(TimestampMixin, BaseUsers):
    __tablename__ = 'topic_annotations'

    id = Column(BigInteger, Sequence('topic_annotation_id_seq'), primary_key=True)

    # n.b. refers to a document in the other database
    doc_id = Column(BigInteger, index=True)

    # n.b. the  annotation_job which triggered this topic annotation being created
    annotation_job_id = Column(BigInteger, ForeignKey('annotation_jobs.id'), index=True)

    # n.b. the  annotation_task which triggered this topic annotation being created
    annotation_task_id = Column(BigInteger, ForeignKey('annotation_tasks.id'), index=True)

    # track which user created this annotation
    # might be redundant with the link to the job, but probably useful for querying
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)

    # for representing the difference between positive and negative examples for training
    # i.e. if we show several potential topics as checkboxes and the user selects only one topic, we
    # can create implicit is_positive=False (negative) examples for the unselected topics
    is_positive = Column(Boolean, default=True, index=True)

    # how this tag was presented to the user i.e. dropdown/modal/autosuggest/etc
    # we may experiment with multiple ui's so it might be useful to record this
    # is there a better name for this than display_style?
    display_style = Column(Text)

    # refers to the key by name in the topic hash in the annotator_task object
    topic_name = Column(Text, index=True)

    # n.b. added as a replacement for topic name, so we can link to the real table id of the topic instead
    topic_id = Column(BigInteger, index=True)

    # whether or not this job is being used to evaluate a new annotator (True = "yes this is used for evaluation")
    is_gold_evaluation = Column(Boolean, index=True)

    # capture any additional details that might be relevant in here, this is primarily a stopgap
    # field for anything not thought of in the initial design
    details = Column(postgresql.JSON)

    # "notes" for later use (not used at time of this commit) and
    # "admin_notes" for notes taken during research mode investigation
    # NB: these fields are set in annotation_job_helper.py when a TopicAnnotation instance is created
    notes = Column(Text)  # not currently set anywhere - for later use
    admin_notes = Column(Text)

    user = relationship("User", back_populates="topic_annotations")
    annotation_job = relationship("AnnotationJob", back_populates="topic_annotations")
    annotation_task = relationship("AnnotationTask", back_populates="topic_annotations")
    topic_annotation_excerpts = relationship("TopicAnnotationExcerpt", back_populates="topic_annotation")

    def __init__(self, params):
        self.doc_id = params['doc_id']
        self.user_id = params['user_id']
        self.is_positive = params['is_positive']
        self.display_style = params.get('display_style', None)
        if 'annotation_job_id' in params:
            self.annotation_job_id = params['annotation_job_id']
        if 'annotation_task_id' in params:
            self.annotation_task_id = params['annotation_task_id']
        if 'topic_id' in params:
            self.topic_id = params['topic_id']
        self.topic_name = params['topic_name']
        self.is_gold_evaluation = params.get('is_gold_evaluation', False)
        self.details = params.get('details', {})
        self.notes = params.get('notes', None)
        self.admin_notes = params.get('admin_notes', None)

    def to_dict(self):
        return {
            "id": self.id,
            "doc_id": self.doc_id,
            "user_id": self.user_id,
            "is_positive": self.is_positive,
            "display_style": self.display_style,
            "annotation_job_id": self.annotation_job_id,
            "annotation_task_id": self.annotation_task_id,
            "topic_name": self.topic_name,
            "is_gold_evaluation": self.is_gold_evaluation,
            "details": self.details,
            "notes": self.notes,
            "admin_notes": self.admin_notes
        }

