import re
from collections import defaultdict
import elasticsearch

from flask import g, jsonify
from models import *
from helpers.utilities import merge_two_dicts, str_to_bool

from settings import API_ENV, ACTIVE_INDEX_NAME, MAINSTREAM_NEWS_ENABLED

import schemas.jurasticsearch as jsearch
from search_helper import *
from agency_helper import DefaultAgencies, get_followed_agency_ids
from topics_helper import get_user_followed_topic_ids, get_all_topic_ids_for_search
from followed_entity_helper import get_all_followed_entities

AttributeName = {
    'compliance_date': 'rule.effective_on',
    'comments_close_date': 'rule.comments_close_on',
    'agency_id': 'agencies.id'
}

PhraseBoostFields = ["full_text", "summary_text", "title"]

MaxQueryLength = 10
DefaultNameNGrams = [2, 3]
DefaultPhraseNGrams = [3]

## NB: extra boost for resolved references (perhaps doclen-based)?
TermBoostFields = ["acronym_mentions"]

NameBoostFields = [
    "act_mentions",
    "cfr_mentions",
    "concept_mentions",
    "org_mentions",
    "person_mentions",
    "place_mentions",
    "publaw_mentions",
    "reg_mentions",
    "usc_mentions",
    "acts.name",
    "acts.short_name",
    "acts.usc",
    "acts.publaw",
    "acts.statute",
    "rule.name",
    "rule.short_name",
    "cfr_parts.name",
    "regulations.title"
]

# Simple list of fields that are currently not used by any route
UNUSED_FIELDS_BY_ALL = [
    "acts", "agencies.active", "agencies.description", "agencies.slug", "agencies.url", "agency_update",
    "audit_entries", "cited_associations", "clean_citations", "enforcement", "full_path", "full_text_hash",
    "important_dates", "incoming_citation_ids", "meta_table", "rule.id", "rule.significant", "xml_path"
]

# Simple list of fields that are currently not used by the document list route in the front-end and can be skipped
# by passing a simple boolean flag
# note: children & citations are used by (and returned by) the single-fetch document route which does not
# currently use these restrictions
# n.b. dockets is only used from the docket_timelines route
UNUSED_FIELDS_FOR_DOC_LIST = UNUSED_FIELDS_BY_ALL + ["cfr_parts", "children", "dockets", "parent"]

# Simple list of fields that are currently not used by the full document fetch route for state code items and can be
# skipped by passing a simple boolean flag
# note: cfr_parts and dockets are unused by the state code navigator right hand panel, full_text is only needed
# for the doc list for highlighting, which is moot here
UNUSED_FIELDS_FOR_STATE_CODE = UNUSED_FIELDS_BY_ALL + ["cfr_parts", "full_text", "dockets"]

# Simple list of fields that are currently not used by the full document fetch route for right panel doc details and can be
# skipped by passing a simple boolean flag
UNUSED_FIELDS_FOR_RIGHT_PANEL = UNUSED_FIELDS_BY_ALL + [
    "full_text", "agency_ids", "children", "created_at", "docket_ids",
    "parent", "jurisdiction", "pdf_url", "times_cited", "total_citation_count"
]

# hhs, dot, doe, ferc, epa, doi, faa, usda, nih, noaa, nrc, fda, blm, uscg, fws, cdc, nps, nasa, nsf, aphis, cms
AGENCY_ID_BLACKLIST_FOR_SEARCH = {221, 492, 136, 167, 145, 253, 159, 12, 353, 361, 383, 199, 275, 53, 197, 44, 362, 301, 366, 22, 45}

# threshold at which to surface prediction-only topics
# TODO add per topic thresholds and make configurable
DEFAULT_DOCUMENT_TOPIC_THRESHOLD = 0.99

######################################################################################################
## NB: was document_helper
######################################################################################################

# n.b. this should be removed when mainstream news feature is ready
def is_mainstream_news_enabled():
    if API_ENV == "testing":
        return True if os.environ.get("MAINSTREAM_NEWS_ENABLED") == "true" else False
    else:
        return True if MAINSTREAM_NEWS_ENABLED == "true" else False

def doc_boolean(doc, doc_list):
    if doc['id'] in doc_list:
        return True
    else:
        return False

def read_filter(docs):
    return {"terms": {"id": [x[0] for x in docs if x[1] == True]}}

def bookmarked_filter(docs):
    return {"terms": {"id": [x[0] for x in docs if x[2] == True]}}

def get_user_document_ids(user_id):
    return [(d.doc_id, d.read, d.bookmarked) for d in db_session_users.query(
        UserDocument).filter_by(user_id=user_id).all()]

def get_doc_ids_for_folder(folder_id):
    return [d[0] for d in db_session_users.query(UserFolderDocument.doc_id)
        .filter_by(user_folder_id=folder_id).all()]

# n.b. only return positive because user-facing bit does not care about negatives
def get_doc_ids_for_tag(user_id, tag_id):
    return [d[0] for d in db_session_users.query(UserDocumentTag.doc_id)
        .filter_by(user_id=user_id, user_tag_id=tag_id, is_positive=True).all()]

