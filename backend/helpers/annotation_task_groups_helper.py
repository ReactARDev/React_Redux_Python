from models import db_session_users, AnnotationTaskTopicGroup, AnnotationTask, User, TopicAnnotation,\
                   AggregatedAnnotations
from flask import jsonify
from helpers.utilities import merge_two_dicts
from sqlalchemy.orm import subqueryload
from sqlalchemy import tuple_
from collections import defaultdict

# return dict of info for each annotation task group
def get_all_annotation_task_groups():
    task_groups = [g.to_dict() for g in db_session_users.query(AnnotationTaskTopicGroup)]

    for group in task_groups:
        group['gold_annotator_users'] = [u.to_dict() for u in db_session_users.query(User).filter(User.id.in_(group['gold_annotator_user_ids'])).all()]

    return {"annotation_task_groups": task_groups}


# return all annotation task objects in a specific annotation task group
# as well as all metadata about this annotation task group
def get_all_annotation_tasks_in_group(annotation_task_group_id):

    # get list of annotation task ids for annotation task group
    task_group = db_session_users.query(AnnotationTaskTopicGroup)\
                                 .filter_by(id=annotation_task_group_id)\
                                 .first()
    if task_group is None:
        return jsonify({'errors': 'This annotation task group does not exist'}), 400
    task_group_dict = task_group.to_dict()
    task_ids = task_group_dict["annotation_task_ids"]

    # create annotation task dicts
    tasks = [db_session_users.query(AnnotationTask).filter_by(id=task_id).first().to_dict() for task_id in task_ids]

    # return list of annotation task dicts, total number of tasks, and annotation task group dict
    return jsonify({"annotation_tasks_in_group": tasks,
                    "total_tasks": len(tasks),
                    "annotation_task_group_dict": task_group_dict})


