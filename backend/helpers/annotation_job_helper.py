import datetime
from flask import jsonify
from sqlalchemy import or_
from models import db_session_users, AnnotationJob, TopicAnnotation, AnnotationTask, UserFlaggedDocument, User, \
    Subscription, AggregatedAnnotations, SelectedSentence, TopicAnnotationExcerpt
import schemas.jurasticsearch as jsearch
from elasticsearch import NotFoundError
from sqlalchemy import func
from collections import defaultdict
from settings import ACTIVE_INDEX_NAME

# grabs the first annotation job from the top of the queue for the annotation task / user combination
# n.b. there is a very small but non-zero chance of a race condition here when multiple users are accessing the
# unassigned annotation job queue - user 1 fires db lookup, user 2 fires db lookup before user 1's commit finishes.
# with the expectation that annotation jobs take a very short amount of time, and the likelihood of the race
# condition is very low, punt for now and revisit if/when it becomes a problem
def pop_annotation_job_from_queue(annotation_task_id, user_id):
    time_now = datetime.datetime.now()

    # grabs queued annotation jobs for this task that are assigned to the user (or nobody),
    # ordered first by whether they are have a user assignment, next by highest priority,
    # and finally falling back on the oldest created
    annotation_job = db_session_users.query(AnnotationJob).filter_by(annotation_task_id=annotation_task_id)\
        .filter_by(status=AnnotationJob.QUEUED_STATUS)\
        .filter(or_(AnnotationJob.user_id == user_id, AnnotationJob.user_id == None))\
        .order_by(AnnotationJob.user_id.nullslast(), AnnotationJob.priority.desc(), AnnotationJob.created_at.asc()).first()

    # if by chance, we are in the period of time between when a task was updated, but before the next queuing run
    # came around, we want to make sure to look up annotation jobs for older annotation tasks too
    if annotation_job is None:
        old_annotation_task_ids = db_session_users.query(AnnotationTask.id).filter_by(active_task_id=annotation_task_id).subquery()
        annotation_job = db_session_users.query(AnnotationJob)\
            .filter(AnnotationJob.annotation_task_id.in_(old_annotation_task_ids)) \
            .filter_by(status=AnnotationJob.QUEUED_STATUS) \
            .filter(or_(AnnotationJob.user_id == user_id, AnnotationJob.user_id == None)) \
            .order_by(AnnotationJob.user_id.nullslast(), AnnotationJob.priority.desc(), AnnotationJob.created_at.asc()).first()

    if annotation_job is None:
        return {"annotation_job": None}

    annotation_job.status = AnnotationJob.ASSIGNED_STATUS
    annotation_job.user_id = user_id
    annotation_job.assigned_at = time_now

    db_session_users.add(annotation_job)
    db_session_users.commit()
    db_session_users.refresh(annotation_job)

    # n.b. mitigation strategy for race condition would look like: while the assigned user_id is not me -> query again
    # change status to error status if document is not found in index
    try:
        doc_dict = jsearch.get_record(annotation_job.doc_id)
    except NotFoundError:
        annotation_job.status = AnnotationJob.ERROR_STATUS
        annotation_job.notes = "Document is not found"
        db_session_users.add(annotation_job)
        db_session_users.commit()
        db_session_users.refresh(annotation_job)
        return {"errors": "Document is not found. Doc ID: " + str(annotation_job.doc_id)}

    # if this is training job, return info about correct judgment
    if annotation_job.is_gold_evaluation:
        # get gold judgment info to return with annotation_job object
        topic_group_id_subquery = db_session_users.query(AnnotationTask.annotation_task_topic_group_id)\
                                                  .filter_by(id=annotation_job.annotation_task_id)\
                                                  .subquery()  # should contain just one result
        gold_judgment_id_subquery = db_session_users.query(AggregatedAnnotations.gold_topic_annotation_id)\
                                                    .filter_by(doc_id=annotation_job.doc_id)\
                              .filter(AggregatedAnnotations.annotation_task_group_id.in_(topic_group_id_subquery))\
                                                    .subquery()
        gold_judgment_object = db_session_users.query(TopicAnnotation.is_positive,
                                                      TopicAnnotation.admin_notes)\
                                               .filter(TopicAnnotation.id.in_(gold_judgment_id_subquery))\
                                               .first()  # this query should return just one object anyway
        return {'annotation_job': annotation_job.to_dict(),
                'document': doc_dict,
                'correct_judgment': gold_judgment_object.is_positive,
                'correct_judgment_notes': gold_judgment_object.admin_notes}

    return {'annotation_job': annotation_job.to_dict(), 'document': doc_dict}


