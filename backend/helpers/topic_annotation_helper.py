from collections import defaultdict
from sqlalchemy import func, text
from models import db_session_users, AnnotationJob, TopicAnnotation, AnnotationTask, User

def get_topic_annotation_breakdown_for_task(annotation_task_id, params):
    # fetch all previous incarnations of this task, so they can be included in statistics
    all_task_ids = [
        t[0] for t in db_session_users.query(AnnotationTask.id).filter_by(active_task_id=annotation_task_id).distinct().all()
    ]
    all_task_ids.append(annotation_task_id)

    # get annotation counts for user_id / is_positive pairings
    base_query = db_session_users.query(TopicAnnotation.user_id, TopicAnnotation.is_positive, func.count(TopicAnnotation.user_id))\
            .filter(TopicAnnotation.annotation_task_id.in_(all_task_ids))

    if 'to_date' in params and 'from_date' in params:
        base_query = base_query.filter(TopicAnnotation.created_at > params['from_date'])\
            .filter(TopicAnnotation.created_at < params['to_date'])
    elif 'from_date' in params:
        base_query = base_query.filter(TopicAnnotation.created_at > params['from_date'])
    elif 'to_date' in params:
        base_query = base_query.filter(TopicAnnotation.created_at < params['to_date'])

    all_counts = base_query.group_by(TopicAnnotation.user_id).group_by(TopicAnnotation.is_positive).all()

    # user_id -> email mapping for response
    user_ids = list(set([r[0] for r in all_counts]))
    user_result = db_session_users.query(User.id, User.email).filter(User.id.in_(user_ids)).all()
    user_id_email_map = {u[0]: u[1] for u in user_result}

    # get all skipped annotations
    all_skipped = db_session_users.query(AnnotationJob.user_id, func.count(AnnotationJob.user_id)).filter_by(was_skipped=True)\
    .group_by(AnnotationJob.user_id).all()
    user_id_total_skipped_map = {s[0]: s[1] for s in all_skipped}

    # build the structure of the actual response
    result = defaultdict(dict)
    totals = {"positive": 0, "negative": 0}
    for user_id, is_positive, num_annotations in all_counts:
        user_email = user_id_email_map[user_id]
        polarity = "positive" if is_positive else "negative"
        result[user_email][polarity] = num_annotations
        totals[polarity] += num_annotations
        # add number of skipped docs
        if user_id in user_id_total_skipped_map:
            result[user_email]["skipped"] = user_id_total_skipped_map[user_id]
        else:
            result[user_email]["skipped"] = 0

    result["total"] = totals
    return result