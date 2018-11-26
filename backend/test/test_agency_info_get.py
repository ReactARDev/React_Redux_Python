import json
import os
import test_app
from test_app import db_session_users
from schemas.base_users import UserAgency

this_folder = os.path.dirname(os.path.realpath(__file__))


class AgencyInfoGetTest(test_app.AppTest):
    @classmethod
    def setUpClass(cls):
        super(AgencyInfoGetTest, cls).setUpClass()
        cls.agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']

    def setUp(self):
        super(AgencyInfoGetTest, self).setUp()
        self.agencies = self.__class__.agencies

    def test_get_agency_info(self):
        response = self.client.get('/agency_infos?agency_id=573', headers={'Authorization': self.api_key.token})
        self.assert200(response)
        self.assertIn('agency', response.json)

    def test_get_agency_info_no_id(self):
        response = self.client.get('/agency_infos', headers={'Authorization': self.api_key.token})
        self.assert400(response)

    def test_get_agency_info_wrong_id(self):
        response = self.client.get('/agency_infos?agency_id=573121212', headers={'Authorization': self.api_key.token})
        self.assert404(response)