# useful for onboarding mode
def get_all_topic_annotations_in_group(annotation_task_group_id, params):
    """
    Returns list of topic_annotations (possibly with augmented evaluation information for given
    annotation_task_topic_group.

    Optional flag is include_aggregated_annotation_info, which tells whether to query the aggregated_annotations
                table for additional annotation info

    Optional filters on user_id, tag, difficulty, is_gold_evaluation, accuracy.

    Options sorting on tag, difficulty, accuracy.

    :param annotation_task_group_id (int): id (primary key) of annotation_task_topic_group
    :param (in url request): all top-level:

            'user_id':                      filter on given user_id (int)

            'is_gold_evaluation':           filter on value of is_gold_evaluation (bool)

            'user_arbitrary_tag':           filter on arbitrary_tags from annotation_jobs table (text)

            'user_difficulty':              filter on self-reported user difficulty from annotation_jobs table
                                                                ('easy', 'medium' or 'hard')

            'is_correct_judgment':          filter on accuracy of annotations (i.e. agreement between
                                                                               annotation and gold annotation)
                                                                           (bool - True means 'agree'/'accurate')

            'sorting':                      sort on given parameter; available are 'accuracy', 'difficulty', 'tag'


                                                    'is_correct_judgment': accuracy of annotations (i.e. agreement
                                                                            between annotation and gold annotation)

                                                    'user_difficulty': sort on self-reported user difficulty from
                                                                         annotation_jobs table

            'include_aggregated_annotation_info':  whether to include info from aggregated_annotations table
                                                    (necessary if want to filter/sort on accuracy) (bool)


    :return (list(dict)): potentially-sorted list of dicts: [dict_1, dict_2, ...]
                          Each dict is topic_annotation.to_dict() object augmented with additional keys:

                                {
                                    'user_difficulty': 'easy'/'medium'/'hard' (self-reported user difficulty)
                                    'user_tags': ['text_1', 'text_2', ... ] (user-chosen arbitrary tags)
                                    'gold_judgment': bool (judgment of gold annotation for this annotation),
                                    'is_correct_judgment': bool (whether this annotation agrees with gold judgment),
                                }

    'gold_judgment' and 'is_correct_judgment' keys only present if 'include_aggregated_annotation_info' in params.
    """

    ###############################################################################
    # make base query in topic_annotations table for this AnnotationTaskTopicGroup
    ###############################################################################

    # get ids of AnnotationTasks in this group

    # subquery for AnnotationTask.ids  of AnnotationTasks that point to annotation_task_topic_group of interest
    task_ids_subquery = db_session_users.query(AnnotationTask.id)\
                                        .filter_by(annotation_task_topic_group_id=annotation_task_group_id)\
                                        .subquery()

    # query TopicAnnotation table for all topic_annotations contained in any of above annotation_tasks
    # use subqueryload for annotation_job objects (to avoid another database query execution when accessing them later)
    base_query = db_session_users.query(TopicAnnotation)\
                                 .options(subqueryload(TopicAnnotation.annotation_job))\
                                 .filter(TopicAnnotation.annotation_task_id.in_(task_ids_subquery))

    #####################################
    # filtering and additional queries
    #####################################

    # filtering on topic_annotation table (part of base query table, so done first before query execution)
    if 'user_id' in params:
        base_query = base_query.filter_by(user_id=params['user_id'])
    if 'is_gold_evaluation' in params:
        base_query = base_query.filter_by(is_gold_evaluation=params['is_gold_evaluation'])

    # create list of dictionaries to return with annotation_job-related fields #
    list_of_topic_annotation_objects = base_query.all()  # NB: one database query executed here

    # create list of dicts to return
    list_of_topic_annotation_dicts = []
    for topic_annotation_object in list_of_topic_annotation_objects:
        annotation_job_dict = {'user_difficulty': topic_annotation_object.annotation_job.user_difficulty,
                               'user_tags':       topic_annotation_object.annotation_job.arbitrary_tags}
        topic_annotation_to_dict = topic_annotation_object.to_dict()
        topic_annotation_dict = merge_two_dicts(annotation_job_dict, topic_annotation_to_dict)
        list_of_topic_annotation_dicts.append(topic_annotation_dict)

    # add aggregated_annotation info if necessary (i.e. gold judgment and is_correct_judgment)
    if 'include_aggregated_annotation_info' in params:
        # if there is not aggregated_annotation info for a particular annotation, relevant fields left as None,
        # so all topic_annotation_dicts will have 'gold_judgment' and 'is_correct_judgment' fields

        # do one query to get all relevant gold topic_annotation judgments
        set_of_doc_ids = set([topic_annotation_dict['doc_id'] for topic_annotation_dict in list_of_topic_annotation_dicts])
        gold_judgment_ids_subquery = db_session_users.query(AggregatedAnnotations.gold_topic_annotation_id)\
                                                     .filter(AggregatedAnnotations.doc_id.in_(set_of_doc_ids))\
                                                     .filter_by(annotation_task_group_id=annotation_task_group_id)\
                                                     .subquery()
        gold_judgment_objects = db_session_users.query(TopicAnnotation.doc_id,
                                                       TopicAnnotation.is_positive)\
                                                .filter(TopicAnnotation.id.in_(gold_judgment_ids_subquery))\
                                                .all()  # NB: another database query executed here

        # create lookup table (keyed by doc_id) from gold_judgment_objects
        gold_judgment_dict = {gold_judgment_object.doc_id: gold_judgment_object.is_positive
                              for gold_judgment_object in gold_judgment_objects}

        # run through list_of_topic_annotation_dicts, look up gold judgment (if exists) for each topic_annotation,
        # and add to list_of_topic_annotation_dicts
        for topic_annotation_dict in list_of_topic_annotation_dicts:
            gold_judgment = None
            is_correct_judgment = None
            if topic_annotation_dict['doc_id'] in gold_judgment_dict:
                gold_judgment = gold_judgment_dict[topic_annotation_dict['doc_id']]
                is_correct_judgment = gold_judgment == topic_annotation_dict['is_positive']
            topic_annotation_dict.update({'gold_judgment':       gold_judgment,
                                          'is_correct_judgment': is_correct_judgment})

    # filtering/sorting on annotation_job fields (this is done on list_of_topic_annotation_dicts list)
    # NB: tags here are added by the annotators to annotation_jobs (not admin), so no guarantee they are accurate

    ###################
    # more filtering
    ###################

    if 'user_arbitrary_tag' in params:
        list_of_topic_annotation_dicts = [d for d in list_of_topic_annotation_dicts
                                          if params['user_arbitrary_tag'] in d['user_tags']]
    if 'user_difficulty' in params:
        list_of_topic_annotation_dicts = [d for d in list_of_topic_annotation_dicts
                                          if d['user_difficulty'] == params['user_difficulty']]
    if 'is_correct_judgment' in params and 'include_aggregated_annotation_info' in params:
        # NB: str() call here is because booleans come through as strings in url parameters
        list_of_topic_annotation_dicts = [d for d in list_of_topic_annotation_dicts
                                          if str(d['is_correct_judgment']) == params['is_correct_judgment']]

    ###################
    # sorting
    ###################

    if 'sorting' in params:
        # sorting by difficulty or by accuracy
        if params['sorting'] == 'user_difficulty' or (params['sorting'] == 'is_correct_judgment'
                                                      and 'include_aggregated_annotation_info' in params):
            list_of_topic_annotation_dicts = sorted(list_of_topic_annotation_dicts,
                                                    key=lambda dic: dic[params['sorting']])

    #############################################
    # return list of topic_annotation dicts
    #############################################

    return jsonify(list_of_topic_annotation_dicts)


