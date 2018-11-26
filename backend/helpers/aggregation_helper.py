from helpers.utilities import merge_two_dicts, str_to_bool

from settings import API_ENV

import schemas.jurasticsearch as jsearch
from search_helper import *
from agency_helper import DefaultAgencies, get_followed_agency_ids

################################################################################################################
##                       WRAPPER TEMPLATES FOR MAJOR AGGREGATION QUERY USE CASES
################################################################################################################

def aggregation_template(params={}):
    query      = {"aggs":{"filtered_documents":{"filter":{ "bool":{"must":[ ]}}}}}
    conditions = query['aggs']['filtered_documents']['filter']['bool']['must']
    if params.get('filters', None):
        conditions.extend(params.get('filters', [ ])) ## pass in pre-formatted es filters, if provided
    else:
        categories = params.get('categories', [ ])
        acts = params.get('acts', [])
        agencies   = params.get('agencies', DefaultAgencies)
        from_date  = params.get('from_date', "now-3y/M")
        provenance = params.get('provenance', None)
        all_agencies = params.get('all_agencies', None)
        date_range_field = params.get('date_range_field', "publication_date")
        date_filter = elastic_date_filter(date_range_field, params.get('date_range_from'), params.get('date_range_to'))

        if date_filter:
            conditions.append({"range": date_filter})
        else:
            conditions.append({"range":{date_range_field:{"from": from_date }}})

        if not all_agencies: conditions.append({"terms":{"agencies.id": agencies }})
        if categories: conditions.append({"terms": {"category": categories }})
        if acts: conditions.append({"terms": {"cited_associations.act_ids": acts }})
        if provenance: conditions.append({"term": {"provenance": provenance }})
    return query

def aggregation_query(params={}):
    query = aggregation_template(params)
    local = query["aggs"]["filtered_documents"]
    date_histogram_format = params.get("date_histogram_format", "yyyy-MM")
    for pair in params.get("buckets", [ ]):
        bucket_type = pair[0]
        field_name  = pair[1]
        local["aggs"] = { }
        if bucket_type == "terms":
            bucket_name = "by_{}".format(field_name)
            ## Add "size" to define how many disinct values should be returned. Default is ten.
            local["aggs"][bucket_name] = { bucket_type : {"field": field_name, "size": 500}}
        elif bucket_type in [ "quarter", "1M", "day" ]:
            bucket_name = "by_{}".format(bucket_type)
            local["aggs"][bucket_name] = {
                "date_histogram":  {
                    "field": field_name,
                    "interval": bucket_type,
                    "format": date_histogram_format
                }
            }
        local = local["aggs"][bucket_name]
    return query

################################################################################################################
##                             GENERIC FILTERED AGGREGATION ROUTE HELPER
################################################################################################################

def run_aggregation(params, user_id):
    filters = [ ]

    ## Term filters:
    add_aggregation_filter('agency_id', "agencies.id", params, filters)
    add_aggregation_filter('category', "category", params, filters)
    add_aggregation_filter('provenance', "provenance", params, filters)
    add_aggregation_filter('meta_table', "meta_table", params, filters)
    add_aggregation_filter('docket_id', "dockets.docket_id", params, filters)
    add_aggregation_filter('regulation_id', "regulations.id", params, filters)
    add_aggregation_filter('concept_id', "cited_associations.concept_ids", params, filters)
    add_aggregation_filter('act_id', "cited_associations.act_ids", params, filters)

    ## Date filters:
    add_date_agg_filter('published_to', "publication_date", params, filters)
    add_date_agg_filter('published_from', "publication_date", params, filters)
    add_date_agg_filter('compliance_to', "rule.effective_on", params, filters)
    add_date_agg_filter('compliance_from', "rule.effective_on", params, filters)
    add_date_agg_filter('comments_close_to', "rule.comments_close_on", params, filters)
    add_date_agg_filter('comments_close_from', "rule.comments_close_on", params, filters)

    ## Bucket aggregators:
    buckets = [ tuple( b.split(':') ) for b in safe_getlist('buckets', params) ]
    query   = aggregation_query({"filters": filters, "buckets": buckets})
    result  = jsearch.count_records(query, 'documents')

    result['hits'] = [ ]
    return result

################################################################################################################
##                      COMPLETE QUERY REFORMULATIONS FOR SPECIFIC AGGREGATION USE CASES
################################################################################################################