# helper method for getting a list of tag tuples [ [id, name], [id, name], ...] associated with each document
# for this user. includes both user and system tags
def get_doc_tag_map(user_id, documents):
    doc_tag_map = defaultdict(list)
    doc_ids = [d['id'] for d in documents]

    # n.b. empty IN predicates can be a drag, prevent running any queries when the first step had 0 things to check
    if len(doc_ids) > 0:
        user_document_tags = db_session_users.query(UserDocumentTag.doc_id, UserDocumentTag.user_tag_id) \
            .filter(UserDocumentTag.doc_id.in_(doc_ids)).filter_by(user_id=user_id, is_positive=True).all()

        if len(user_document_tags) > 0:
            user_tag_ids = set([u[1] for u in user_document_tags])
            user_tags = db_session_users.query(UserTag.id, UserTag.name).filter(UserTag.id.in_(user_tag_ids)).all()
            user_tag_map = {u[0]: u[1] for u in user_tags}
            for doc_id, user_tag_id in user_document_tags:
                doc_tag_map[doc_id].append([user_tag_id, user_tag_map[user_tag_id]])

    return doc_tag_map

def get_flagged_doc_id_info_map(user_id, status):
    if status == "include_all" or status == "exclude_all":
        return get_all_flagged_documents(user_id)
    elif status == "contributor_flagged":
        return get_all_contributor_flagged_documents()
    else:
        return get_all_flagged_documents_with_status(status)

def get_all_flagged_documents(user_id=None):
    flagged_doc_query = db_session_users.query(UserFlaggedDocument)
    if user_id:
        flagged_doc_query = flagged_doc_query.filter_by(user_id=user_id)
    return dict([(d.doc_id, [d.id, d.issue_type, d.issue_severity, d.field, d.notes, d.status, d.multiple_field]) for d in flagged_doc_query.all()])

def get_all_flagged_documents_with_status(status):
    flagged_query = db_session_users.query(UserFlaggedDocument).filter_by(status=status)
    return dict([(d.doc_id, [d.id, d.issue_type, d.issue_severity, d.field, d.notes, d.status, d.multiple_field]) for d in flagged_query.all()])

def get_all_contributor_flagged_documents():
    flagged_status = UserFlaggedDocument.FLAGGED_STATUS
    issue_type = UserFlaggedDocument.CONTRIBUTOR_ISSUE_TYPE
    return dict([(d.doc_id, [d.id, d.issue_type, d.issue_severity, d.field, d.notes, d.status, d.multiple_field]) for d in db_session_users.query(
            UserFlaggedDocument).filter_by(status=flagged_status, issue_type=issue_type).all()])

def flagged_filter(map):
    return {"terms": {"id": [id for id in map]}}

def getFlaggedStatus(document, flagged_documents):
    if document in flagged_documents:
        return flagged_documents[document]
    else:
        return False

def getFlaggedData(document, flagged_documents):
    if document in flagged_documents:
        return {
        "user_flagged_document_id": flagged_documents[document][0],
        "issue_type": flagged_documents[document][1],
        "issue_severity": flagged_documents[document][2],
        "field": flagged_documents[document][3],
        "notes": flagged_documents[document][4],
        "status": flagged_documents[document][5],
        "multiple_field": flagged_documents[document][6],
        }
    else:
        return None

# To retrieve the proper data from user_flagged_documents table
# we passing flagged_docs which contain already filtered documents.
def decorate_documents(documents, user_id, user_docs=None, decorate_children=False, flagged_docs=None):
    if not user_docs: user_docs = get_user_document_ids(user_id)
    read_docs = set([d[0] for d in user_docs if d[1] == True])
    bookmarked_docs = set([d[0] for d in user_docs if d[2] == True])

    doc_tag_map = get_doc_tag_map(user_id, documents)

    if flagged_docs is None:
        flagged_docs = get_all_flagged_documents()

    docs = [
        merge_two_dicts(d, {
            "read": doc_boolean(d, read_docs),
            "bookmarked": doc_boolean(d, bookmarked_docs),
            "tags": doc_tag_map[d['id']],
            "flagged": getFlaggedData(d['id'], flagged_docs)
        }
    ) for d in documents ]

    if decorate_children:
        for doc in docs:
            doc['children'] = decorate_documents(doc['children'], user_id)

    return docs

def update_document_decoration(params):
    result = {}
    if 'read' in params:
        user_documents = []
        for doc_id in params['document_ids']:
            user_document = db_session_users.query(
                UserDocument).filter_by(
                doc_id=doc_id, user_id=g.user_id).first()
            if not user_document:
                doc_params = {'user_id': g.user_id, 'doc_id': doc_id}
                user_document = UserDocument(doc_params)
            user_document.read = params['read']
            user_documents.append(user_document)

        db_session_users.add_all(user_documents)
        db_session_users.commit()
        result['read'] = params['read']
    if 'bookmarked' in params:
        user_documents = []
        for doc_id in params['document_ids']:
            user_document = db_session_users.query(
                UserDocument).filter_by(
                doc_id=doc_id, user_id=g.user_id).first()
            if not user_document:
                doc_params = {'user_id': g.user_id, 'doc_id': doc_id}
                user_document = UserDocument(doc_params)
            user_document.bookmarked = params['bookmarked']
            user_documents.append(user_document)

        db_session_users.add_all(user_documents)
        db_session_users.commit()
        result['bookmarked'] = params['bookmarked']
    return result

