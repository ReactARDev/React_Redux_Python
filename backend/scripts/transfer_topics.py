from models import *
import schemas.jurasticsearch as jsearch

old_to_new_topics = {
    'Lending': {
        'id': 1, 'name': 'Lending'
    },
    'Privacy': {
        'id': 10, 'name': 'Privacy'
    },
    'Deposits': {
        'id': 7, 'name': 'Deposits'
    },
    'Securities': {
        'id': 11, 'name': 'Securities'
    },
    'Payments':  {
        'id': 13, 'name': 'Payments'
    },
}

def transfer_topics():
    all_users = db_session_users.query(User).all()
    user_topics_for_db = []
    for user in all_users:
        if 'topics' in user.properties:
            followed_topics = user.properties['topics']
            new_followed_topics = []
            for topic in followed_topics:
                if topic in old_to_new_topics:
                    new_followed_topics.append(old_to_new_topics[topic])
            for topic in new_followed_topics:
                topic_from_db = db_session_users.query(UserTopic).filter_by(user_id=user.id, topic_id=topic['id']).first()
                if topic_from_db:
                    topic_from_db.following = True
                    user_topics_for_db.append(topic_from_db)
                else:
                    user_topics_for_db.append(UserTopic({
                        'user_id': user.id,
                        'topic_id': topic['id'],
                        'following': True
                    }))
    db_session_users.add_all(user_topics_for_db)
    db_session_users.commit()
