from flask import jsonify
from models import db_session_users, UserSavedSearch
from proposed_filter_helper import get_entity_by_type_and_id, get_entity_by_ids_and_type
from utilities import merge_two_dicts

def get_decorated_saved_search(saved_search):
    entity_hash = {}
    entity_type = None
    entity_value = None
    search_arg_keys_lookup = set(saved_search.search_args.keys())

    # n.b. agency&agency_id is an artifact from front-end - standardization needed
    if "act_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["act_id"]
        entity_type = "acts"
    elif "regulation_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["regulation_id"]
        entity_type = "named_regulations"
    elif "citation_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["citation_id"]
        entity_type = "citations"
    elif "bank_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["bank_id"]
        entity_type = "banks"
    elif "concept_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["concept_id"]
        entity_type = "concepts"
    elif "topic_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["topic_id"]
        entity_type = "topics"
    elif "agency" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["agency"]
        entity_type = "agencies"
    elif "agency_id" in search_arg_keys_lookup:
        entity_value = saved_search.search_args["agency_id"]
        entity_type = "agencies"

    if entity_type is not None:
        if isinstance(entity_value, list):
            entity_hash = {"entity": get_entity_by_ids_and_type(entity_type, entity_value)}
        else:
            entity_hash = {"entity": get_entity_by_type_and_id(entity_type, entity_value)}

    return merge_two_dicts(saved_search.to_dict(), entity_hash)

def get_all_saved_searches(user_id):
    all_searches = db_session_users.query(UserSavedSearch).filter_by(user_id=user_id).all()
    return {
        "saved_searches": [get_decorated_saved_search(s) for s in all_searches]
    }


def create_saved_search(user_id, params):
    name = params.get('name', None)
    name_conflict_user = db_session_users.query(UserSavedSearch).filter_by(user_id=user_id, name=name).first()
    if name_conflict_user:
        return jsonify({'errors': "Saved search name: " + name + " is already being used"}), 409

    search_args = params['search_args']
    saved_search = UserSavedSearch({'user_id': user_id, 'search_args': search_args, 'name': name})
    db_session_users.add(saved_search)
    db_session_users.commit()
    db_session_users.refresh(saved_search)
    return jsonify({"saved_search": saved_search.to_dict()})


def update_saved_search(user_id, saved_search_id, params):
    name = params.get('name', None)
    name_conflict_user = db_session_users.query(UserSavedSearch).filter_by(user_id=user_id, name=name).first()
    if name_conflict_user:
        return jsonify({'errors': "Saved search name: " + name + " is already being used"}), 409
        
    search_args = params.get('search_args', None)

    saved_search = db_session_users.query(UserSavedSearch).filter_by(id=saved_search_id, user_id=user_id).first()

    if not saved_search:
        return jsonify({"errors": "No saved search for this user and id"}), 404

    if name:
        saved_search.name = name
    if search_args:
        saved_search.search_args = search_args

    db_session_users.add(saved_search)
    db_session_users.commit()
    db_session_users.refresh(saved_search)

    return jsonify({"saved_search": saved_search.to_dict()})


def remove_saved_search(user_id, saved_search_id):
    db_session_users.query(UserSavedSearch).filter_by(id=saved_search_id, user_id=user_id).delete()
    db_session_users.commit()

    # TODO is it worth validating this?
    return {"deleted": True}