def tag_document(doc_id, params):
    tag = params['tag']
    user_tag_document = db_session_users.query(
        UserDocumentTag).filter_by(
        doc_id=doc_id, user_id=g.user_id, user_tag_id=tag['id']).first()

    # update or remove (we don't need to delete these)
    if user_tag_document:
        user_tag_document.is_positive = tag['is_positive']
        user_tag_document.display_style = tag['display_style']
    else:
        user_tag_document = UserDocumentTag({
            'user_id': g.user_id,
            'doc_id': doc_id,
            'user_tag_id': tag['id'],
            'is_positive': tag['is_positive'],
            'display_style': tag['display_style']
        })

    db_session_users.add(user_tag_document)
    db_session_users.commit()
    result = user_tag_document.to_dict()

    return result

def decorate_documents_with_filter_mentions(docs, act_id_list, regulation_id_list, concept_id_list, bank_id_list, limit):
    filter_term_hash = None
    if len(act_id_list) > 0:
        filter_term_hash = {"act_id": act_id_list[0]}
    elif len(regulation_id_list) > 0:
        filter_term_hash = {"named_regulation_id": regulation_id_list[0]}
    elif len(concept_id_list) > 0:
        filter_term_hash = {"concept_id": concept_id_list[0]}
    elif len(bank_id_list) > 0:
        filter_term_hash = {"bank_id": bank_id_list[0]}
    # n.b. agency is skipped here because it is less resolve-y and more that's where we got the data from-y

    if filter_term_hash is not None:
        doc_ids = [d['id'] for d in docs]
        doc_id_index_map = {v: i for i, v in enumerate(doc_ids)}
        doc_cite_request = filtered_request_template()
        doc_cite_request["size"] = limit
        doc_cite_request["_source"] = {"include": ["doc_id", "mentions"]}
        doc_cite_request["query"]["bool"] = {
            "must": [
                {
                    "terms": {
                        "doc_id": doc_ids,
                    }
                },
                {
                    "term": filter_term_hash
                }
            ]
        }

        doc_citations_results = jsearch.query_records(doc_cite_request, doc_type='document_citations')
        for dc_result in doc_citations_results:
            result_array_index = doc_id_index_map[dc_result['doc_id']]
            docs[result_array_index]['mentions_for_filter'] = dc_result['mentions']

    return docs

# TODO add per topic thresholds and make configurable
def apply_threshold_topics_in_document_response(docs):
    for doc in docs:
        doc['topics'] = [
            t for t in doc['topics']
            if t['judge_count'] > 0 and float(t['positive_judgments']) / float(t['judge_count']) >= 0.5
               or t['model_probability'] > DEFAULT_DOCUMENT_TOPIC_THRESHOLD
        ]
    return docs


def document_timelines(doc_id, params, user_id):
    # n.b. only need the dockets themselves for this query
    es_params = {"_source_include": "dockets"}
    doc = jsearch.get_record(doc_id, params=es_params)

    docket_ids = [d["docket_id"] for d in doc["dockets"]]
    timelines = {}
    for dok_id in docket_ids:
        timelines[dok_id] = docket_timeline(dok_id, params, user_id)
    return timelines

def docket_timeline(docket_id, params, user_id):
    params = merge_two_dicts(params, {"docket_id": docket_id, 'skip_unused_fields': True})
    docs, total = get_filtered_documents(params, user_id)
    return docs

## boost for length, degrade for depth
## NB: with value as int, this has a very aggressive depth penalty. Most non-initial phrases have boost=0.
##     Republic Bank false alarms for "First Republic Bank" are a good test case for naive tuning ...
##     several correct results need to appear on the first page
def phrase_score(depth, length):
    value = 2 * length * (1/(2**depth))
    return value

def compute_substrings(text):
    tokens  = re.split(r'\s+', text.strip())
    strings = [ ]
    for i in range(0, len(tokens)):
        for j in range(1, len(tokens)+1):
            if i < j:
                phrase_depth  = i
                phrase_tokens = tokens[i:j]
                phrase_length = len(phrase_tokens)
                phrase_string = ' '.join(phrase_tokens)
                p_tuple = (phrase_depth, phrase_length, phrase_string)
                strings.append(p_tuple)
    return { 'substrings': strings, 'length': len(tokens)}

def filtered_request_template():
    return {"query": {}}

def boost_filter(name, field_name, score):
    return {"match_phrase": {field_name: {"query": name, "slop": 2, "boost": score}}}

def boost_filters(name, field_names, score):
    return {"multi_match": {"query": name, "type": "phrase", "fields": field_names, "boost": score}}

def term_boost_filter(name, field_name, score):
    return {"match": {field_name : {"query": name, "boost": score}}}

