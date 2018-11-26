import json
import os
import test_app
from test_app import db_session_users
from schemas.base_users import UserAgency

this_folder = os.path.dirname(os.path.realpath(__file__))

class AgencyGetTest(test_app.AppTest):
    @classmethod
    def setUpClass(cls):
        super(AgencyGetTest, cls).setUpClass()
        cls.agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']

    def setUp(self):
        super(AgencyGetTest, self).setUp()
        self.agencies = self.__class__.agencies

    def test_get_agencies(self):
        response = self.client.get('/agencies', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('agencies', response.json)

    def test_get_followed_agencies(self):
        response = self.client.get('/agencies?following=true', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('agencies', response.json)
        
    def test_get_agencies_for_search_filter(self):
        response = self.client.get('/agencies?search_filter=true', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('agencies', response.json)
