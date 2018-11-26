from .base_users import BaseUsers
from sqlalchemy import Column, BigInteger, Sequence, ForeignKey, Text, Boolean
from sqlalchemy.dialects import postgresql
from coaster.sqlalchemy import TimestampMixin


class AggregatedAnnotations(TimestampMixin, BaseUsers):

    # NB: each row in this table is a unique (doc_id, topic_id) pair; unique row can be identified
    #     with a (doc_id, topic_id) pair, though because AnnotationTaskTopicGroups correspond to topics, by
    #     a (doc_id, topic_id, annotation_task_group_id) triple to be safe

    # FIXME: this topic name mapping should be stored somewhere central
    topic_id_name_mapping = {
        1: 'Lending',
        2: 'BSA/AML',
        3: 'Mortgage Lending',
        4: 'Crowdfunding',
        5: 'FCPA',
        6: 'Credit',
        7: 'Deposits',
        8: 'Bank Operations',
        9: 'Insurance',
        10: 'Privacy',
        11: 'Securities',
        12: 'Trust',
        13: 'Payments',
        14: 'Cybersecurity',
        15: 'Leasing',
        16: 'Debt Collection',
        17: 'Commercial Lending',
        18: 'Consumer Lending',
        19: 'Payday Lending'
    }


    __tablename__ = 'aggregated_annotations'

    id = Column(BigInteger, Sequence('aggregated_annotations_id_seq'), primary_key=True)
    annotation_task_group_id = Column(BigInteger, ForeignKey('annotation_task_topic_groups.id'), index=True)

    # n.b. refers to a document in the other database
    doc_id = Column(BigInteger, index=True)

    topic_id = Column(BigInteger, index=True)  # topic_id from data database table

    # whether an annotation for this (topic, document) counts as a gold annotation
    is_gold_standard = Column(Boolean, index=True)

    # primary key of gold topic_annotation for this (doc, topic) pair
    gold_topic_annotation_id = Column(BigInteger, ForeignKey('topic_annotations.id'), index=True)

    is_active_for_gold_annotation = Column(Boolean, index=True)  # whether to use during onboarding training

    # easy/medium/hard as judged by gold raters (allowed values enforced at frontend)
    gold_difficulty = Column(Text, index=True)

    arbitrary_tags = Column(postgresql.ARRAY(Text))  # arbitrary classification, e.g. buckets
    is_in_agreement = Column(Boolean, index=True)  # whether judgments are in agreement
    notes = Column(Text)  # arbitrary text
    details = Column(postgresql.JSON)  # catch-all column for anything else needed

    #  assume params is a dict, use dict.get(key, default), which returns default if key doesn't exist
    def __init__(self, params):
        self.annotation_task_group_id = params.get("annotation_task_group_id", None)
        self.doc_id = params["doc_id"]  # must contain a doc_id
        self.topic_id = params.get("topic_id", None)
        self.is_gold_standard = params.get("is_gold_standard", None)
        self.gold_topic_annotation_id = params.get("gold_topic_annotation_id", None)
        self.is_active_for_gold_annotation = params.get("is_active_for_gold_annotation", None)
        self.gold_difficulty = params.get("gold_difficulty", None)
        self.arbitrary_tags = params.get("arbitrary_tags", [])
        self.is_in_agreement = params.get("is_in_agreement", None)
        self.notes = params.get("notes", None)
        self.details = params.get("details", None)

    def to_dict(self):
        response_dict = {
            "id": self.id,
            "annotation_task_group_id": self.annotation_task_group_id,
            "doc_id": self.doc_id,
            "topic_id": self.topic_id,
            "is_gold_standard": self.is_gold_standard,
            "gold_topic_annotation_id": self.gold_topic_annotation_id,
            "is_active_for_gold_annotation": self.is_active_for_gold_annotation,
            "gold_difficulty": self.gold_difficulty,
            "arbitrary_tags": self.arbitrary_tags,
            "is_in_agreement": self.is_in_agreement,
            "notes": self.notes,
            "details": self.details,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

        return response_dict