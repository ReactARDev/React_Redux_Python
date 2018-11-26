from helpers.utilities import merge_two_dicts
from models import db_session_users, UserFollowedEntity
import schemas.jurasticsearch as jsearch

def get_entity_from_es(user_followed_entity):
    return {
        'entity': jsearch.get_record(
            user_followed_entity.entity_id, user_followed_entity.entity_type)
    }

def get_all_followed_entities(user_id, params):
    if params:
        entity_type = params['entity_type']
        all_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=user_id, entity_type=entity_type, following=True).all()
    else:
        all_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=user_id, following=True).all()

    return {
        "followed_entities": [merge_two_dicts(e.to_dict(), get_entity_from_es(e)) for e in all_entities]
    }

def updated_followed_entity(user_id, params):
    entities = params['entities']
    followed_entities = []

    for entity in entities:
        entity_id = entity['entity_id']
        entity_type = entity['entity_type']
        following = entity['following']

        followed_entity = db_session_users.query(UserFollowedEntity).filter_by(entity_id=entity_id, entity_type=entity_type, user_id=user_id).first()

        if not followed_entity:
            followed_entity = UserFollowedEntity({'entity_id': entity_id, 'entity_type': entity_type, 'user_id': user_id})

        followed_entity.following = following
        followed_entities.append(followed_entity)

    db_session_users.add_all(followed_entities)
    db_session_users.commit()
    
    return {
        "followed_entities": [merge_two_dicts(e.to_dict(), get_entity_from_es(e)) for e in followed_entities]
    }

# utility method for state lookups, assumes one entry with the short_name
def get_state_by_short_name(type, short_name):
    full_request = { "query": {"bool": {"must": {
        "match": {
            "short_name": short_name,
        }
    }}}}

    return jsearch.query_records(full_request, type)[0]