def default_highlight_parameters():
    return {
        "fields": {
            "full_text": {},
            "summary_text": {},
            "title": {}
        }
    }


# compose the painless script to be used by the topic_id_filter method below
# n.b. needs to start out with a check on judge count being 0 to avoid divide by zero errors that muck up the works
painless_expression1 = "doc['topics.judge_count'].value == 0"
painless_expression2 = "((float)doc['topics.positive_judgments'].value / (float)doc['topics.judge_count'].value) >= 0.5"
painless_script_topic_filter = "{} || {}".format(painless_expression1, painless_expression2)


# gets a complex filter that at a high level says, return only documents for these topics, when the topic has a
# majority of positive annotations and either the model probability is greater than our threshold or there is at least
# one judge (i.e. this is an annotation not a model-derived prediction)
def topic_id_filter(topic_list):
    return {"nested": {
        "path": "topics",
        "query": {
            "bool": {"must": [
                {"terms": {"topics.id": topic_list}},
                {"script": {"script": {
                    "inline": painless_script_topic_filter,
                    "lang": "painless"
                }}},
                {"bool": {"should": [
                    # TODO make probability threshold configurable, plus on a per-topic basis
                    {"range": {"topics.model_probability": {"gte": DEFAULT_DOCUMENT_TOPIC_THRESHOLD}}},
                    {"range": {"topics.judge_count": {"gte": 1}}}
                ]}}
            ]}
        }
    }}


## Setup references to support quick query/filter updates
## Setup highlighting
## Make a boolean bucket for the boost clauses
## Names and phrases should do more work ...
##   * add in some generic phrase boosting:
##   * add in some proper name boosting:
def search_queryreform(text, query):
    query["bool"]["must"].append({
        "multi_match": {
            "query": text,
            "fields": ["summary_text", "full_text", "title"]
        }
    })

    substrings  = compute_substrings(text)

    if "should" not in query["bool"]:
        query["bool"]["should"] = []

    boost_list = query["bool"]["should"]
    for triple in substrings['substrings']:
        depth  = triple[0]
        length = triple[1]
        name   = triple[2]
        score  = phrase_score(depth, length)

        ## phrase boosting:
        # NB: boost all phrases of 2 < length < 10
        # NB: but boost only trigrams when the query has 10 or more tokens
        if length > 1 and (substrings['length'] < MaxQueryLength or length in DefaultPhraseNGrams):
            if score > 0: boost_list.append(boost_filters(name, PhraseBoostFields, score))

        ## acronym boosting:
        ## Acronyms are important, but always short, score them all like trigram depth-0 matches
        #if length == 1:
        #    boost = 8.0
        #    boost_list.append( boost_filters(name, TermBoostFields, boost) )

        ## mention boosting:
        # NB: commented to roll out methodically, a few mention-types at a time, once
        #        acronym boosting is stable. and we may want to separate bossting for
        #        references and names
        # NB: only look for bigrams and trigrams to boost when the query has 10 or more tokens
        #if score > 0 and (substrings['length'] < MaxQueryLength or length in DefaultNameNGrams):
        #    boost  = score * 2.0 ## Names are better than generic ngram matches, TEMP (s/ have own score method)
        #    boost_list.append( boost_filters(name, NameBoostFields, boost) )

# utility method for name-based entity lookups, assumes one entry with the name
def get_entity_by_name(type, name):
    full_request = filtered_request_template()

    full_request["query"] = {
        "match": {
            "name": name,
        }
    }
    return jsearch.query_records(full_request, type)[0]

