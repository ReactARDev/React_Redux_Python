from models import db_session_users, AggregatedAnnotations, TopicAnnotation, AnnotationJob,\
                                     AnnotationTaskTopicGroup
import schemas.jurasticsearch as jsearch
from sqlalchemy.orm import subqueryload
from flask import jsonify
from helpers.utilities import merge_two_dicts
import json

"""
Aggregated annotations table will be populated by a daemon job on a per annotation task group basis.
"""


def get_aggregated_annotations(topic_id, params):

    """
    For each row in metadata table view, have dict that gives immediate row AND the expanded view that comes
    from clicking on that row. All this data is returned in paginated batches (default 20 at a time).


    INPUT:

        topic_id: id name of topic (REQUIRED)
                  see list of available topic names and their ids at
                  AggregatedAnnotations.topic_id_name_mapping (dict of {id, topic_name} pairs)

        Params (dict)

        For filter/sort, have specific key for each type of filter/sort required
        For sorting, the value of the key doesn't matter (can be None).
        For filtering, the key is the column name and the value is the value to filter on.
        Available keys can be found in the "filtering and sorting" section in code below.

        params["limit"]: pagination size (optional)
        params["count_only"]: return only size of query (optional)
        params["offset"]: offset for pagination (optional)


    OUTPUT: return_dict (dict)

        return_dict looks like this:

        {
        'aggregated_annotations': agg_annotations,
        'total': job_count_total
        }

        job_count_total is integer count of how many aggregated_annotations would be returned with this filtering
                in the query BEFORE taking into account pagination

        agg_annotations is a list of aggregated_annotation dictionaries
        Each aggregated_annotation dict has all keys from aggregated_annotations.to_dict(), we well as:

        "annotation_task_topic_group_name": name of corresponding annotation task topic group
        "annotation_task_topic_group_description": description of corresponding annotation task topic group
        "doc_title": title of document (as pulled from elasticsearch)
        "judges": list of email strings of topic judges on document
        "topic_annotations": topic_annotation dict, with additional "annotation_job" key
                             for corresponding annotation_job dict
    """

    QUERY_SIZE_LIMIT = 20  # size limit on query for postgres pagination

    topic_dict = AggregatedAnnotations.topic_id_name_mapping

    # get base query - all aggregated annotations under a specific topic
    # for now topic_id is required - to make it optional, later querying will have to be modified
    if topic_id:
        base_query = db_session_users.query(AggregatedAnnotations).filter_by(topic_id=topic_id)
    else:
        return jsonify({'error': "get_aggregated_annotations route requires valid topic_id"}), 400

    ##########################
    # filtering and sorting
    ##########################

    # filtering
    # top-level keys whose values give the value to filter on
    if 'filter_doc_id' in params:
        base_query = base_query.filter_by(doc_id=params['filter_doc_id'])
    if 'filter_is_in_agreement' in params:
        base_query = base_query.filter_by(is_in_agreement=params['filter_is_in_agreement'])
    if 'filter_is_gold_standard' in params:
        base_query = base_query.filter_by(is_gold_standard=params['filter_is_gold_standard'])
    if 'filter_is_active_for_gold_annotation' in params:
        base_query = base_query.filter_by(is_active_for_gold_annotation=params['filter_is_active_for_gold_annotation'])
    if 'filter_gold_difficulty' in params:
        base_query = base_query.filter_by(gold_difficulty=params['filter_gold_difficulty'])

    # sorting
    # NB: the values here don't matter - just the presence of the key
    if 'sorting_doc_id' in params:
        if params['sorting_doc_id'] == 'ascending':
            base_query = base_query.order_by(AggregatedAnnotations.doc_id.asc())
        if params['sorting_doc_id'] == 'descending':
            base_query = base_query.order_by(AggregatedAnnotations.doc_id.desc())
    if 'sorting_is_gold_standard' in params:
        if params['sorting_is_gold_standard'] == 'ascending':
            base_query = base_query.order_by(AggregatedAnnotations.is_gold_standard.asc())
        if params['sorting_is_gold_standard'] == 'descending':
            base_query = base_query.order_by(AggregatedAnnotations.is_gold_standard.desc())
    if 'sorting_gold_difficulty' in params:
        if params['sorting_gold_difficulty'] == 'ascending':
            base_query = base_query.order_by(AggregatedAnnotations.gold_difficulty.asc())
        if params['sorting_gold_difficulty'] == 'descending':
            base_query = base_query.order_by(AggregatedAnnotations.gold_difficulty.desc())
    if 'sorting_is_in_agreement' in params:
        if params['sorting_is_in_agreement'] == 'ascending':
            base_query = base_query.order_by(AggregatedAnnotations.is_in_agreement.asc())
        if params['sorting_is_in_agreement'] == 'descending':
            base_query = base_query.order_by(AggregatedAnnotations.is_in_agreement.desc())
    if 'sorting_arbitrary_tags' in params:
        if params['sorting_arbitrary_tags'] == 'ascending':
            base_query = base_query.order_by(AggregatedAnnotations.arbitrary_tags.asc())
        if params['sorting_arbitrary_tags'] == 'descending':
            base_query = base_query.order_by(AggregatedAnnotations.arbitrary_tags.desc())
    if 'sorting_notes' in params:
        if params['sorting_notes'] == 'ascending':
            base_query = base_query.order_by(AggregatedAnnotations.notes.asc())
        if params['sorting_notes'] == 'descending':
            base_query = base_query.order_by(AggregatedAnnotations.notes.desc())

    #####################################################################
    # do pagination with offset (see annotation_job_helper.py, line 89)
    #####################################################################

    # get the total number of aggregated annotations found BEFORE the pagination limit+offset breakdown
    job_count_total = base_query.count()

    # return only count if necessary
    if 'count_only' in params:
        return jsonify({'total': job_count_total})

    # n.b. allows pagination
    if 'offset' in params:
        base_query = base_query.offset(params['offset'])

    # n.b. 20 seems a reasonable default limit - can be changed depending on needs
    limit = params.get('limit', QUERY_SIZE_LIMIT)
    base_query = base_query.limit(limit)


    ############################################
    # create list of dicts that will be returned
    ############################################
    agg_annotations = [agg.to_dict() for agg in base_query]

    ################################################################
    # add name and description of each annotation task topic group
    ################################################################
    for agg in agg_annotations:
        group = db_session_users.query(AnnotationTaskTopicGroup).filter_by(id=agg['annotation_task_group_id']).first()
        agg['annotation_task_topic_group_name'] = group.name
        agg['annotation_task_topic_group_description'] = group.description

    ####################################
    # query Elasticsearch and postgres
    ####################################

    # get doc_ids for queries in ES and postgres
    doc_ids = [agg["doc_id"] for agg in agg_annotations]

    # Elasticsearch query to get document titles
    query = {
        "size": len(doc_ids),
        "query": {
            "bool": {
                "must": {
                    "terms": {"id": doc_ids}
                }
            }
        },
        "_source": {"include": ["id", "title"]}
    }
    # make doc_title_dict keyed by doc_id for fast lookup
    doc_title_dict = {d["id"]: d["title"] for d in jsearch.query_records(query, 'documents')}
    # N.B.: jsearch.query_records(query, 'documents') returns array with elements of form
    #                                             {'id': 240394, 'title': "Blah blah blah"}

    # get all topic_annotations with this topic and these doc_ids
    # subqueryload used to load AnnotationJob objects explicitly
    topic_name = None
    if topic_id is not None:
        topic_name = topic_dict[topic_id]
    # topic_name = None
    ta_query_result = db_session_users.query(TopicAnnotation)\
                                      .options(subqueryload(TopicAnnotation.annotation_job))\
                                      .options(subqueryload(TopicAnnotation.user))\
                                      .filter(TopicAnnotation.doc_id.in_(doc_ids))\

    if topic_id is not None:
        ta_query_result = ta_query_result.filter_by(topic_name=topic_dict[topic_id])

    ta_query_result = ta_query_result.all()
    ############################################################
    # aggregated desired fields from ES/postgres query results
    ############################################################

    # make doc_id-keyed dict of selected agg_ants for efficiently aggregating results
    agg_annot_dict = {agg["doc_id"]: agg for agg in agg_annotations}

    # set up empty lists to store topic_annotations and judges in each agg dict;
    # collect document titles into each agg dict
    for agg in agg_annotations:
        agg["topic_annotations"] = []
        agg["judges"] = []
        if agg["doc_id"] in doc_title_dict:
            agg["doc_title"] = doc_title_dict[agg["doc_id"]]
    # collect TopicAnnotations, AnnotationJobs and judges into agg dictionaries
    for ta in ta_query_result:
        matching_agg = agg_annot_dict[ta.doc_id]  # get relevant aggregated_annotation
        ta_dict = ta.to_dict()  # get topic_annotation dict
        ta_dict["annotation_job"] = ta.annotation_job.to_dict()  # using subqueryload of annotation_job
        matching_agg["topic_annotations"].append(ta_dict)  # TopicAnnotation
        matching_agg["judges"].append(ta.user.email)  # append to list of judges (used subquery here as well)

        # NB: in case we want to include first_name and last_name at a later date:
        # matching_agg["judges"].append(ta.user.first_name + ta.user.last_name)  # append to list of judges
                                                                               # (used subqueryload here as well)

    # return result
    return jsonify({'aggregated_annotations': agg_annotations, 'total': job_count_total})


