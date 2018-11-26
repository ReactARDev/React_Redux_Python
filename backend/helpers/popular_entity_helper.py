from sqlalchemy import func, text
import datetime as dt
from models import db_session_users, UserDocument, UserAgency
import schemas.jurasticsearch as jsearch
from user_helper import get_external_user_id_subquery

# gets the N most popular docs - using how many times a document has been marked "read" as a proxy for popularity
def get_most_popular_docs(params):
    num_queries = params.get("num_queries", 5)  # n.b. 5 is an arbitrary default

    # use thirty days ago as the limit of the time range for popularity
    # n.b. bookmarkings could potentially impact this - but that is another potential way to gauge popularity so
    # that should be ok
    thirty_days_ago = dt.datetime.now() - dt.timedelta(days=30)

    most_popular_docs = db_session_users.query(UserDocument.doc_id, func.count(UserDocument.doc_id).label('total'))\
        .filter_by(read=True).filter(UserDocument.user_id.in_(get_external_user_id_subquery()))\
        .filter(UserDocument.updated_at > thirty_days_ago).group_by(UserDocument.doc_id)\
        .order_by(text('total desc')).limit(num_queries).all()

    # retrieve the document titles so we can include them in the payload with just one extra ES call
    query = {
        "query": {
            "bool": {
                "must": {
                    "terms": {"id": [d[0] for d in most_popular_docs]}
                }
            }
        },
        "_source": {"include": ["id", "title"]}
    }
    docs_with_titles = jsearch.query_records(query, 'documents')

    # create a map of the doc titles so we can easily tack this on to the id/count below
    doc_id_title_map = {d['id']: d['title'] for d in docs_with_titles}

    return {
        "popular_docs": [
            {"doc_id": d[0], "title": doc_id_title_map[d[0]], "count": d[1]} for d in most_popular_docs]
    }


# gets the N most popular sources - using how many times an agency has been followed as a proxy for popularity
# n.b. limiting to just federal agencies for now
def get_most_popular_sources(params):
    num_queries = params.get("num_queries", 5)  # n.b. 5 is an arbitrary default
    fed_agency_ids = get_all_fed_agency_ids()

    most_popular_sources = db_session_users.query(UserAgency.agency_id, func.count(UserAgency.agency_id).label('total')) \
        .filter(UserAgency.user_id.in_(get_external_user_id_subquery()))\
        .filter(UserAgency.agency_id.in_(fed_agency_ids)).group_by(UserAgency.agency_id).order_by(text('total desc'))\
        .limit(num_queries).all()

    return {
        "popular_sources": [{"agency_id": d[0], "count": d[1]} for d in most_popular_sources]
    }

# class to memoize the federal agency_ids in our system so we don't need to look these up each time
# note: the set of possible agency_ids changes very infrequently, so lets make the update interval every day
class FedAgencyIdMemoizer:
    def __init__(self):
        self.memoized_agency_ids_for_search = None
        self.last_memoized_time = None

    def get_agency_ids(self):
        if self.memoized_agency_ids_for_search is not None and self.last_memoized_time > dt.datetime.now() - dt.timedelta(days=1):
            return self.memoized_agency_ids_for_search
        else:
            self.last_memoized_time = dt.datetime.now()

            query = {
                "query": {
                    "bool": {
                        "must": {
                            "term": {"type": "federal_executive"}
                        }
                    }
                },
                # n.b. 1000 is arbitrary but needs to be set higher than the total # of fed agencies (currently ~400)
                "size": 1000,
                "_source": {"include": ["id"]}
            }
            agency_ids = [a['id'] for a in jsearch.query_records(query, 'agencies')]

            self.memoized_agency_ids_for_search = agency_ids
            return self.memoized_agency_ids_for_search

agency_id_memoizer = FedAgencyIdMemoizer()
def get_all_fed_agency_ids():
    return agency_id_memoizer.get_agency_ids()