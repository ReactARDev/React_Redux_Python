import os
import json
import test_app
from test_app import db_session_users
from schemas.base_users import UserAgency

this_folder = os.path.dirname(os.path.realpath(__file__))

class AgencyPostTest(test_app.AppTest):

    @classmethod
    def setUpClass(cls):
        super(AgencyPostTest, cls).setUpClass()
        cls.agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']

    def setUp(self):
        super(AgencyPostTest, self).setUp()
        self.agencies = self.__class__.agencies

    def test_follow_an_agency(self):
        request_body = json.dumps({
            'agencies': [{ 'id': 466, 'following': True }],
        })
        
        response = self.client.post(
            "/agencies",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('agencies', response.json)
        self.assertEquals(response.json, { 'agencies': [{ 'id': 466, 'following': True }], 'success': True })

        user_agency = db_session_users.query(UserAgency).filter_by(agency_id=466, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency)
        self.assertTrue(user_agency.following)

        # try to read it back
        response = self.client.get('/agencies?following=true', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('agencies', response.json)
        
    def test_follow_multiple_agencies(self):
        request_body = json.dumps({
            'agencies': [
                { 'id': 466, 'following': True },
                { 'id': 80, 'following': True },
                { 'id': 538, 'following': True }
            ],
        })
        
        response = self.client.post(
            "/agencies",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('agencies', response.json)
        self.assertEquals(response.json, { 'agencies': [{ 'id': 466, 'following': True },
                                                        { 'id': 80, 'following': True },
                                                        { 'id': 538, 'following': True }], 'success': True })

        user_agency = db_session_users.query(UserAgency).filter_by(agency_id=466, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency)
        self.assertTrue(user_agency.following)
        
        user_agency_two = db_session_users.query(UserAgency).filter_by(agency_id=80, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency_two)
        self.assertTrue(user_agency_two.following)
        
        user_agency_three = db_session_users.query(UserAgency).filter_by(agency_id=538, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency_three)
        self.assertTrue(user_agency_three.following)

        # try to read it back
        response = self.client.get('/agencies?following=true', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('agencies', response.json)
        
    def test_follow_unfollow_multiple_agencies(self):
        #first set all the agencies to follow: True so that we may unfollow later
        user_agencies = [
            UserAgency({'user_id': self.user.id, 'agency_id': 466, 'following': False}),
            UserAgency({'user_id': self.user.id, 'agency_id': 80, 'following': True}),
            UserAgency({'user_id': self.user.id, 'agency_id': 538, 'following': True}),
        ]
        db_session_users.add_all(user_agencies)
        db_session_users.commit()
        
        # now update them to unfollow
        request_body = json.dumps({
            'agencies': [
                { 'id': 466, 'following': True },
                { 'id': 80, 'following': False },
                { 'id': 538, 'following': False }
            ],
        })
        
        response = self.client.post(
            "/agencies",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('agencies', response.json)
        self.assertEquals(response.json, { 'agencies': [{ 'id': 466, 'following': True },
                                                        { 'id': 80, 'following': False },
                                                        { 'id': 538, 'following': False }], 'success': True })

        user_agency = db_session_users.query(UserAgency).filter_by(agency_id=466, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency)
        self.assertTrue(user_agency.following)
        
        user_agency_two = db_session_users.query(UserAgency).filter_by(agency_id=80, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency_two)
        self.assertFalse(user_agency_two.following)
        
        user_agency_three = db_session_users.query(UserAgency).filter_by(agency_id=538, user_id=self.user.id).first()
        self.assertIsNotNone(user_agency_three)
        self.assertFalse(user_agency_three.following)
