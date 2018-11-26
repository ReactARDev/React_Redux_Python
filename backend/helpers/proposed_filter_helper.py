from flask import jsonify

import schemas.jurasticsearch as jsearch

EXCLUDED_SUGGESTION_TYPES = ['publications', 'jurisdictions', 'document_citations', 'news_sources']
EXTRA_BLACKLISTED_ENTITY_TYPES = ['citations', 'banks']

def get_suggestions(query_string, use_extra_blacklisted_types=False):
    blacklisted_types = EXCLUDED_SUGGESTION_TYPES + EXTRA_BLACKLISTED_ENTITY_TYPES if use_extra_blacklisted_types \
        else EXCLUDED_SUGGESTION_TYPES

    # n.b. by providing a _name for each filter, Elasticsearch will return which filters were matched on
    query = {
        "query": {
            "bool": {
                "should": [
                    {"match": {"name": {"query": query_string, "analyzer": jsearch.AUTOCOMPLETE_ANALYZER, '_name': 'name'}}},
                    {"match": {"short_name": {"query": query_string, "analyzer": jsearch.AUTOCOMPLETE_ANALYZER,
                                              '_name': 'short_name'}}}
                ],
                "must_not": [
                    {"terms": {"_type": blacklisted_types}}
                ]
            }
        }
    }

    raw_results = jsearch.query_entries(query)
    api_results = []
    for hit in raw_results['hits']['hits']:
        result_item = hit['_source']
        result_item['_score'] = hit['_score']
        result_item['_type'] = hit['_type']
        result_item['_matched_queries'] = hit['matched_queries']
        api_results.append(result_item)
    return api_results


ALLOWED_ENTITY_TYPES = {
    'agencies',
    'acts',
    'named_regulations',
    'concepts',
    'citations',
    'banks',
    'topics'
}

def get_entity_by_ids_and_type(entity_type, entity_ids):

    if entity_type not in ALLOWED_ENTITY_TYPES:
        return {"errors": "invalid type"}
    if isinstance(entity_ids, list) is not True:
        return {"errors": "invalid type"}
    query = {
        "query": {
            "bool": {
                "must": {
                    "terms": {"id": entity_ids}
                }
            }
        }
    }
    return jsearch.query_records(query, entity_type)

def get_entity_by_type_and_id(entity_type, entity_id):

    if entity_type not in ALLOWED_ENTITY_TYPES:
        return {"errors": "invalid type"}
    return jsearch.get_record(entity_id, entity_type)