def update_aggregated_annotation(aggregated_annotation_task_id, params):
    # NB: probably shouldn't change doc_id, topic_id or annotation_task_group_id;
    # these are set at crawler level when aggregated_annotations are created

    original_agg_annotation = db_session_users.query(AggregatedAnnotations)\
                                              .filter_by(id=aggregated_annotation_task_id)\
                                              .first()
    # perform updates
    # TODO: add some checks against setting illegal foreign keys
    if 'annotation_task_group_id' in params:
        original_agg_annotation.annotation_task_group_id = params['annotation_task_group_id']
    if 'doc_id' in params:
        original_agg_annotation.doc_id = params['doc_id']
    if 'topic_id' in params and params['topic_id'] in AggregatedAnnotations.topic_id_name_mapping:
        original_agg_annotation.topic_id = params['topic_id']
    if 'is_gold_standard' in params:
        original_agg_annotation.is_gold_standard = params['is_gold_standard']
    if 'gold_topic_annotation_id' in params:
        original_agg_annotation.gold_topic_annotation_id = params['gold_topic_annotation_id']
    if 'is_active_for_gold_annotation' in params:
        original_agg_annotation.is_active_for_gold_annotation = params['is_active_for_gold_annotation']
    if 'gold_difficulty' in params:
        original_agg_annotation.gold_difficulty = params['gold_difficulty']
    if 'arbitrary_tags' in params:
        original_agg_annotation.arbitrary_tags = params['arbitrary_tags']
    # NB: 'is_in_agreement' should depend on annotation agreement somewhere
    if 'is_in_agreement' in params:
        original_agg_annotation.is_in_agreement = params['is_in_agreement']
    if 'notes' in params:
        original_agg_annotation.notes = params['notes']
    # for the dict 'details' do a merge that retains all existing keys;
    # if same key "k1" appears in both dicts, older value is overwritten by new value in params['details']["k1"]
    if 'details' in params:
        original_agg_annotation.details = merge_two_dicts(original_agg_annotation.details, params['details'])

    # commit updates to database
    db_session_users.add(original_agg_annotation)
    db_session_users.commit()

    # return updated values
    agg_task_dict = original_agg_annotation.to_dict()
    return jsonify({"aggregated_annotation": agg_task_dict})


