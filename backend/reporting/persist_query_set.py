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

def build_query_set():
    for line in open(this_folder + '/fixtures/relevance_queries.tsv'):
        query = line.strip().split("\t")[1]
        if not db_session_users.query(SearchRegressionQuery).filter_by(query=query).scalar():
            db_session_users.add(SearchRegressionQuery({ 'query': query}))
    db_session_users.commit()

build_query_set()