def get_filtered_documents(params, user_id):
    ## Get the query parameters:
    query_list = safe_getlist('query', params)
    more_like_doc_id = params.get('more_like_doc_id', None)
    agency_list = safe_getlist('agency_id', params)
    agency_skip_list = safe_getlist('skip_agency', params)
    category_list = safe_getlist('category', params)
    skip_category_list = safe_getlist('skip_category', params)
    provenance_list = safe_getlist('provenance', params)
    meta_table_list = safe_getlist('meta_table', params)
    docket_list = safe_getlist('docket_id', params)
    regulation_id_list = safe_getlist('regulation_id', params)
    citation_id_list = safe_getlist('citation_id', params)
    concept_id_list = safe_getlist('concept_id', params)
    act_id_list = safe_getlist('act_id', params)
    bank_id_list = safe_getlist('bank_id', params)
    topic_id_list = safe_getlist('topic_id', params)
    published_to = params.get('published_to', None)
    published_from = params.get('published_from', None)
    compliance_to = params.get('compliance_to', None)
    compliance_from = params.get('compliance_from', None)
    comments_close_to = params.get('comments_close_to', None)
    comments_close_from = params.get('comments_close_from', None)
    key_date_to = params.get('key_date_to', None)
    key_date_from = params.get('key_date_from', None)
    spider_name_list = safe_getlist('spider_name', params)
    limit = params.get('limit', 20)
    offset = params.get('offset', 0)
    sort = params.get('sort', None)
    order = params.get('order', None)
    read = params.get('read', None)
    bookmarked = params.get('bookmarked', None)
    tag_id = params.get('tag_id', None)
    folder_id = params.get('folder_id', None)
    full_text = params.get('full_text', False)
    skip_unused_fields = params.get('skip_unused_fields', False)
    all_agencies = params.get('all_agencies', False)
    all_topics = params.get('all_topics', False)
    created_at = params.get('created_at', False)
    flagged_status = params.get('flagged_status', None)
    pdf_url = params.get('pdf_url', None)
    get_count_only = params.get('get_count_only', None)
    include_mentions_for_filter = params.get('include_mentions_for_filter', False)
    published_at = params.get('published_at', False)
    created_to = params.get('created_to', None)
    created_from = params.get('created_from', None)

    ## Don't sort when not requested
    ## Update the sort attr to use the full path into jurasticsearch docs
    ## Use 'desc' as the default order when sort is requested
    if sort:
        if AttributeName.get(sort, False): sort = AttributeName[sort]
        if not order: order = 'desc'

    ## Filter agencies in the following manner:
    #     1. By list provided; else
    #     2. By agencies followed; else
    #     3. Using the global default for Financial Services
    # Unless there is a query_list passed, in which case we don't want to constrain the search
    # NB: Remove the default filter for easy testing (for now)
    show_all_sources_timeline = False
    include_docs_with_no_agency = False
    
    if not agency_list and not topic_id_list:
        show_all_sources_timeline = True
        followed_agencies = get_followed_agency_ids(user_id)

        if all_topics:
            topic_id_list = get_all_topic_ids_for_search()
        else:
            topic_id_list = get_user_followed_topic_ids()

        if query_list or all_agencies:
            # use a blacklist to restrict the agencies that show up in our system for search as a unit
            include_docs_with_no_agency = True
            agency_list = get_all_agency_ids_for_search()
        elif followed_agencies:
            agency_list = followed_agencies
        else:
            agency_list = DefaultAgencies

        if agency_skip_list:
            skip_list_set = set([int(a) for a in agency_skip_list])
            agency_list = [a for a in agency_list if a not in skip_list_set]

    full_request_body = filtered_request_template()
    query = full_request_body["query"]
    query["bool"] = {"must": []}
    ## Add the search query, if there is one
    if query_list:
        query_text = " ".join(query_list)
        search_queryreform(query_text, query)
        full_request_body["highlight"] = default_highlight_parameters()

    # i can't see a reason why we'd want to use a query string AND more_like_this doc id
    # n.b. highlights don't work out of the box with more_like_this queries
    elif more_like_doc_id:
        query["bool"]["must"].append({
            "more_like_this": {
                "fields": ["title"],
                "like": [
                    {
                        "_index" : ACTIVE_INDEX_NAME,
                        "_type" : "documents",
                        "_id" : str(more_like_doc_id)
                    }
                ],

                # these values are from the examples at https://www.elastic.co/guide/en/elasticsearch/reference/2.3/query-dsl-mlt-query.html
                # and their presence seems useful for providing reasonable results. they could certainly be tweaked though
                "min_term_freq": 1,
                "max_query_terms": 12
            }
        })

    ## Setup the response object containers (and tracking variables):
    date_filter        = None
    date_filter_should = None # for OR type queries
    user_docs          = None
    tagged_doc_ids = None
    folder_doc_ids = None
    clause_count       = 0
    flagged_docs = None

    ## Add filters:
    filter_terms = []

    # In the case of where mainstream news is sent in as a category
    # (not for search results) query for followed_mainstream_news docs
    # otherwise (in the case of all_agencies), return all mainstream news sources
    if 'Mainstream News' in category_list and not all_agencies:
        agency_list_filter = elastic_list_filter(agency_list, "agencies.id")
        mainstream_news_should_clauses = [agency_list_filter]
        
        followed_mainstream_news = get_all_followed_entities(user_id, {'entity_type': 'news_sources'})
        if len(followed_mainstream_news['followed_entities']) > 0:
            followed_mainstream_news_id_list = [e['entity_id'] for e in followed_mainstream_news['followed_entities']]
            
            mainstream_news_should_clauses.append({
                "terms": {"mainstream_news.news_source.id": followed_mainstream_news_id_list}
            })
        filter_terms.append({"bool": {"should": mainstream_news_should_clauses}})
    elif show_all_sources_timeline and not include_docs_with_no_agency:
        query['bool']['must'].append({
            "bool": {
                "should": [
                    topic_id_filter(topic_id_list),
                    {"terms": {"agencies.id": agency_list}}
                ]
            }
        })
    # in some search results, we need to include document types like Whitepapers, which don't have an agency
    # in this case, we use our agency whitelist with an OR on the value being missing (the whitepaper case)
    elif show_all_sources_timeline and include_docs_with_no_agency:
        agency_list_filter = elastic_list_filter(agency_list, "agencies.id")
        no_agency_should_clauses = [agency_list_filter, {"bool": {"must_not": {"exists": {"field": "agencies.id"}}}}]
        
        if len(topic_id_list) > 0:
            no_agency_should_clauses.append(topic_id_filter(topic_id_list))
            
        filter_terms.append({"bool": {"should": no_agency_should_clauses}})
    else:
        add_elastic_list_filter(agency_list, "agencies.id", filter_terms)
        if len(topic_id_list) > 0:
            query['bool']['must'].append(topic_id_filter(topic_id_list))

    # if an explicit category filter was passed in, ignore the skip_category filter. they should be mutually exclusive
    if len(category_list) > 0:
        add_elastic_list_filter(category_list, "category", filter_terms)
    elif len(skip_category_list) > 0:
        if not is_mainstream_news_enabled():
            skip_category_list.append("Mainstream News")
        skip_filter = elastic_list_filter(skip_category_list, "category")
        filter_terms.append({"bool": {"must_not": skip_filter}})
    else:
        if not is_mainstream_news_enabled():
            skip_filter = elastic_list_filter(["Mainstream News"], "category")
            filter_terms.append({"bool": {"must_not": skip_filter}})

    add_elastic_list_filter(provenance_list, "provenance", filter_terms)
    add_elastic_list_filter(meta_table_list, "meta_table", filter_terms)
    add_elastic_list_filter(regulation_id_list, "cited_associations.named_regulation_ids", filter_terms)
    add_elastic_list_filter(citation_id_list, "cited_associations.citation_ids", filter_terms)
    add_elastic_list_filter(concept_id_list, "cited_associations.concept_ids", filter_terms)
    add_elastic_list_filter(act_id_list, "cited_associations.act_ids", filter_terms)
    add_elastic_list_filter(docket_list, "dockets.docket_id", filter_terms)
    add_elastic_list_filter(spider_name_list, "spider_name", filter_terms)
    add_elastic_list_filter(bank_id_list, "cited_associations.bank_ids", filter_terms)

    if filter_terms: clause_count += 1

    ## Add date filters:
    if published_to or published_from:
        date_filter = elastic_date_filter("publication_date", published_from, published_to)
        clause_count += 1
    elif compliance_to or compliance_from:
        date_filter = elastic_date_filter("rule.effective_on", compliance_from, compliance_to)
        clause_count += 1
    elif comments_close_to or comments_close_from:
        date_filter = elastic_date_filter("rule.comments_close_on", comments_close_from, comments_close_to)
        clause_count += 1
    elif key_date_to or key_date_from:
        date_filter_effective = {"range": elastic_date_filter("rule.effective_on", key_date_from, key_date_to)}
        date_filter_comments = {"range": elastic_date_filter("rule.comments_close_on", key_date_from, key_date_to)}
        date_filter_should = [date_filter_effective, date_filter_comments]
        clause_count += 2
    elif created_at:
        date_filter = {"created_at":{"from": "now-%sh" % created_at}}
        clause_count += 1
    elif published_at:
        date_filter = {"publication_date":{"from": "now-%sh" % published_at}}
        clause_count += 1
    elif created_to or created_from:
        date_filter = elastic_date_filter("created_at", created_from, created_to)
        clause_count += 1

    if read or bookmarked:
        user_docs = get_user_document_ids(user_id)
        clause_count += 1

    if tag_id:
        tagged_doc_ids = get_doc_ids_for_tag(user_id, tag_id)
        clause_count += 1

    if folder_id:
        folder_doc_ids = get_doc_ids_for_folder(folder_id)
        clause_count += 1

    if flagged_status:
        flagged_docs = get_flagged_doc_id_info_map(user_id, flagged_status)
        clause_count += 1

    if pdf_url:
        pdf_url_filter = es_filter(pdf_url, 'pdf_url')
        clause_count += 1

    ## Build the final query to send to jurasticsearch:

    if clause_count >= 1:
        query["bool"]["must"].extend(filter_terms)
        if date_filter_should:
            query["bool"]["must"].append({
                "bool": {
                    "should": date_filter_should
                }
            })
        if date_filter:
            query["bool"]["must"].append({"range": date_filter})
        if read:
            read_bool = str_to_bool(read)
            if read_bool:
                query["bool"]["must"].append(read_filter(user_docs))
            elif not read_bool:
                query["bool"]["must_not"] = read_filter(user_docs)
            else:
                print "WARNING: read_flag is not boolean: {}".format(read_bool)
        if bookmarked:
            bookmarked_bool = str_to_bool(bookmarked)
            if bookmarked_bool:
                query["bool"]["must"].append(bookmarked_filter(user_docs))
            elif not bookmarked_bool:
                query["bool"]["must_not"] = bookmarked_filter(user_docs)
            else:
                print "WARNING: bookmarked_flag is not boolean: {}".format(bookmarked_bool)

        if tagged_doc_ids:
            query["bool"]["must"].append({"terms": {"id": tagged_doc_ids}})

        if folder_doc_ids is not None:
            query["bool"]["must"].append({"terms": {"id": folder_doc_ids}})

        if flagged_status:
            ValidFlaggedStatuses = [UserFlaggedDocument.FLAGGED_STATUS, UserFlaggedDocument.HIDDEN_STATUS, UserFlaggedDocument.PROCESSED_STATUS]
            if flagged_status == "exclude_all":
                query["bool"]["must_not"] = flagged_filter(flagged_docs)
            elif flagged_status == "include_all" or flagged_status in ValidFlaggedStatuses or flagged_status == "contributor_flagged":
                query["bool"]["must"].append(flagged_filter(flagged_docs))
            else:
                print "WARNING: flagged_status must be one of: {}" + str(ValidFlaggedStatuses)

        if pdf_url:
            query["bool"]["filter"] = pdf_url_filter

    # return just the document count if that is all that was requested
    if get_count_only is not None:
        result = jsearch.count_records(full_request_body)
        count = result["hits"]["total"]
        return [], count

    # otherwise, send the query and return the source dict for each doc:
    else:
        # Start out by excluding a bunch of fields from the payload that are not currently used in any way by the
        # front-end application, if the user has passed the skip_unused fields flag
        excluded_fields = []
        if skip_unused_fields:
            excluded_fields += UNUSED_FIELDS_FOR_DOC_LIST
        if not full_text:
            excluded_fields.append("full_text")
        if len(excluded_fields) > 0:
            full_request_body["_source"] = {"exclude": excluded_fields}

        if limit:          full_request_body["size"] = limit
        if sort and order: full_request_body["sort"] = {sort: {"order": order}}  ## TODO: relevance support
        if offset:         full_request_body["from"] = offset
        hits = jsearch.query_documents(full_request_body)['hits']
        if query_list:
            docs = [merge_two_dicts(x["_source"], search_attrs(x)) for x in hits['hits']]
        else:
            docs = [x['_source'] for x in hits['hits']]

        docs = decorate_documents(docs, user_id, user_docs=user_docs, flagged_docs=flagged_docs)

        if include_mentions_for_filter:
            decorate_documents_with_filter_mentions(docs, act_id_list, regulation_id_list, concept_id_list,
                                                    bank_id_list, limit)

        # TODO: Allow turning this off to return all topics with their probabilities by an optional flag
        docs = apply_threshold_topics_in_document_response(docs)

        return docs, hits['total']



