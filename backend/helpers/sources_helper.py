import schemas.jurasticsearch as jsearch
from flask import g, jsonify


def get_sources(params):
    results = {
        'defaultMainstreamNewsSources': jsearch.query_records({'size': 1000}, doc_type='news_sources'),
        'defaultTopics': jsearch.query_records({'size': 1000}, doc_type='all_topics'),
        'activeTopics': jsearch.query_records({'size': 1000}, doc_type='topics')
    }
    return jsonify(results)
