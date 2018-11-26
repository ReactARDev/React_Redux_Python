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

BuildName = jsearch.ACTIVE_INDEX_NAME
SearchVersion = 1

## NB: tweak by hand for now
## koala-0 = javelina
## koala-1 = acronym boost (boost=8.0)

# create a token to use for authorization for all api calls
user = db_session_users.query(User).filter_by(id=1).scalar()
seconds_until_expiration = 60 * 60 * 24 * 14
expiration_datetime = dt.datetime.utcnow() + dt.timedelta(seconds=seconds_until_expiration)
token = jwt.encode({'user_id': user.id, 'exp': expiration_datetime}, SECRET_JWT)

for q in db_session_users.query(SearchRegressionQuery).all():
    url = "http://localhost:5000/documents?query={}".format(q.query)
    response = requests.get(url, headers={'Authorization': token})
    docs  = response.json()['documents']
    doc_ids = [ d['id'] for d in docs ]
    scores  = [ d['score'] for d in docs ]
    results = { 'documents': docs }
    assessment_params = {
        'query_id': q.id,
        'build':    BuildName,
        'version':  SearchVersion,
        'scores':   scores,
        'results':  results,
        'doc_ids':  doc_ids

    }
    db_session_users.add(SearchAssessmentResult(assessment_params))
db_session_users.commit()
