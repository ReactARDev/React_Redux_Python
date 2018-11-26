import os
import sys
import json
import datetime as dt
from random import shuffle

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../..')

from helpers.agency_helper import DefaultAgencies
from schemas.base_users import AggregatedAnnotations

#dt.datetime.strptime(doc_date, "%Y-%m-%d"),
def mock_document(doc_id, i, date_id):
    if date_id < 10:
        doc_date = "2016-01-0{}".format(date_id)
    else:
        doc_date = "2016-01-{}".format(date_id)
    return {
        'id': doc_id,
        'pdf_url': 'www.foo.bar/one/two/' + str(i) + '.pdf',
        'full_path': 'www.foo.bar/one/two/' + str(i),
        'title': 'I am a title ' + str(date_id),
        'summary_text': 'Summary is me ' + str(i),
        'web_url': 'www.foo.bar/one/two/' + str(i),
        'publication_date': doc_date,
        'category': 'Presidential Document',
        'president': 'Watman',
        'meta_table': 'barfoo',
        'provenance': 'fed_api_docs',
        'full_text': "He doesn't know how to read this",
        'jurisdiction': 'US',
        'children': [],
        'dockets': [],
        'cfr_parts': [],
        "cited_associations": {
            "act_ids": [],
            "named_regulation_ids": [],
            'concept_ids': [],
            'citation_ids': [],
            'bank_ids': [],
        },
        'topics': [],
    }

