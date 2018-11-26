import json
import schemas.jurasticsearch as jsearch
from helpers.sources_helper import get_sources
from helpers.document_helper import filtered_request_template

def modeled_topic_id_filter(topic_list, lower, upper):
    return {"nested": {
        "path": "topics",
        "query": {
            "bool": {"must": [
                {"terms": {"topics.id": topic_list}},
                {"bool": {"should": [
                    {"range": {"topics.model_probability": {"gte": lower, "lte": upper}}}
                ]}}
            ]}
        }
    }}

def get_sum_judged_topics(topic, positive_judged = False):
    judgment_type = 'topics.positive_judgments' if positive_judged else 'topics.judge_count'
    query = {"aggs" : {
                "topics" : {
                    "nested" : {
                        "path" : "topics"
                    },
                    "aggs": {
                        "topic":{
                            "filter":{
                                'bool': {
                                    'must': [{'terms': {'topics.id': [topic]}}]}
                            },
                              "aggs" : {
                                  "judgment" : {
                                      "sum" : {
                                          "field" : judgment_type
                                      }
                                  }
                              }
                        }
                    }
                }
            }
    }
    result = jsearch.count_records(query)
    sum = result["aggregations"]["topics"]["topic"]["judgment"]["value"]
    return sum


def judged_topic_id_filter(topic_list, positive_judged):
    judgment_type = 'topics.positive_judgments' if positive_judged else 'topics.judge_count'
    range = {"range": {judgment_type: {"gte": 1}}}
    return {"nested": {
        "path": "topics",
        "query": {
            "bool": {"must": [
                {"terms": {"topics.id": topic_list}},
                {"bool": {"should": [
                    range
                ]}}
            ]}
        }
    }}

def get_judged_topics_count(tilist, pjudged):
    full_request_body = filtered_request_template()
    query = full_request_body["query"]
    query["bool"] = {"must": [judged_topic_id_filter(tilist, pjudged)]}
    result = jsearch.count_records(full_request_body)
    count = result["hits"]["total"]
    return count

def get_modeled_topics_count(tilist):
    threshholds = [{'lower': 0.0, 'upper': 0.899999999999},
                   {'lower': 0.90, 'upper': 0.9299999999999},
                   {'lower': 0.93, 'upper': 0.9499999999999},
                   {'lower': 0.95, 'upper': 0.9699999999999},
                   {'lower': 0.97, 'upper': 0.9899999999999},
                   {'lower': 0.99, 'upper': 1.0}]
    for th in threshholds:
        full_request_body = filtered_request_template()
        query = full_request_body["query"]
        query["bool"] = {"must": [modeled_topic_id_filter(tilist, th.get('lower'), th.get('upper'))]}
        result = jsearch.count_records(full_request_body)
        count = result["hits"]["total"]
        th['count'] = count
    return threshholds

def get_topics_stat(params):
    sources = get_sources(params)
    jrsp = json.loads(sources.response[0])
    topics = jrsp['activeTopics']
    topics_stats = [{'id': t['id'],
                     'name': t['name'],
                     'judged': get_judged_topics_count([t['id']], False),
                     'judged_sum': get_sum_judged_topics(t['id'], False),
                     'positively_judged': get_judged_topics_count([t['id']], True),
                     'positively_judged_sum': get_sum_judged_topics(t['id'], True),
                     'threshholds': get_modeled_topics_count([t['id']])
                     } for t in topics]
    return topics_stats

