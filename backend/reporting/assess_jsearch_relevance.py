import os
import sys
import jwt
import requests
import random
import datetime as dt

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

from shared_env import *
from settings import SECRET_JWT

from schemas import base_users
from models import *
from app import app, db_session_users

from schemas import jurasticsearch as jsearch

this_folder = os.path.dirname(os.path.realpath(__file__))

## NB: For converting a raw list of queries to id,query tsv (already run)
#cur_id = 52
#for line in open(this_folder + '/fixtures/relevance_queries.tsv'):
#    line = line.strip()
#    print "{}\t{}".format(cur_id, line)
#    cur_id += 1

# create a token to use for authorization for all api calls
user = db_session_users.query(User).filter_by(id=1).scalar()
seconds_until_expiration = 60 * 60 * 24 * 14
expiration_datetime = dt.datetime.utcnow() + dt.timedelta(seconds=seconds_until_expiration)
token = jwt.encode({'user_id': user.id, 'exp': expiration_datetime}, SECRET_JWT)

test_set = [ ]

## TODO: persist, then pull from persistent resource
## TODO: make sure the resource can store eval results
for line in open(this_folder + '/fixtures/relevance_queries.tsv'):
    #print line
    line = line.strip()
    cols = line.split("\t")
    query = { 'query': cols[1], 'id': cols[0], 'type': 'search query' }
    test_set.append(query)

## Load the queries in a random order (judgments will still be grouped by query)
random.shuffle(test_set)

to_add = [ ]
for q in test_set:
    print '=================================================================================================================='
    try:
        correct  = 0
        errors   = 0
        url      = "http://localhost:5000/documents?query={}".format(q['query'])
        response = requests.get(url, headers={'Authorization': token})
        docs     = response.json()['documents']
        if docs:
            score_avg = sum([ d['score'] for d in docs ]) / len(docs)
        else:
            score_avg = 0.0
        for d in docs:
            pre_judgment = db_session_users.query(TopicJudgment).filter_by(doc_id=int(d['id']),topic_id=int()).scalar()
            if pre_judgment:
                if pre_judgment.judgment == True:
                    correct += 1
                    continue
                elif pre_judgment.judgment == False:
                    errors += 1
                    continue
            to_add.append({'topic_id': int(q['id']), 'doc_id': int(d['id']), 'topic_name': q['query']})
        print "QUERY: {}".format(q)
        print "URL: {}".format(url)
        print "HITS: {}".format(len(docs))
        print "SCORE AVG: {}".format(score_avg)
        print "Prejudged:"
        print "  Correct: {}".format(correct)
        print "  Errors: {}".format(errors)
    except Exception as e:
        print "WARNING: unable to execute query {} ...\n{}".format(q['query'], e)

print '=================================================================================================================='

### Do not persist during test runs
db_session_users.add_all([ TopicJudgment(j) for j in to_add ])
db_session_users.commit()