# useful for onboarding mode
def get_user_accuracies_for_topic_group(params):
    """
    Get annotation accuracy (as judged by gold annotations) for (user, topic_group) pairs.
    Default (with no params) is to return all (user, topic_group) accuracy pairs; otherwise
    return the accuracy stats for specific user and/or specific topic (annotation_task_group).

    :param params (dict, in url request): dict of optional parameters.

            optional keys and values:

                     'user_id' (str): user id (int)

                     'topic_id' (str): topic_id (int)

    :return: (list[dict]), where each dict is of the form
                            {'user_id':                          int,
                             'topic_id':                         int,
                             'topic_name':                       str,
                             'gold_agreement_rate':              float or None},
                and gold_agreement_rate is how often the given user's annotations agree with gold annotations
                for that annotation_task_topic_group.
    """

    # base query collects is_gold_evaluation=True topic_annotations
    base_query = db_session_users.query(TopicAnnotation.user_id,
                                        TopicAnnotation.topic_id,
                                        TopicAnnotation.topic_name,
                                        TopicAnnotation.doc_id,
                                        TopicAnnotation.is_positive)\
                                 .filter_by(is_gold_evaluation=True)

    # filtering on user_id or topic_id (NB: sqlalchemy automatically handles unicode ids from url params)
    if 'user_id' in params:
        base_query = base_query.filter_by(user_id=params['user_id'])

    if 'topic_id' in params:
        base_query = base_query.filter_by(topic_id=params['topic_id'])

    # sorting - first by user, then by topic (for now, ALWAYS sorting)
    base_query = base_query.order_by(TopicAnnotation.user_id, TopicAnnotation.topic_id)

    # create list of topic_annotation objects for getting gold_agreement_rate from aggregated_annotation table
    topic_annotation_object_list = base_query.all()  # one database query executed here

    # ---------- get gold_annotation judgment for each annotation in topic_annotation_object_list ---------- #

    # tuples are of form (doc_id, topic_id)
    # set() is to remove duplicates, which occur when different annotators annotate same (doc_id, topic_id) combo
    doc_topic_tuples = set([(topic_annotation_object.doc_id,
                             topic_annotation_object.topic_id)
                            for topic_annotation_object in topic_annotation_object_list])

    # get ids of gold judgment topic annotations
    gold_judgment_ids_subquery = db_session_users.query(AggregatedAnnotations.gold_topic_annotation_id)\
                                            .filter(tuple_(AggregatedAnnotations.doc_id,
                                                           AggregatedAnnotations.topic_id).in_(doc_topic_tuples))\
                                            .subquery()
    # get gold judgments
    gold_judgment_objects = db_session_users.query(TopicAnnotation.doc_id,
                                                   TopicAnnotation.topic_id,
                                                   TopicAnnotation.is_positive)\
                                            .filter(TopicAnnotation.id.in_(gold_judgment_ids_subquery))\
                                            .all()  # another database query executed here

    # create lookup table (keyed by (doc_id, topic_id)) from gold_judgment_objects
    gold_judgment_dict = {(gold_judgment_object.doc_id,
                           gold_judgment_object.topic_id): gold_judgment_object.is_positive
                          for gold_judgment_object in gold_judgment_objects}

    # make annotation list (this is already sorted - aggregation can happen in one pass)
    topic_annotation_dict_list = [{'user_id': topic_annotation_object.user_id,
                                   'topic_id': topic_annotation_object.topic_id,
                                   'topic_name': topic_annotation_object.topic_name,
                                   'doc_id': topic_annotation_object.doc_id,
                                   'is_positive': topic_annotation_object.is_positive}
                                  for topic_annotation_object in topic_annotation_object_list]

    # add is_correct_judgment to each topic_annotation
    for topic_annotation_dict in topic_annotation_dict_list:
        is_correct_judgment = None
        if (topic_annotation_dict['doc_id'], topic_annotation_dict['topic_id']) in gold_judgment_dict:
            gold_judgment = gold_judgment_dict[(topic_annotation_dict['doc_id'], topic_annotation_dict['topic_id'])]
            is_correct_judgment = gold_judgment == topic_annotation_dict['is_positive']
        topic_annotation_dict.update({'is_correct_judgment': is_correct_judgment})

    # ------------------ aggregate gold_agreement statistic --------------------------- #

    # make dict with key (user_id, topic_id) and values [is_correct_judgment_1, ... ]
    # is_correct_judgment can have values True, False, or None
    topic_annotation_grouped_dict = defaultdict(list)
    for ta_dict in topic_annotation_dict_list:
        topic_annotation_grouped_dict[(ta_dict['user_id'], ta_dict['topic_id'])].append(ta_dict['is_correct_judgment'])

    # aggregate over each list of is_correct_judgment values
    def accuracy_from_judgment_list(acc_list):
        # returns judgment accuracy given list of judgments containing True, False and None values

        correct_judgments = len([j for j in acc_list if j is True])
        incorrect_judgments = len([j for j in acc_list if j is False])
        total = correct_judgments + incorrect_judgments
        if total == 0:
            return None
        return float(correct_judgments)/total

    for key, value in topic_annotation_grouped_dict.iteritems():
        topic_annotation_grouped_dict[key] = accuracy_from_judgment_list(value)

    # make correct return type now to test old tests - maybe update return type later to allow for easier sorting...
    return_list = []
    for key, value in topic_annotation_grouped_dict.iteritems():
        return_dict = {'user_id': key[0],
                       'topic_id': key[1],
                       'topic_name': AggregatedAnnotations.topic_id_name_mapping[key[1]],
                       'gold_agreement_rate': value}
        return_list.append(return_dict)

    return jsonify(return_list)