# Some constant values for the highly restricted API
# n.b. declaring them up here so the arrays/sets are only created once
# sec, occ, eop, frs, treas, fdic, cfpb, nyse, finra, ebsa, doj, ftc, ffiec, fincen
SUBSET_AGENCY_ID_LIST = [466, 80, 538, 188, 497, 164, 573, 9015, 9030, 131, 268, 192, 168, 194]
SUBSET_AGENCY_ID_LIST_LOOKUP = set(SUBSET_AGENCY_ID_LIST)
SUBSET_CATEGORY_LIST = ["Presidential Document", "Notice", "Enforcement", "Proposed Rule", "Final Rule"]
SUBSET_CATEGORY_LIST_LOOKUP = set(SUBSET_CATEGORY_LIST)
CFPB_SUBSET_CATEGORY_LIST_LOOKUP = ["Regulatory Agenda Item", "News"]

# n.b. we re-map the rule.effective_on / comments_close_on to be at the top level below
SUBSET_SOURCE_FIELDS = [
    "id", "category", "title", "publication_date", "full_text", "web_url", "pdf_url", "jurisdiction",
    "agencies.id", "agencies.name", "agencies.short_name", "rule.effective_on", "rule.comments_close_on"
]

EXTRA_SUBSET_SOURCE_FIELDS = ["children", "agenda_rule.stage"]