# gets an annotation_job by id, including the previously written topic_annotations, by the provided user
def get_annotation_job_by_id(annotation_task_id, annotation_job_id, user_id):
    # n.b. user_id is redundant but this should prevent shenanigans here
    annotation_job = db_session_users.query(AnnotationJob).\
        filter_by(id=annotation_job_id, user_id=user_id).first()

    annotation_job_dict = annotation_job.to_dict()
    # n.b. i deliberately left the user_id restriction here in case future QA tasks might allow super annotators
    # to edit user annotations
    topic_annotations = db_session_users.query(TopicAnnotation).filter_by(annotation_job_id=annotation_job_id)
    annotation_job_dict['topic_annotations'] = [t.to_dict() for t in topic_annotations]

    doc_dict = jsearch.get_record(annotation_job.doc_id)
    return {'annotation_job': annotation_job_dict, 'document': doc_dict}


def get_annotation_jobs_for_task(annotation_task_id, params):
    base_query = db_session_users.query(AnnotationJob).filter_by(annotation_task_id=annotation_task_id)

    if 'status' in params:
        base_query = base_query.filter_by(status=params['status'])

    if 'type' in params:
        base_query = base_query.filter_by(status=params['type'])

    # get the total number of annotation jobs before the limit+offset breakdown
    job_count_total = base_query.count()

    if 'count_only' in params:
        return {'total': job_count_total}

    # n.b. allows pagination
    if 'offset' in params:
        base_query = base_query.offset(params['offset'])

    # n.b. 20 seems a reasonable default limit
    limit = params.get('limit', 20)
    base_query = base_query.limit(limit)

    annotation_jobs = [aj.to_dict({'topic_annotation_count': True}) for aj in base_query]

    return {'annotation_jobs': annotation_jobs, 'total': job_count_total}


def create_annotations_for_job(annotation_task_id, annotation_job_id, user_id, task_type, params):
    annotation_job = db_session_users.query(AnnotationJob).filter_by(id=annotation_job_id).first()

    # if this is onboarding job, notes are required and skipping is not allowed
    if annotation_job.is_gold_evaluation:
        if 'notes' not in params:
            return jsonify({'Error': 'Notes are required for onboarding jobs'}), 400  # 400 error means "bad request"
        if 'skip' in params:
            return jsonify({'Error': 'Onboarding jobs cannot be skipped'}), 400

    # if we get a key named "complete_later", annotation should stay in the queue,
    # for example, user opens previous annotation
    # if we get a key named "error" in the params, this is being flagged as an error case
    # otherwise assume it is posting annotations and therefore complete
    if 'complete_later' in params:
        annotation_job.status = AnnotationJob.QUEUED_STATUS
    elif 'error' in params:
        annotation_job.status = AnnotationJob.ERROR_STATUS
    elif 'skip' in params:
        annotation_job.status = AnnotationJob.SKIPPED_STATUS
        annotation_job.was_skipped = True
    else:
        annotation_job.status = AnnotationJob.COMPLETE_STATUS
        annotation_job.completed_at = datetime.datetime.now()

    if 'notes' in params:
        annotation_job.notes = params['notes']

    # user difficulty for annotation job
    # NB: this doesn't include ability to set difficulty for each individual topic_annotation, in case
    #     that there is more than one topic_annotation per annotation job
    if 'user_difficulty' in params:
        annotation_job.user_difficulty = params['user_difficulty']

    # allowed tags are defined in annotation_task_group for this annotation_job;
    # a list of these tags can be retrieved when job is popped from jobs queue
    if 'arbitrary_tags' in params:
        annotation_job.arbitrary_tags = params['arbitrary_tags']

    # TopicAnnotation instances created here
    if task_type == AnnotationTask.TOPIC_ANNOTATION_TYPE and 'topic_annotations' in params:
        topic_annotations = []
        for topic_annotation in params['topic_annotations']:
            # if this is update to existing TopicAnnotation object
            if 'topic_annotation_id' in topic_annotation:
                existing_annotation = db_session_users.query(TopicAnnotation)\
                                                      .filter_by(id=topic_annotation['topic_annotation_id'])\
                                                      .first()
                existing_annotation.is_positive = topic_annotation['is_positive']
                if 'admin_notes' in topic_annotation:
                    existing_annotation.admin_notes = topic_annotation['admin_notes']  # overwrite of previous notes
                topic_annotations.append(existing_annotation)
            # otherwise create new TopicAnnotation object
            else:
                new_topic_annotation_dict = topic_annotation.copy()  # assumes no nested objects (otherwise deepcopy)
                new_topic_annotation_dict["annotation_job_id"] = annotation_job_id
                new_topic_annotation_dict["annotation_task_id"] = annotation_task_id
                new_topic_annotation_dict["user_id"] = user_id
                new_topic_annotation_dict["doc_id"] = annotation_job.doc_id

                # whether this is for annotator training/onboarding
                new_topic_annotation_dict["is_gold_evaluation"] = annotation_job.is_gold_evaluation

                new_topic_annotation_object = TopicAnnotation(new_topic_annotation_dict)
                topic_annotations.append(new_topic_annotation_object)

                # if there is topic_annotation_excerpt information, make topic_annotation_excerpt objects
                if 'topic_annotation_excerpts' in topic_annotation:
                    topic_annotation_excerpts = []
                    for topic_annotation_excerpt in topic_annotation['topic_annotation_excerpts']:
                        new_topic_annotation_excerpt_dict = topic_annotation_excerpt.copy()
                        new_topic_annotation_excerpt_object = TopicAnnotationExcerpt(new_topic_annotation_excerpt_dict)
                        topic_annotation_excerpts.append(new_topic_annotation_excerpt_object)
                    # add all new topic_annotation_excerpts to topic_annotation object
                    new_topic_annotation_object.topic_annotation_excerpts = topic_annotation_excerpts

        db_session_users.add_all(topic_annotations)

    elif task_type == AnnotationTask.SLOT_FILL_TYPE and 'selected_sentences' in params:
        selected_sentences = []
        # TODO add support for annotation updates
        for selected_sentence in params['selected_sentences']:
            selected_sentence["annotation_job_id"] = annotation_job_id
            selected_sentence["annotation_task_id"] = annotation_task_id
            selected_sentence["user_id"] = user_id
            selected_sentence["doc_id"] = annotation_job.doc_id
            selected_sentence["index_build"] = ACTIVE_INDEX_NAME
            selected_sentences.append(SelectedSentence(selected_sentence))

        db_session_users.add_all(selected_sentences)

    db_session_users.add(annotation_job)
    db_session_users.commit()

    # n.b. return a deliberately simple response here to avoid a large json response that isn't strictly needed
    return jsonify({"success": True})


