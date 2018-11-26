from flask import g
from models import *
import schemas.jurasticsearch as jsearch

def get_user_topics():
    topics = db_session_users.query(UserTopic).filter_by(user_id=g.user_id).all()
    return [topic.to_dict() for topic in topics]

def update_user_topics(params):
    topics = params.get('topics', None)
    user_topics_for_db = []
    for topic in topics:
        topic_from_db = db_session_users.query(UserTopic).filter_by(user_id=g.user_id, topic_id=topic['id']).first()
        if topic_from_db:
            topic_from_db.following = topic['following']
            user_topics_for_db.append(topic_from_db)
        else:
            user_topics_for_db.append(UserTopic({
                'user_id': g.user_id,
                'topic_id': topic['id'],
                'following': topic['following']
            }))
    db_session_users.add_all(user_topics_for_db)
    db_session_users.commit()
    return {'topics': topics, 'success': True}

def get_user_followed_topic_ids():
    topics = db_session_users.query(UserTopic).filter_by(user_id=g.user_id, following=True).all()
    return [topic.to_dict()['id'] for topic in topics]

def get_all_topic_ids_for_search():
    return [t[0] for t in db_session_users.query(UserTopic.topic_id).distinct().all()]