def update_research_mode_expanded_view(aggregated_annotation_id, params):
    """
    updates to topic_annotation columns can include "is_positive", "admin_notes" and "user_id"

    updates to annotation_job can include "notes", "tags" and "difficulty"

    If "is_positive" is updated, params must also contain the "user_id" of the annotator who
    did the updating. In this case, the user_id field in both the topic_annotation and its
    corresponding annotation_job are updated

    If 'arbitrary_tags' or 'difficulty' is updated and the job is a gold standard, the tags/difficulty
    are copied to 'arbitrary_tags' or 'gold_difficulty' of the aggregated_annotation containing this task.


    aggregated_annotation_id: id of aggregated_annotation containing the topic_annotation/annotationjob
                              to be updated
    params is of form {
                       'topic_annotation_id': topic_annotation_id (int)
                       'topic_annotation_updates': {column1_name: column1_value, ...},
                       'annotation_job_updates': {column1_name: column1_value, ...}
                      }

    For key-value pairs for updates:

        topic_annotation_updates:
            'is_positive': True/False (bool)
            'admin_notes': 'string' (string, arbitrary)
            'user_id': user_id (int, foreign key from user table; required if 'is_positive' is present)

        annotation_job_updates:
            'arbitrary_tags':         ["tag1", "tag2", ... ] (list)
            'user_difficulty':        'easy'/'medium'/'hard' (string)
            'notes':                   'bananas, almond milk.  wait wrong notes.' (string)
    """

    # get original topic_annotation and annotation_job objects
    topic_annotation = db_session_users.query(TopicAnnotation)\
                                       .filter_by(id=params['topic_annotation_id'])\
                                       .first()
    annotation_job = db_session_users.query(AnnotationJob)\
                                     .filter_by(id=topic_annotation.annotation_job_id)\
                                     .first()
    aggregated_annotation_object = None  # only needed if arbitrary_tags or user_difficulty updates occur

    # do topic_annotation updates
    if 'topic_annotation_updates' in params:
        ta_update_dict = params['topic_annotation_updates']

        if 'is_positive' in ta_update_dict:
            # in this case params must also contain the 'user_id' of person doing updating

            # record information about the previous user_id and their annotation_status
            # record this in a list of dicts that is under 'previous_annotators' key in details field
            if not topic_annotation.details:
                topic_annotation.details = {'previous_annotators': []}
            previous_annotator_dict = {
                'user_id': topic_annotation.user_id,
                'updated_at': topic_annotation.updated_at.utcnow().isoformat(),
                'is_positive': topic_annotation.is_positive
            }
            topic_annotation.details['previous_annotators'].append(previous_annotator_dict)

            # update user_id in both topic_annotation and corresponding annotation_job
            topic_annotation.user_id = ta_update_dict['user_id']
            annotation_job.user_id = ta_update_dict['user_id']

            # do topic_annotation update
            topic_annotation.is_positive = ta_update_dict['is_positive']

        if 'admin_notes' in ta_update_dict:
            # simple overwrite
            topic_annotation.admin_notes = ta_update_dict['admin_notes']

        db_session_users.add(topic_annotation)

    # do annotation_job updates
    if 'annotation_job_updates' in params:
        job_update_dict = params['annotation_job_updates']

        # get corresponding aggregated_annotation object in case potential updates to gold standard are needed
        if ('arbitrary_tags' in job_update_dict) or ('user_difficulty' in job_update_dict):
            aggregated_annotation_object = db_session_users.query(AggregatedAnnotations)\
                                                           .filter_by(id=aggregated_annotation_id)\
                                                           .first()

        if 'arbitrary_tags' in job_update_dict:
            # tags are required on frontend to come from annotation_task_groups.arbitrary_tags for relevant task group

            # assumes exactly one task group contains task that spawned this annotation - if no group contains
            #     this task, then an update to arbitrary_tags is not allowed

            allowed_tags = []
            # get current active task id for this task
            active_task_id = topic_annotation.annotation_task_id
            current_active_task_id = topic_annotation.annotation_task.active_task_id
            if current_active_task_id is not None:
                active_task_id = current_active_task_id
            # find the group that contains this task; if no group or more than one group, raises error (from .one())
            task_group = db_session_users.query(AnnotationTaskTopicGroup)\
                                         .filter(AnnotationTaskTopicGroup.annotation_task_ids.any(active_task_id))\
                                         .one()
            if task_group:
                allowed_tags = task_group.arbitrary_tags  # allowed tags pulled from group containing task

            updated_tags = [tag for tag in job_update_dict['arbitrary_tags'] if tag in allowed_tags]
            annotation_job.arbitrary_tags = updated_tags

            # if this job is a gold annotation, update aggregated_annotation.arbitrary_tags to be these tags
            if aggregated_annotation_object.gold_topic_annotation_id == params['topic_annotation_id']:
                aggregated_annotation_object.arbitrary_tags = updated_tags

        if 'user_difficulty' in job_update_dict:
            # difficulty must be 'easy', 'medium', or 'hard' - todo: handle error case more explicitly?
            new_difficulty = job_update_dict['user_difficulty']
            if new_difficulty in ['easy', 'medium', 'hard']:
                annotation_job.user_difficulty = new_difficulty

                # if this job is a gold annotation, update aggregated_annotation.gold_difficulty to be this difficulty
                if aggregated_annotation_object.gold_topic_annotation_id == params['topic_annotation_id']:
                    aggregated_annotation_object.gold_difficulty = new_difficulty

        if 'notes' in job_update_dict:
            annotation_job.notes = job_update_dict['notes']

        db_session_users.add(annotation_job)
        if aggregated_annotation_object is not None:
            db_session_users.add(aggregated_annotation_object)

    # commit changes to database
    db_session_users.commit()

    # simple return statement
    return jsonify({"success": True})