def create_review_for_job(annotation_task_id, annotation_job_id, user_id, params):
    annotation_job = db_session_users.query(AnnotationJob).filter_by(id=annotation_job_id).first()
    annotation_job.status = AnnotationJob.COMPLETE_STATUS
    annotation_job.completed_at = datetime.datetime.now()
    db_session_users.add(annotation_job)
    db_session_users.commit()
    db_session_users.refresh(annotation_job)
    job = annotation_job.to_dict()
    doc = None

    if 'multiple_field' in params:
        multiple_field = params.get('multiple_field', None)
        flagged_doc = UserFlaggedDocument({
            'user_id': user_id,
            'doc_id': annotation_job.doc_id,
            'issue_type': UserFlaggedDocument.CONTRIBUTOR_ISSUE_TYPE,
            'multiple_field': multiple_field
        })

        db_session_users.add(flagged_doc)
        db_session_users.commit()
        db_session_users.refresh(flagged_doc)
        doc = flagged_doc.to_dict()

    return {"annotation_job": job, "flagged_doc": doc}


def get_currentsubscription_month_date(date):
    today = datetime.datetime.now()
    start = date
    next_start = start + datetime.timedelta(days=30)
    while(next_start < today):
        start = next_start
        next_start = next_start + datetime.timedelta(days=30)
    return start


def get_reviews_count_for_user(annotation_task_id, user_id, params):
    # fetch all previous incarnations of this task, so they can be included in statistics
    all_task_ids = [
        t[0] for t in db_session_users.query(AnnotationTask.id).filter_by(active_task_id=annotation_task_id).distinct().all()
    ]
    all_task_ids.append(annotation_task_id)

    # use the utc value for the start of the day pacific time
    now = datetime.datetime.now() - datetime.timedelta(hours=8)
    today_date = str(now.month) + "/" + str(now.day) + "/" + str(now.year)

    # get start date of the billing month
    subscription_created = db_session_users.query(Subscription.created_at).filter_by(user_id=user_id, latest=True).first()
    month_start_date = get_currentsubscription_month_date(subscription_created[0])

    # get annotation counts for user_id / is_positive pairings
    base_query = db_session_users.query(AnnotationJob).filter(AnnotationJob.annotation_task_id.in_(all_task_ids)).filter_by(user_id=user_id)\
        .filter(AnnotationJob.status == AnnotationJob.COMPLETE_STATUS)

    today_total = base_query.filter(AnnotationJob.completed_at >= today_date).count()

    current_month_total = base_query.filter(AnnotationJob.completed_at >= month_start_date).count()

    return {'today_total': today_total, 'current_month_total': current_month_total}


