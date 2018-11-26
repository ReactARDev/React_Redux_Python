# coding: utf-8
import os
import sys
import json
from elasticsearch import Elasticsearch, RequestsHttpConnection
from aws_requests_auth.aws_auth import AWSRequestsAuth

from settings import API_ENV, ACTIVE_INDEX_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, ES_HOST

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

import certifi
if API_ENV == 'testing' or API_ENV == 'local':
    client = Elasticsearch(os.environ.get('JURISPECT_INDEXER'))
else:
    auth = AWSRequestsAuth(aws_access_key=AWS_ACCESS_KEY_ID,
                           aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                           aws_host=ES_HOST,
                           aws_region='us-east-1',
                           aws_service='es')

    client = Elasticsearch(host=ES_HOST,
                           port=80,
                           connection_class=RequestsHttpConnection,
                           http_auth=auth)
    
_debug = 0

AUTOCOMPLETE_ANALYZER = "keyword_lower"

if API_ENV == 'testing':
    INDEX_NAME = 'testing'
else:
    INDEX_NAME = ACTIVE_INDEX_NAME

def query_entries(query, opts=None):
    if opts is None:
        opts = {}
    if 'index' not in opts: opts['index'] = INDEX_NAME
    res = client.search(index=opts['index'], body=query)
    return res

def count_documents(query, opts=None):
    if opts is None:
        opts = {}
    if 'index' not in opts: opts['index'] = INDEX_NAME
    res = client.count(index=opts['index'], doc_type='documents', body=query)
    return res

def query_documents(query, opts=None):
    if opts is None:
        opts = {}
    if 'index' not in opts: opts['index'] = INDEX_NAME
    res = client.search(index=opts['index'], doc_type='documents', body=query)
    return res

def query_records(query, doc_type='documents'):
    res = client.search(index=INDEX_NAME, doc_type=doc_type,  body=query)
    return [ x['_source'] for x in res['hits']['hits'] ]

def count_records(query, doc_type='documents'):
    return client.search(index=INDEX_NAME, doc_type=doc_type,  body=query, size=0)

def get_record(doc_id, doc_type='documents', params=None):
    if params is None:
        params = {}
    res = client.get(index=INDEX_NAME, doc_type=doc_type, id=doc_id, params=params)
    if res and '_source' in res:
        return res['_source']
    else:
        return { }

def get_distinct_attribute_values(jpath, doc_type='documents'):
    # Add parameter "size" to define how many disinct values should be returned.
    # By default, the terms aggregation will return the buckets for the top ten terms.
    query  = {"aggs":{jpath:{"terms":{"field":jpath, "size":500}}}}
    res    = client.search(index=INDEX_NAME, doc_type=doc_type, body=query)
    values = [ x["key"] for x in res["aggregations"][jpath]["buckets"] ]
    return values
    
# N.B. these methods are used by the unit tests for setting up an index while testing
#      they can only be accessed with API_ENV='testing'

def setup_test_index():
    if API_ENV is not 'testing':
        print "You cannot write to the search index from the API"
        return False

    print('-*-*-*-*-*-*-*-*-*-*-*-*-* building mappers and analyzers *-*-*-*-*-*-*-*-*-*-*-*-*-')
    config = json.loads(open(this_folder + '/../migrations/jurasticsearch.json').read())
    client.indices.create(index='testing', body=config)

def index_jsearch_dict(doc, doc_type):
    if API_ENV is not 'testing':
        print "You cannot write to the search index from the API"
        return False

    if 'id' in doc:
        try:
            return client.index(index='testing', doc_type=doc_type, id=doc['id'], body=doc)
        except Exception as e:
            print("could not index dict (doc_id={}): {}".format(doc['id'], e))
    elif doc_type in ['dockets', 'document_citations']:
        try:
            return client.index(index='testing', doc_type=doc_type, body=doc)
        except Exception as e:
            print("could not index posted document citation: {}".format(e))
    else:
        print("not supported")
