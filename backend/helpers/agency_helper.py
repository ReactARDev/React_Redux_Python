from flask import g
from models import *
from helpers.utilities import str_to_bool
from search_helper import *
import schemas.jurasticsearch as jsearch
from flask import jsonify

# defaults: fincen, sec, occ, eop, frs, treas, fdic, cfpb, nyse, finra, ebsa, doj, ftc, ffiec, ca-dbo, or-sos, ct-cga, ny
DefaultAgencies = [194, 466, 80, 538, 188, 497, 164, 573, 9015, 9030, 131, 268, 192, 168, 100000, 200000, 300000, 400000]

# fdic, cfpb, sec, occ, finra, ca-dbo
DefaultAgenciesToFollowAtSignup = [164, 573, 466, 80, 9015, 100000]

######################################################################################################
## NB: was agency_helper
######################################################################################################

# Takes a set of parameters, and returns the agencies that match the criteria within
INCLUDED_AGENCY_FIELDS = ['id', 'name', 'short_name', 'type']
def get_filtered_agencies(params):
    query = {}
    following = params.get('following', None)
    search_filter = params.get('search_filter', None)
    if following:
        followed = get_followed_agency_ids_with_backoff(g.user_id)
        following = str_to_bool(following)

        if following:
            query = {"query": {"bool": {"must": es_filter(followed, "id")}}}
        else:
            query = {"query": {"bool": {"must_not": es_filter(followed, "id")}}}
    elif search_filter:
        query = {"query": {"bool": {"must": es_filter("true", "active")}}}
    query["size"] = 500
    query["_source"] = {"include": INCLUDED_AGENCY_FIELDS}

    return jsearch.query_records(query, 'agencies')

def get_agency_info_by_id(agency_id):
    if agency_id is None:
        return jsonify({"errors": "No agency_id param"}), 400
    ret_agency = {}
    es_params = {"_source_include": ",".join(INCLUDED_AGENCY_FIELDS)}
    try:
        ret_agency = jsearch.get_record(agency_id, doc_type='agencies', params=es_params)
    except Exception as e:
        return jsonify({"errors": "Not found"}), 404
    if ret_agency:
        return ret_agency, 200
    else:
        return jsonify({"errors": "Not found"}), 404


# includes a backoff to use the default agency list if nothing is being followed
def get_followed_agency_ids_with_backoff(user_id):
    followed = get_followed_agency_ids(user_id)

    if len(followed) == 0:
        followed = DefaultAgencies

    return followed

def get_followed_agency_ids(user_id):
    return [x[0] for x in db_session_users.query(UserAgency.agency_id).filter_by(user_id=user_id, following=True).all()]


# Takes an agency id and parameters, and updates that agency with said parameters
def update_agency(params):
    # build up a response dictionary with changes made
    response_dict = {}

    user_agencies = []
    for agency in params['agencies']:
        agency_id = agency['id']
        agency_following = agency['following']
        user_agency = db_session_users.query(UserAgency).filter_by(agency_id=agency_id, user_id=g.user_id).first()
        if user_agency:
            user_agency.following = agency_following
        else:
            user_agency = UserAgency({'user_id': g.user_id, 'agency_id': agency_id, 'following': agency_following})

        user_agencies.append(user_agency)

    db_session_users.add_all(user_agencies)
    db_session_users.commit()

    response_dict['agencies'] = params['agencies']
    response_dict['success'] = True

    return response_dict