# alternate version of get_filtered documents that is highly restricted and designed for third party
# API integrations only
def get_filtered_documents_subset(params):
    ## Get the query parameters:
    agency_list = safe_getlist('agency_id', params)
    act_list = safe_getlist('act_id', params)
    regulation_list = safe_getlist('regulation_id', params)
    concept_id_list = safe_getlist('concept_id', params)
    bank_id_list = safe_getlist('bank_id', params)
    category_list = safe_getlist('category', params)
    topic_id_list = safe_getlist('topic_id', params)
    published_to = params.get('published_to', None)
    published_from = params.get('published_from', None)
    limit = params.get('limit', 20)
    offset = params.get('offset', 0)
    feature_name = params.get('feature_name', None)

    # n.b. default sort is most recent publication date first
    sort = params.get('sort', "publication_date")
    order = params.get('order', 'desc')

    if len(agency_list) > 0:
        agency_list = [a for a in agency_list if int(a) in SUBSET_AGENCY_ID_LIST_LOOKUP]
    else:
        agency_list = SUBSET_AGENCY_ID_LIST


    if len(category_list) > 0:
        category_list = [c for c in category_list if c in SUBSET_CATEGORY_LIST_LOOKUP or c in CFPB_SUBSET_CATEGORY_LIST_LOOKUP]
    else:
        category_list = SUBSET_CATEGORY_LIST

    full_request_body = filtered_request_template()
    full_request_body["query"]["bool"] = {"must": []}

    ## Add filters:
    filter_terms = []
    add_elastic_list_filter(agency_list, "agencies.id", filter_terms)
    add_elastic_list_filter(category_list, "category", filter_terms)

    if len(topic_id_list) > 0:
        full_request_body["query"]['bool']['must'].append(topic_id_filter(topic_id_list))

    if len(act_list) > 0:
        add_elastic_list_filter(act_list, "cited_associations.act_ids", filter_terms)

    if len(regulation_list) > 0:
        add_elastic_list_filter(regulation_list, "cited_associations.named_regulation_ids", filter_terms)

    if len(concept_id_list) > 0:
        add_elastic_list_filter(concept_id_list, "cited_associations.concept_ids", filter_terms)

    if len(bank_id_list) > 0:
        add_elastic_list_filter(bank_id_list, "cited_associations.bank_ids", filter_terms)

    full_request_body["query"]["bool"]["must"].extend(filter_terms)

    ## Add date filters:
    if published_to or published_from:
        pub_date_filter = elastic_date_filter("publication_date", published_from, published_to)
        full_request_body["query"]["bool"]["must"].append({"range": pub_date_filter})

    # restrict the set of fields we return for documents
    if (feature_name == "cfpb_landing_page"):
        full_request_body["_source"] = {"include": list(set(SUBSET_SOURCE_FIELDS + EXTRA_SUBSET_SOURCE_FIELDS))}
    else :
        full_request_body["_source"] = {"include": SUBSET_SOURCE_FIELDS}

    if limit:
        full_request_body["size"] = limit
    if sort and order:
        full_request_body["sort"] = {sort: {"order": order}}
    if offset:
        full_request_body["from"] = offset

    hits = jsearch.query_documents(full_request_body)['hits']

    # re-map date fields currently stored in rule to be at the top level
    # FIXME: this is a hack
    docs = []
    for hit in hits['hits']:
        doc = hit['_source']
        if 'rule' in doc:
            doc['effective_on'] = doc['rule']['effective_on']
            doc['comments_close_on'] = doc['rule']['comments_close_on']
            del doc['rule']
        else:
            doc['effective_on'] = None
            doc['comments_close_on'] = None
        docs.append(doc)

    return docs, hits['total']

