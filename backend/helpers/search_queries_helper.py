import datetime as dt
import json
import hashlib
from sqlalchemy.sql.functions import coalesce
from sqlalchemy import func, text

from models import *
import schemas.jurasticsearch as jsearch
from user_helper import get_external_user_id_subquery
from utilities import merge_two_dicts

# helper function that sanitizes and standardizes the potential integer values that are stored
# in the search_args hash, if for example
def sanitize_search_args(search_args):
    if "agency_id" in search_args:
        if not isinstance(search_args['agency_id'], int):
            search_args['agency_id'] = int(search_args['agency_id'])
    elif "act_id" in search_args:
        if not isinstance(search_args['act_id'], int):
            search_args['act_id'] = int(search_args['act_id'])
    elif "regulation_id" in search_args:
        if not isinstance(search_args['regulation_id'], int):
            search_args['regulation_id'] = int(search_args['regulation_id'])
    elif "citation_id" in search_args:
        if not isinstance(search_args['citation_id'], int):
            search_args['citation_id'] = int(search_args['citation_id'])
    elif "concept_id" in search_args:
        if not isinstance(search_args['concept_id'], int):
            search_args['concept_id'] = int(search_args['concept_id'])
    elif "bank_id" in search_args:
        if not isinstance(search_args['bank_id'], int):
            search_args['bank_id'] = int(search_args['bank_id'])
    elif "topic_id" in search_args:
        if not isinstance(search_args['topic_id'], int):
            search_args['topic_id'] = int(search_args['topic_id'])

    return search_args

# helper method to return the existing search query, or create it and return a new object for it if it does
# not yet exist
def find_or_return_new_search_query(search_args, save_and_refresh_if_new=False):
    search_args = sanitize_search_args(search_args)
    search_args_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
    search_entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=search_args_hash).first()

    if search_entry is None:
        # for proposed filters, this is false, as we've curated it, but if there is no filter, and this is a query
        # search, then we mark it as true
        is_arbitrary_query = False

        # For the very first time only, we need to figure out the display name - and avoid extra API queries
        # per update or per fetch of the top 5 options
        display_name = None
        if "agency_id" in search_args:
            agency = jsearch.get_record(search_args['agency_id'], "agencies")
            display_name = agency["name"]
        elif "act_id" in search_args:
            act = jsearch.get_record(search_args['act_id'], "acts")
            display_name = act["name"]
        elif "regulation_id" in search_args:
            reg = jsearch.get_record(search_args['regulation_id'], "named_regulations")
            display_name = reg["name"]
        elif "citation_id" in search_args:
            cite = jsearch.get_record(search_args['citation_id'], "citations")
            display_name = cite["name"]
        elif "concept_id" in search_args:
            concept = jsearch.get_record(search_args['concept_id'], "concepts")
            display_name = concept["name"]
        elif "bank_id" in search_args:
            bank = jsearch.get_record(search_args['bank_id'], "banks")
            display_name = bank["name"]
        elif "topic_id" in search_args:
            topic = jsearch.get_record(search_args['topic_id'], "topics")
            display_name = topic["name"]
        elif "query" in search_args:
            is_arbitrary_query = True

        # TODO should we have a rollback case for possible race conditions on the create call
        search_entry = SearchQuery(search_args=search_args, display_name=display_name,
                                   is_arbitrary_query=is_arbitrary_query)

        # in the new case, when this flag is set, save and refresh the value
        if save_and_refresh_if_new:
            db_session_users.add(search_entry)
            db_session_users.commit()
            db_session_users.refresh(search_entry)

    return search_entry

def track_search_query(user_id, params):
    search_args = params["search_args"]
    search_entry = find_or_return_new_search_query(search_args)

    user_search_query = UserSearchQuery(user_id=user_id)
    search_entry.user_search_queries.append(user_search_query)

    db_session_users.add(search_entry)
    db_session_users.commit()

def get_top_search_queries(params):
    # n.b. default to 5 as a "reasonable" guess on what we want
    num_queries = params.get("num_queries", 5)

    # use thirty days ago as the limit of the time range for popularity
    thirty_days_ago = dt.datetime.now() - dt.timedelta(days=30)

    # create a subquery to grab only search query ids that are non-arbitrary. i.e. they came from proposed
    # filter selections and not arbitrary user-derived string searches
    non_arbitrary_search_subquery = db_session_users.query(SearchQuery.id)\
        .filter(coalesce(SearchQuery.is_arbitrary_query, False) != True).subquery()

    # n.b. restrict to non-arbitrary queries so these are only from the curated list and from external users
    top_queries = db_session_users.query(UserSearchQuery.search_query_id,
                                      func.count(UserSearchQuery.search_query_id).label('total')) \
        .filter(UserSearchQuery.user_id.in_(get_external_user_id_subquery()))\
        .filter(UserSearchQuery.search_query_id.in_(non_arbitrary_search_subquery))\
        .filter(UserSearchQuery.updated_at > thirty_days_ago).group_by(UserSearchQuery.search_query_id)\
        .order_by(text('total desc')).limit(num_queries).all()

    # look up the search query objects themselves for just the top entries
    search_queries = db_session_users.query(SearchQuery).filter(SearchQuery.id.in_([s[0] for s in top_queries])).all()
    search_query_lookup = {s.id: s for s in search_queries}

    top_query_dicts = [merge_two_dicts(search_query_lookup[s[0]].to_dict(), {"search_count": s[1]}) for s in top_queries]
    return {"search_queries": top_query_dicts}