def get_review_breakdown_for_task(annotation_task_id, params):
    # fetch all previous incarnations of this task, so they can be included in statistics
    all_task_ids = [
        t[0] for t in db_session_users.query(AnnotationTask.id).filter_by(active_task_id=annotation_task_id).distinct().all()
    ]
    all_task_ids.append(annotation_task_id)

    # get annotation counts for user_id / is_positive pairings
    base_query = db_session_users.query(AnnotationJob.user_id, func.count(AnnotationJob.user_id))\
            .filter(AnnotationJob.annotation_task_id.in_(all_task_ids))\
            .filter(AnnotationJob.status == AnnotationJob.COMPLETE_STATUS)

    if 'from_date' in params:
        base_query = base_query.filter(AnnotationJob.completed_at >= params['from_date'])
    if 'to_date' in params:
        base_query = base_query.filter(AnnotationJob.completed_at <= params['to_date'])

    all_counts = base_query.group_by(AnnotationJob.user_id).all()


    flagged_base_query = db_session_users.query(UserFlaggedDocument.user_id, UserFlaggedDocument.status, func.count(UserFlaggedDocument.user_id)).filter_by(issue_type='contributor')
    if 'from_date' in params:
        flagged_base_query = flagged_base_query.filter(UserFlaggedDocument.created_at >= params['from_date'])
    if 'to_date' in params:
        flagged_base_query = flagged_base_query.filter(UserFlaggedDocument.created_at <= params['to_date'])

    flagged_counts = flagged_base_query.group_by(UserFlaggedDocument.user_id).group_by(UserFlaggedDocument.status).all()

    user_flagged_counts = {}
    for user_id, status, count in flagged_counts:
        if not user_id in user_flagged_counts:
            user_flagged_counts[user_id] = {}
        user_flagged_counts[user_id][status] = count

    # user_id -> email mapping for response
    user_ids = list(set([r[0] for r in all_counts]))
    user_result = db_session_users.query(User.id, User.email).filter(User.id.in_(user_ids)).all()
    user_id_email_map = {u[0]: u[1] for u in user_result}


    # build the structure of the actual response
    result = defaultdict(dict)
    totals = {"approved": 0, "flagged": 0}
    for user_id, num_reviews in all_counts:
        total_flagged = flagged = accepted = dismissed = 0
        if user_id in user_flagged_counts:
            flagged = user_flagged_counts[user_id].get(UserFlaggedDocument.FLAGGED_STATUS, 0)
            accepted = user_flagged_counts[user_id].get(UserFlaggedDocument.FIXED_STATUS, 0)
            dismissed = user_flagged_counts[user_id].get(UserFlaggedDocument.PROCESSED_STATUS, 0)
            total_flagged = flagged + accepted + dismissed
        user_email = user_id_email_map[user_id]
        total_approved = num_reviews - total_flagged
        result[user_email]['approved'] = total_approved
        result[user_email]['flagged'] = total_flagged
        result[user_email]['accepted'] = accepted
        result[user_email]['dismissed'] = dismissed
        totals['approved'] += total_approved
        totals['flagged'] += total_flagged

    result["total"] = totals
    return result


def get_all_skipped_annotation_jobs():
    base_query = db_session_users.query(AnnotationJob.doc_id, AnnotationJob.updated_at, AnnotationJob.notes, \
        User.email, AnnotationTask.topics, AnnotationJob.id, AnnotationJob.annotation_task_id, AnnotationTask.name)\
        .filter_by(status=AnnotationJob.SKIPPED_STATUS).join(User, AnnotationTask)

    annotation_jobs = [aj for aj in base_query.all()]

    jobs = []
    for j in annotation_jobs:
        job = {}
        job['doc_id'] = j[0]
        job['updated_at'] = j[1].strftime("%Y-%m-%d")
        job['notes'] = j[2]
        job['email'] = j[3]
        job['topics'] = j[4]
        job['job_id'] = j[5]
        job['task_id'] = j[6]
        job['task_name'] = j[7]
        jobs.append(job)

    return {'annotation_jobs': jobs}
