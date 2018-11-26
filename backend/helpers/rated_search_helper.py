from flask import jsonify
from models import db_session_users, UserSearchResultRating, SearchQuery
from helpers.search_queries_helper import find_or_return_new_search_query

def create_rated_search(user_id, params):
    is_relevant = params.get('is_relevant', None)
    doc_id = params.get('doc_id', None)
    search_args = params.get('search_args', None)
    search_entry = find_or_return_new_search_query(search_args, save_and_refresh_if_new=True)
    
    # NOTE: Although data is recorded on the UserSearchResultRating table, this method is 
    # also used to keep track of ratings for data outside of a user search (ie. topic buttons relevancy) 
    user_search_result_rating = db_session_users.query(UserSearchResultRating)\
        .filter_by(user_id=user_id, doc_id=doc_id, search_query_id=search_entry.id).first()
    if user_search_result_rating is None:
        user_search_result_rating = \
            UserSearchResultRating({'user_id': user_id, 'search_query_id': search_entry.id, 'doc_id': doc_id})

    user_search_result_rating.is_relevant = is_relevant

    db_session_users.add(user_search_result_rating)
    db_session_users.commit()
    db_session_users.refresh(user_search_result_rating)
    return {}
