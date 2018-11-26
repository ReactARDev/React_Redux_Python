
from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence,  ForeignKey
from coaster.sqlalchemy import TimestampMixin

class AnnotationTaskTermSamplingGroup(TimestampMixin, BaseUsers):
    __tablename__ = 'annotation_task_term_sampling_groups'

    id = Column(BigInteger, Sequence('annotation_task_term_sampling_group_id_seq'), primary_key=True)
    annotation_task_id = Column(BigInteger, ForeignKey('annotation_tasks.id'), index=True)

    # n.b. refers to a term sampling group in the other database, where a list of terms to sample the full_text of the
    # documents is found
    term_sampling_group_id = Column(BigInteger, index=True)

    def __init__(self, params=None):
        if params is None:
            params = {}
        self.annotation_task_id = params['annotation_task_id']
        self.term_sampling_group_id = params['term_sampling_group_id']