def update_research_mode_gold_standard(aggregated_annotation_id, params):
    """
    Update aggregated_annotation so that it points to a new annotation task as a gold standard.
    If the update is None, then aggregated_annotation.is_gold_standard is set to False.

    :param aggregated_annotation_id: int
    :param params: dict, must contain 'topic_annotation_id' as key with topic_annotation_id as value;
                   this is the topic_annotation that is the new gold standard
                   If topic_annotation_id is None, then no topic_annotation is a gold standard
    :return: dict
    """
    agg_annotation = db_session_users.query(AggregatedAnnotations)\
                                     .filter_by(id=aggregated_annotation_id)\
                                     .first()
    agg_annotation.gold_topic_annotation_id = params['topic_annotation_id']

    # update is_gold_standard now that gold_topic_annotation_id is set
    if agg_annotation.gold_topic_annotation_id is not None:
        agg_annotation.is_gold_standard = True
        # update arbitrary_tags and user_difficulty of agg_annotation with values from the new gold standard annotation
        gold_standard_topic_annotation = db_session_users.query(TopicAnnotation)\
                                                         .filter_by(id=params['topic_annotation_id']) \
                                                         .options(subqueryload(TopicAnnotation.annotation_job))\
                                                         .first()
        agg_annotation.arbitrary_tags = gold_standard_topic_annotation.annotation_job.arbitrary_tags
        agg_annotation.gold_difficulty = gold_standard_topic_annotation.annotation_job.user_difficulty
    else:
        agg_annotation.is_gold_standard = False
        # update aggregated_annotation.arbitrary_tags to be nothing
        agg_annotation.arbitrary_tags = []
        agg_annotation.gold_difficulty = None

    # commit change
    db_session_users.commit()

    # n.b. return a deliberately simple response here to avoid a large json response that isn't strictly needed
    return jsonify({"success": True})
