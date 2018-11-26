from flask import g
from elasticsearch import NotFoundError
from models import *
import schemas.jurasticsearch as jsearch

def get_topic_judgment_for_user():
    topic_judgment = db_session_users.query(TopicJudgment) \
        .filter_by(status='assigned') \
        .filter_by(user_id=g.user_id) \
        .order_by(TopicJudgment.topic_id, TopicJudgment.updated_at) \
        .first()

    if topic_judgment is None:
        topic_judgment = db_session_users.query(TopicJudgment) \
            .filter_by(status='queued') \
            .order_by(TopicJudgment.topic_id, TopicJudgment.updated_at) \
            .first()

    return topic_judgment

def pop_topic_judgment():
    while True:
        topic_judgment = get_topic_judgment_for_user()
        try:
            if topic_judgment:
                doc = jsearch.get_record(topic_judgment.doc_id)
            break
        except NotFoundError:
            topic_judgment.status = 'bad_doc'
            db_session_users.add(topic_judgment)
            db_session_users.commit()

    if topic_judgment:
        topic_judgment.status = 'assigned'
        topic_judgment.user_id = g.user_id
        db_session_users.add(topic_judgment)
        db_session_users.commit()
    else:
        return {'queue': 'empty'}

    user = db_session_users.query(User).filter_by(id=g.user_id).first()

    return {
        'id': topic_judgment.id,
        'status': topic_judgment.status,
        'judgment': topic_judgment.judgment,
        'document': doc,
        'user': user.to_dict(),
        'topic_name': topic_judgment.topic_name
    }

def update_topic_judgment(topic_judgment_id, params):
    topic_judgment = db_session_users.query(TopicJudgment).filter_by(id=topic_judgment_id).first()

    # force user_id to current user, just in case of anything.
    # if other legitimate update cases come about, this will need to be conditioned on being a judgment call
    topic_judgment.user_id = g.user_id

    if 'status' in params and params['status'] in ['queued', 'judged', 'assigned', 'skipped']:
        topic_judgment.status = params['status']
        
    if 'judgment' in params:
        topic_judgment.judgment = params['judgment']

    db_session_users.add(topic_judgment)
    db_session_users.commit()

    return topic_judgment.to_dict()