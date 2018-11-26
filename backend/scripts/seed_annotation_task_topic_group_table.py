"""
Create initial entries in AnnotationTaskTopicGroup table
"""

import os
import sys

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

from models import *

#######################################################################################################################
# current topics (as of November 28, 2017 - 8 total): Lending, BSA/AML, Mortgage Lending, Commercial Lending,
#                                                     Consumer Lending, Crowdfunding, Deposits, Payday Lending
#
# groups based off of production database active tasks as of November 2017
#######################################################################################################################

# hand-created AnnotationTaskTopicGroups
seed_annotation_task_topic_groups = [
    {
        'name': "Lending",
        'topic_id': 1,
        'description': "Lending",
        'annotation_task_ids': [66, 75, 69],
        'arbitrary_tags': ["Student Loans", "Flood Insurance", "Community Reinvestment Act"],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "BSA/AML",
        'topic_id': 2,
        'description': "BSA/AML",
        'annotation_task_ids': [88, 67, 71],
        'arbitrary_tags': [],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "Mortgage Lending",
        'topic_id': 3,
        'description': "Mortgage Lending",
        'annotation_task_ids': [93, 89, 77],
        'arbitrary_tags': ["Flood Insurance"],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "Commercial Lending",
        'topic_id': 17,
        'description': "Commercial Lending",
        'annotation_task_ids': [68],
        'arbitrary_tags': [],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "Consumer Lending",
        'topic_id': 18,
        'description': "Consumer Lending",
        'annotation_task_ids': [72],
        'arbitrary_tags': [],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "Crowdfunding",
        'topic_id': 4,
        'description': "Crowdfunding",
        'annotation_task_ids': [87],
        'arbitrary_tags': [],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "Deposits",
        'topic_id': 7,
        'description': "Deposits",
        'annotation_task_ids': [70],
        'arbitrary_tags': [],
        'gold_annotator_user_ids': [8, 23],
        'active_topic_annotation_model_id': None
    },
    {
        'name': "Payday Lending",
        'topic_id': 19,
        'description': "Testing/Research Specifications for Payday Lending",
        'annotation_task_ids': [92],
        'arbitrary_tags': [],
        'gold_annotator_user_ids': [8, 23, 557],
        'active_topic_annotation_model_id': None
    }
]


if __name__ == "__main__":

    for group_dict in seed_annotation_task_topic_groups:
        # check if group already in database
        existing_group = db_session_users.query(AnnotationTaskTopicGroup)\
                                         .filter_by(name=group_dict["name"])\
                                         .first()
        # if group not already in database, create new entry
        if not existing_group:
            new_group = AnnotationTaskTopicGroup(group_dict)
            db_session_users.add(new_group)
            db_session_users.commit()
        # if group already in database, update its entry
        else:
            existing_group.annotation_task_ids = group_dict["annotation_task_ids"]
            db_session_users.commit()

    # sanity check that reports how many AnnotationTaskTopicGroups are now in database
    num_groups = db_session_users.query(AnnotationTaskTopicGroup).count()
    print "Current number of AnnotationTaskTopicGroups:", num_groups