def search_attrs(hit):
    return {"highlights": hit['highlight'], "score": hit["_score"]}

# class to memoize the agency_ids currently in our system for search purposes.
# note: the set of possible agency_ids changes very infrequently, so lets make the update interval every day
class AgencyIdMemoizer:
    def __init__(self):
        self.memoized_agency_ids_for_search = None
        self.last_memoized_time = None

    def get_agency_ids(self):
        if self.memoized_agency_ids_for_search is not None and self.last_memoized_time > dt.datetime.now() - dt.timedelta(days=1):
            return self.memoized_agency_ids_for_search
        else:
            self.last_memoized_time = dt.datetime.now()
            agency_id_all = get_all_agency_ids()
            self.memoized_agency_ids_for_search = [a for a in agency_id_all if a not in AGENCY_ID_BLACKLIST_FOR_SEARCH]
            return self.memoized_agency_ids_for_search

agency_id_memoizer = AgencyIdMemoizer()
def get_all_agency_ids_for_search():
    return agency_id_memoizer.get_agency_ids()

def get_all_agency_ids():
    return jsearch.get_distinct_attribute_values('agencies.id')

def get_all_document_categories():
    return jsearch.get_distinct_attribute_values('category')

def get_all_document_spider_names():
    return jsearch.get_distinct_attribute_values('spider_name')

def get_all_document_provenances():
    return jsearch.get_distinct_attribute_values('provenance')

def get_all_document_jurisdictions():
    return jsearch.get_distinct_attribute_values('jurisdiction')

def handle_data_updates(params):
    # to avoid circular references this line is put in this function
    from app import socket
    socket.emit('notification', {'data':'a notification'})
    return {'data': 'updates received'}

def get_document_by_id(doc_id, params):
    try:
        decorate_children = params.get('decorate_children', False)
        skip_unused_fields = params.get('skip_unused_fields', False)
        skip_fields_for_state_code = params.get('skip_fields_for_state_code', False)
        skip_fields_for_right_panel = params.get('skip_fields_for_right_panel', False)

        # skip the unused fields if the request told us to do so
        es_params = {}
        if skip_unused_fields:
            if skip_fields_for_state_code:
                fields_to_skip = UNUSED_FIELDS_FOR_STATE_CODE
            elif skip_fields_for_right_panel:
                fields_to_skip = UNUSED_FIELDS_FOR_RIGHT_PANEL
            else:
                fields_to_skip = UNUSED_FIELDS_BY_ALL

            # n.b. yes this needs to be a comma separated string for some reason
            es_params["_source_exclude"] = ",".join(fields_to_skip)

        doc = jsearch.get_record(doc_id, params=es_params)

        docs = [doc] # hack to re-use same methods as get all documents code
        decorated_docs = decorate_documents(docs, g.user_id, decorate_children=decorate_children)

        # TODO: Allow turning this off to return all topics with their probabilities by an optional flag
        topic_filtered_docs = apply_threshold_topics_in_document_response(decorated_docs)

        return jsonify({'document': topic_filtered_docs[0]})
    except elasticsearch.NotFoundError:
        return jsonify({"errors": "Not found"}), 404
