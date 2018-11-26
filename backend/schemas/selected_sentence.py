from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, Text, ForeignKey, Boolean
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin

class SelectedSentence(TimestampMixin, BaseUsers):
    __tablename__ = 'selected_sentences'

    id = Column(BigInteger, Sequence('selected_sentences_id_seq'), primary_key=True)

    # n.b. refers to a document in the other database
    doc_id = Column(BigInteger, index=True)

    # n.b. the  annotation_job which triggered this selected sentence being created
    annotation_job_id = Column(BigInteger, ForeignKey('annotation_jobs.id'), index=True)

    # n.b. the  annotation_task which triggered this selected sentence being created
    annotation_task_id = Column(BigInteger, ForeignKey('annotation_tasks.id'), index=True)

    # track which user created this annotation
    # might be redundant with the link to the job, but probably useful for querying
    user_id = Column(BigInteger, ForeignKey('users.id'), index=True)

    # whether or not this job is being used to evaluate a new annotator (True = "yes this is used for evaluation")
    is_gold_evaluation = Column(Boolean, index=True)

    # "notes" for later use (not used at time of this commit) and
    # "admin_notes" for notes taken during research mode investigation
    # NB: these fields are set in annotation_job_helper.py when a TopicAnnotation instance is created
    notes = Column(Text)  # not currently set anywhere - for later use
    admin_notes = Column(Text)

    # the index build active when this annotation was generated - for tracking anything
    index_build = Column(Text, index=True)

    # the type of slot that was being annotated - this information will also be in the annotation task config - but
    # this should at minimum be useful for querying
    slot_type = Column(Text, index=True)

    ## full details for sentence_selection task session
    ## i.e. the actual annotation details
    # TODO: could this be broken down?
    task_data = Column(postgresql.JSON)

    def __init__(self, params):
        self.doc_id = params['doc_id']
        self.user_id = params['user_id']
        if 'annotation_job_id' in params:
            self.annotation_job_id = params['annotation_job_id']
        if 'annotation_task_id' in params:
            self.annotation_task_id = params['annotation_task_id']
        self.index_build = params.get('index_build', None)
        self.slot_type = params.get('slot_type', None)
        self.task_data = params.get('task_data', {})
        self.is_gold_evaluation = params.get('is_gold_evaluation', False)
        self.notes = params.get('notes', None)
        self.admin_notes = params.get('admin_notes', None)

    def to_dict(self):
        return {
            'doc_id': self.doc_id,
            'user_id': self.user_id,
            'index_build': self.index_build,
            'slot_type': self.slot_type,
            'task_data': self.task_data,
            'annotation_task_id': self.annotation_task_id,
            'annotation_job_id': self.annotation_job_id,
            "is_gold_evaluation": self.is_gold_evaluation,
            "notes": self.notes,
            "admin_notes": self.admin_notes
        }