# create one doc to share across agencies, and with a different category (Notice)
#'publication_date': dt.datetime.strptime('2016-01-01', "%Y-%m-%d"),
def build_mock_documents():
    shared_doc = {
        'id': 0,
        'pdf_url': 'www.foo.bar/one/two/30.pdf',
        'full_path': 'www.foo.bar/one/two/30',
        'title': 'I am a title 30',
        'summary_text': 'Summary is me 30',
        'web_url': 'www.foo.bar/one/two/30',
        'publication_date': '2016-01-01',
        'category': 'Notice',
        'president': 'Watman',
        'provenance': 'scrapinghub_api_docs',
        'meta_table': 'foobar',
        'full_text': 'Yada yada yada',
        'jurisdiction': 'US',
        'children': [{
            'id': 1,
        }],
        'topics': [],
    }

    all_documents = [ shared_doc ]

    current_doc_id = 1

    # add 5 (arbitrary) docs for each agency
    #agency_documents = { }
    date_id = 2 ## TODO: what is this for?
    agencies = json.loads(open(this_folder + '/agencies_20160721.json').read())['agencies']
    default_agency_lookup = set(DefaultAgencies)
    default_agencies = [a for a in agencies if a['id'] in default_agency_lookup]
    for agency_dict in default_agencies[0:3]:
        docs = []
        for i in range(0, 5):
            docs.append(mock_document(current_doc_id, i, date_id))
            current_doc_id += 1
            date_id += 1
        shuffle(docs)
        all_documents.extend(docs)
        #agency_documents[agency_dict['id']] = docs + [ shared_doc ]

    ## Decorate the document objects with sub-resources
    date_id = 1
    rules = []
    doc_mentions = []
    for doc in all_documents:

        # add a rule for each document with an effective on date
        if date_id < 10:
            rule_date = '2016-01-0{}'.format(date_id)
        else:
            rule_date = '2016-01-{}'.format(date_id)
        #doc['rule'] = {'doc_id': doc['id'], 'effective_on': dt.datetime.strptime(rule_date,"%Y-%m-%d")}
        doc['rule'] = {'doc_id': doc['id'], 'effective_on': rule_date, 'comments_close_on': rule_date}

        # add a documentmentions entry with labeled/parsed dates that increment in the same way as effective_on
        doc['important_dates'] = {
            'labeled_dates': [{
                'date': '2016-01-' + str(date_id),
                'label': 'filed_date',
                'snippet': 'Lorem ipsum 2016-01-' + str(date_id),
            }],
            'parsed_dates': ['2016-01-' + str(date_id)],
            'date_text': 'Lorem ipsum 2016-01-' + str(date_id)
        }

        # stuff some concept mentions inside just one doc
        if doc['id'] == shared_doc['id']:
            doc['concept_mentions'] = ['Guidance']
            doc['concept_ids'] = [8]

        if date_id < 30:
            date_id += 1
        else:
            date_id = 1

    # add some popular act names
    acts = json.loads(open(this_folder + '/popular_act_names.json').read())['popular_names'][0:10]
    cur_id = 1
    for a in acts:
        a['id'] = cur_id
        cur_id += 1

    cfr_parts = [{'id': 1, 'title': 1, 'part': 1 }]

    # add some regulations
    regulations = [
        {'id': 1, 'short_name': '1337', 'name': 'Regulation S'},
        {'id': 2, 'short_name': '1234', 'name': 'Yet another named regulation'}
    ]

    concept_mentions = [
        {"id": 0, "name": 'Arbitration Agreements'},
        {"id": 1, "name": 'Consumer Protection'},
        {"id": 2, "name": 'Privacy'}
    ]

    banks = [
        {
            "id": 1,
            "name": "JPMorgan Chase Bank, National Association",
            "nicknames": [
                "Jpmorgan Chase & Co.",
                "Chase Bank",
                "Chase Bank USA, National Association",
                "Jpmorgan Chase & Co."
            ]
        },
        {
            "id": 2,
            "name": "Wells Fargo Bank, National Association",
            "nicknames": [
                "Wells Fargo & Company",
                "Wells Fargo",
            ]
        }
    ]

    jurisdictions = [
        {
            "id": 1,
            "short_name": "US-CA",
            "name": "California"
        },
        {
            "id": 2,
            "short_name": "US-NY",
            "name": "New York"
        }
    ]

    news_sources = [
        {
            "id": 1,
            "name": "American Banker"
        },
        {
            "id": 2,
            "name": "The Economist",
        }
    ]

    active_topic_ids = {1, 2, 3, 7, 17, 18}
    topics = []
    for topic_id, topic_name in AggregatedAnnotations.topic_id_name_mapping.items():
        topics.append({'id': topic_id, 'name': topic_name})

    # eh probability doc with two agreed annotations (should come back as in topic)
    all_documents[0]['topics'] = [{"id": 1, "judge_count": 2, "model_probability": 0.7, "name": "Lending", "positive_judgments": 2}]

    # low probability doc with no annotations
    all_documents[1]['topics'] = [{"id": 1, "judge_count": 0, "model_probability": 0.5, "name": "Lending", "positive_judgments": 0}]

    # eh probability doc with two disagreeing annotations (should come back as in topic)
    all_documents[2]['topics'] = [{"id": 1, "judge_count": 2, "model_probability": 0.7, "name": "Lending", "positive_judgments": 1}]

    # high probability doc with no annotations (should come back as in topic)
    all_documents[3]['topics'] = [{"id": 1, "judge_count": 0, "model_probability": 0.99, "name": "Lending", "positive_judgments": 0}]

    # high probability doc with (mostly)disagreeing annotations
    all_documents[4]['topics'] = [{"id": 1, "judge_count": 3, "model_probability": 0.99, "name": "Lending", "positive_judgments": 1}]

    # eh probability doc with (partly)disagreeing annotations (should come back as in topic)
    all_documents[5]['topics'] = [{"id": 1, "judge_count": 2, "model_probability": 0.7, "name": "Lending", "positive_judgments": 1}]

    # split the documents amongst 2 agencies
    midway = len(all_documents) / 2
    for i, doc in enumerate(all_documents):
        doc['agencies'] = [default_agencies[0 if i < midway else 1]]

    shared_doc["cited_associations"] = {
        "act_ids": [acts[0]['id']],
        "named_regulation_ids": [regulations[0]['id']],
        'concept_ids': [concept_mentions[0]['id']],
        'citation_ids': [],
        'bank_ids': [banks[0]['id']],
    }
    shared_doc['cfr_parts'] = [ cfr_parts[0] ]    # add a cfr part to a doc
    shared_doc['dockets'] = []
    #shared_doc['cfr_parts'] = []

    # add one extra document associated with a non-default agency, and associate it with a regulation too
    non_default_agency = [a for a in agencies if a['id'] not in default_agency_lookup][0]
    extra_doc = mock_document(current_doc_id+1, 0, date_id+1)
    extra_doc['agencies'] = [ non_default_agency ]
    extra_doc["cited_associations"] = {
        "act_ids": [],
        "named_regulation_ids": [regulations[0]['id']],
        'concept_ids': [],
        'citation_ids': [],
        'bank_ids': [],
    }
    all_documents.append(extra_doc)

    # add one extra document not associated with any agency (the whitepaper case)
    no_agency_doc = mock_document(current_doc_id+2, 0, date_id+2)
    no_agency_doc["category"] = "Whitepaper"
    no_agency_doc["cited_associations"] = {
        "act_ids": [],
        "named_regulation_ids": [],
        'concept_ids': [],
        'citation_ids': [],
        'bank_ids': [],
    }
    all_documents.append(no_agency_doc)

    mainstream_news_doc = mock_document(current_doc_id+3, 0, date_id+3)
    mainstream_news_doc["category"] = "Mainstream News"
    mainstream_news_doc["mainstream_news"] = {
        "image_content_type": "image/jpeg",
        "image_hash": "foo",
        "image_url": "bar",
        "news_source": { "id": 2, "name": "watman news" },
    }

    mainstream_news_doc["cited_associations"] = {
        "act_ids": [],
        "named_regulation_ids": [],
        'concept_ids': [],
        'citation_ids': [],
        'bank_ids': [],
    }
    all_documents.append(mainstream_news_doc)

    enforcement_doc = mock_document(current_doc_id+4, 0, date_id+4)
    enforcement_doc["publication_date"] = "2017-01-01"
    enforcement_doc["category"] = "Enforcement"
    enforcement_doc["agencies"] = [a for a in agencies if a['id'] == 466]
    enforcement_doc["cited_associations"] = {
        "act_ids": [],
        "named_regulation_ids": [],
        'concept_ids': [],
        'citation_ids': [],
        'bank_ids': [],
    }
    all_documents.append(enforcement_doc)

    old_enforcement_doc = mock_document(current_doc_id+5, 0, date_id+5)
    old_enforcement_doc["publication_date"] = "2010-01-01"
    old_enforcement_doc["category"] = "Enforcement"
    old_enforcement_doc["agencies"] = [a for a in agencies if a['id'] == 466]
    old_enforcement_doc["cited_associations"] = {
        "act_ids": [],
        "named_regulation_ids": [],
        'concept_ids': [],
        'citation_ids': [],
        'bank_ids': [],
    }
    all_documents.append(old_enforcement_doc)

    document_citations = [
        {
            'doc_id': shared_doc['id'],
            'act_id': acts[0]['id'],
            'mentions': ['foo']
        },
        {
            'doc_id': shared_doc['id'],
            'named_regulation_id': regulations[0]['id'],
            'mentions': ['foo', 'bar']
        },
        {
            'doc_id': shared_doc['id'],
            'concept_id': concept_mentions[0]['id'],
            'mentions': ['lending']
        },
        {
            'doc_id': shared_doc['id'],
            'bank_id': banks[0]['id'],
            'mentions': ['Wells Fargo']
        },
        {
            'doc_id': extra_doc['id'],
            'named_regulation_id': regulations[0]['id'],
            'mentions': ['bar']
        },
    ]


    results = {
        'documents': all_documents,
        'acts': acts,
        'named_regulations': regulations,
        'concepts': concept_mentions,
        'jurisdictions': jurisdictions,
        'news_sources': news_sources,
        'banks': banks,
        'document_citations': document_citations,
        'all_topics': topics,
        'topics': [t for t in topics if t['id'] in active_topic_ids]
    }

    return results

if __name__ == '__main__':
    print json.dumps(build_mock_documents())