def create_annotation_task_group(params):

    # create annotation_task_group object and add to database
    new_annotation_task_group = AnnotationTaskTopicGroup(params)
    db_session_users.add(new_annotation_task_group)
    db_session_users.commit()
    db_session_users.refresh(new_annotation_task_group)
    #TODO: add check here about whether tasks ids in params actually exist

    task_group_dict = new_annotation_task_group.to_dict()
    return {"annotation_task_group": task_group_dict}


def update_annotation_task_group(annotation_task_group_id, params):

    # params is dict that can contain keys "name", "description", "annotation_task_ids"
    # and "arbitrary_tags"

    # get original annotation task group
    original_annotation_task_group = db_session_users.query(AnnotationTaskTopicGroup)\
                                                     .filter_by(id=annotation_task_group_id)\
                                                     .first()

    # check that task group exists
    if original_annotation_task_group is None:
        return jsonify({'errors': 'This annotation task group does not exist'}), 400

    # apply easy updates to annotation task group (i.e. just overwriting name or description)
    if "name" in params:
        original_annotation_task_group.name = params["name"]
    if "description" in params:
        original_annotation_task_group.description = params["description"]

    # apply more difficult updates (i.e. changing arbitrary_tags or annotation_task_ids)
    # NB: for now these are simple overwrites - if needed can later update for more granular control
    if "annotation_task_ids" in params:
        original_annotation_task_group.annotation_task_ids = params["annotation_task_ids"]
    if "arbitrary_tags" in params:
        original_annotation_task_group.arbitrary_tags = params["arbitrary_tags"]

    # n.b. for case where wrong topic was chosen at outset
    if "topic_id" in params:
        original_annotation_task_group.topic_id = params['topic_id']

    if "gold_annotator_user_ids" in params:
        original_annotation_task_group.gold_annotator_user_ids = params['gold_annotator_user_ids']

    if "active_topic_annotation_model_id" in params:
        original_annotation_task_group.active_topic_annotation_model_id = params['active_topic_annotation_model_id']

    # update database with new values
    db_session_users.add(original_annotation_task_group)
    db_session_users.commit()
    task_group_to_return = original_annotation_task_group  # original task group has been updated

    # return updated annotation task group
    task_group_dict = task_group_to_return.to_dict()
    return jsonify({"annotation_task_group": task_group_dict})


# delete annotation_task_group by id
def delete_annotation_task_group(annotation_task_group_id, params):

    # find if task with this id in database
    annotation_task_group = db_session_users.query(AnnotationTaskTopicGroup)\
                                            .filter_by(id=annotation_task_group_id)\
                                            .first()
    if annotation_task_group is None:
        return jsonify({'errors': 'This annotation task group does not exist'}), 400

    # if this annotation task group exists, delete it from database
    db_session_users.delete(annotation_task_group)
    db_session_users.commit()

    return jsonify({"success": True})
