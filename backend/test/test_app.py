import unittest
from flask import Flask
from flask_testing import TestCase
from app import app, db_session_users
from schemas import base_users
from migrations.setup_api import add_plans
from models import *
from settings import SECRET_JWT
import jwt
import datetime as dt
import json
import os
import time
from random import shuffle
import factories
import schemas.jurasticsearch as jsearch
import migrations.setup_api as setup_db
from helpers.agency_helper import DefaultAgencies
import logging

this_folder = os.path.dirname(os.path.realpath(__file__))

# hack to get before all test suite behavior, surely a better way than this
global SETUP_RUN
SETUP_RUN = False

# turn down the log level for some noisy libraries when unit tests fail
# as far as i can tell it isn't super useful, and removing these lines would bring it back,
# if we ever found otherwise
logging.getLogger('elasticsearch').setLevel(logging.ERROR)
logging.getLogger('urllib3').setLevel(logging.ERROR)
logging.getLogger('boto3').setLevel(logging.ERROR)
logging.getLogger('botocore').setLevel(logging.ERROR)
logging.getLogger('factory').setLevel(logging.ERROR)


class AppTest(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        return app

    # helper method to create a user and return the login token
    def create_user_and_return_id_and_token(self, roles=[], suspended=None, is_internal_user=None, enabled=None):
        # create a user to login with
        user = factories.UserFactory(password='foobar')
        user.roles = roles

        if suspended is not None:
            user.suspended = suspended

        if is_internal_user is not None:
            user.is_internal_user = is_internal_user

        if enabled is not None:
            user.enabled = enabled

        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        # create a token to use for authorization for all api calls for the user created above
        seconds_until_expiration = 60 * 60 * 24 * 14
        expiration_datetime = dt.datetime.utcnow() + dt.timedelta(seconds=seconds_until_expiration)
        return user, jwt.encode({'user_id': user.id, 'exp': expiration_datetime}, SECRET_JWT)

    @classmethod
    def setUpClass(cls):
        # break off here if we've run the setup once for before all suite behavior, since this gets called once
        # per subclass of AppTest.
        # if we ever truly want class-agnostic per-class steps, we could name this method something else and call
        # it from here
        if SETUP_RUN: return

        cls.maxDiff = None

        cls.tearDownClassForRealz()
        base_users.BaseUsers.metadata.create_all(base_users.engine_users)

        jsearch.setup_test_index()
        time.sleep(0.2)  ## avoid race conditions

        fixtures = json.loads(open(this_folder + '/fixtures/fixtures_201712.json').read())
        all_agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']
        default_agency_lookup = set(DefaultAgencies)
        cls.agencies = [a for a in all_agencies if a['id'] in default_agency_lookup]

        cls.all_documents = fixtures['documents']
        cls.acts = fixtures['acts']
        cls.regulations = fixtures['named_regulations']
        cls.concept_mentions = fixtures['concepts']
        cls.jurisdictions = fixtures['jurisdictions']
        cls.banks = fixtures['banks']
        cls.document_citations = fixtures['document_citations']
        cls.topics = fixtures['topics']
        cls.all_topics = fixtures['all_topics']
        cls.news_sources = fixtures['news_sources']
        topic_judgments = []
        topic = {"id": 1, "name": "General Provisions"}
        for i in range(0, 5):
            topic_judgments.append({
                'topic_id': topic['id'],
                'topic_name': topic['name'],
                'doc_id': cls.all_documents[0]['id'],
                'status': 'queued'
            })
        db_session_users.add_all([base_users.TopicJudgment(x) for x in topic_judgments])
        db_session_users.commit()

        # once everything is shoved into the db that we need to read, index it once!
        ## TODO: not yet covered
        # indexer.index_concepts()
        # indexer.index_dockets()
        for agency in cls.agencies: jsearch.index_jsearch_dict(agency, 'agencies')
        for act in cls.acts: jsearch.index_jsearch_dict(act, 'acts')
        for reg in cls.regulations: jsearch.index_jsearch_dict(reg, 'named_regulations')
        for doc in cls.all_documents: jsearch.index_jsearch_dict(doc, 'documents')
        for cm in cls.concept_mentions: jsearch.index_jsearch_dict(cm, 'concepts')
        for j in cls.jurisdictions: jsearch.index_jsearch_dict(j, 'jurisdictions')
        for b in cls.banks: jsearch.index_jsearch_dict(b, 'banks')
        for dc in cls.document_citations: jsearch.index_jsearch_dict(dc, 'document_citations')
        for t in cls.topics: jsearch.index_jsearch_dict(t, 'topics')
        for t in cls.all_topics: jsearch.index_jsearch_dict(t, 'all_topics')
        for n in cls.news_sources: jsearch.index_jsearch_dict(n, 'news_sources')

        time.sleep(1.0)  ## avoid race conditions

        # make sure we note that we've run this method once
        global SETUP_RUN
        SETUP_RUN = True

    def setUp(self):
        self.user, self.token = self.create_user_and_return_id_and_token()

        # create a second user/token so the user updates tests are independent of all else
        self.new_user, self.new_user_token = self.create_user_and_return_id_and_token()
        self.admin_user, self.admin_user_token = self.create_user_and_return_id_and_token(roles=['admin'])
        self.qa_user, self.qa_user_token = self.create_user_and_return_id_and_token(roles=['qa'])
        self.suspended_user, self.suspended_user_token = self.create_user_and_return_id_and_token(suspended=True)
        self.internal_user, self.internal_user_token = self.create_user_and_return_id_and_token(is_internal_user=True)
        self.contributor_user, self.contributor_user_token = self.create_user_and_return_id_and_token(
            roles=['contributor'])
        self.unenabled_user, self.unenabled_user_token = self.create_user_and_return_id_and_token(enabled=False)

        api_key = ApiKey({'enabled': True})
        api_key.gen_token()
        db_session_users.add(api_key)
        db_session_users.commit()
        db_session_users.refresh(api_key)
        self.api_key = api_key
        # for the sake of testing populate plans table
        add_plans()

        # n.b. this should be removed when mainstream news category is launched
        os.environ["MAINSTREAM_NEWS_ENABLED"] = "true"

    # hackery to ensure register tests still work, multiple tests depended on the same email address, which
    # in a before/all world must be made unique for each independent test
    def tearDown(self):
        foobar_user = db_session_users.query(User).filter_by(email="foobar@example.com").first()
        if foobar_user:
            db_session_users.query(UserAgency).filter_by(user_id=foobar_user.id).delete()
            db_session_users.commit()

            db_session_users.delete(foobar_user)
            db_session_users.commit()

    @classmethod
    def tearDownClassForRealz(cls):
        db_session_users.remove()
        base_users.BaseUsers.metadata.drop_all(base_users.engine_users)

        # remove the testing index if it exists on elasticsearch
        # FIXME: this is a total hack since setUp and tearDown run on each test, but we don't want indexing
        # to run on every single test
        try:
            jsearch.client.indices.delete(index='testing')
        except:
            pass
