import json
import test_app
from test_app import db_session_users
from schemas.base_users import User
from factories import UserTeamFactory

class UserUpdateTest(test_app.AppTest):
    def test_update_user_wrong_email(self):
        request_body = json.dumps({})

        response = self.client.post("/users/"+self.user.email, headers={'Authorization': self.new_user_token}, data=request_body)

        self.assert404(response)
        self.assertEqual(response.json, {'errors': 'Not found'})

    def test_update_user_wrong_password(self):
        request_body = json.dumps({'new_password': 'wat', 'current_password': 'bar'})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token}, data=request_body)

        self.assert400(response)
        self.assertEqual(response.json, {'errors': {'field': 'password'}})

    def test_update_user_correct_password(self):
        request_body = json.dumps({'new_password': 'wat', 'current_password': 'foobar'})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token}, data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
        }, response.json.get('user'))

        updated_user = db_session_users.query(User).filter_by(email=self.new_user.email).first()
        self.assertTrue(updated_user.compare_password('wat'))

    def test_update_user_name(self):
        request_body = json.dumps({"first_name": 'blah', 'last_name': "blah"})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': 'blah',
            'last_name': "blah",
            'id': self.new_user.id,
        }, response.json.get('user'))

    def test_update_user_name_by_other_normal_user(self):
        request_body = json.dumps({"first_name": 'blah', 'last_name': "blah"})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.token},
                                    data=request_body)
        self.assert404(response)
        self.assertEqual(response.json, {'errors': 'Not found'})

    def test_update_user_name_by_other_admin_user(self):
        request_body = json.dumps({"first_name": 'blah', 'last_name': "blah"})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': 'blah',
            'last_name': "blah",
            'id': self.new_user.id,
        }, response.json.get('user'))

    def test_update_user_email(self):
        # n.b. upper case WAT to verify the api lower cases the value
        request_body = json.dumps({"email": "WAT@man.com"})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': "wat@man.com",
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
        }, response.json.get('user'))

    def test_update_user_properties(self):
        request_body = json.dumps({"properties": {"email_updates": { "agency_weekly": True, "agency_daily": True, "topics_weekly": True }}})

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'properties': {"email_updates": { "agency_weekly": True, "agency_daily": True, "topics_weekly": True }}
        }, response.json.get('user'))

    # catch-all test for company/industry/discipline/level
    def test_update_user_details(self):
        # first lets create a team for the user to be a part of
        teams = [
            UserTeamFactory(name='test_team'),
            UserTeamFactory(name='foo_team_2'),
        ]
        db_session_users.add_all(teams)
        db_session_users.commit()

        request_body = json.dumps({
            "company": "jedi order",
            "team_id": teams[1].id,
            "industry": "guarding peace and justice in the galaxy",
            "discipline": "knight",
            "level": "master"
        })
        # then lets update the user, by adding them to a team
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            "company": "jedi order",
            "team_id": teams[1].id,
            "industry": "guarding peace and justice in the galaxy",
            "discipline": "knight",
            "level": "master"
        }, response.json.get('user'))
        
        #now lets try updating a user by removing them from a team
        request_body = json.dumps({
            "company": "jedi order",
            "team_id": None,
            "industry": "guarding peace and justice in the galaxy",
            "discipline": "knight",
            "level": "master"
        })

        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            "company": "jedi order",
            "team_id": None,
            "industry": "guarding peace and justice in the galaxy",
            "discipline": "knight",
            "level": "master"
        }, response.json.get('user'))

    def test_update_user_add_role_admin(self):
        request_body = json.dumps({"isQA": True})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'roles': ['qa']
        }, response.json.get('user'))

    def test_update_user_remove_role_admin(self):
        request_body = json.dumps({"isQA": False})
        response = self.client.post("/users/"+self.qa_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.qa_user.email,
            'first_name': self.qa_user.first_name,
            'last_name': self.qa_user.last_name,
            'id': self.qa_user.id,
            'roles': []
        }, response.json.get('user'))

    def test_update_user_add_contributor_role_admin(self):
        request_body = json.dumps({"isContributor": True})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'roles': ['contributor']
        }, response.json.get('user'))
        self.assertEqual(response.json['isSubscribedContributor'], True)

    def test_update_user_remove_contributor_role_admin(self):
        request_body = json.dumps({"isContributor": False})
        response = self.client.post("/users/"+self.contributor_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.contributor_user.email,
            'first_name': self.contributor_user.first_name,
            'last_name': self.contributor_user.last_name,
            'id': self.contributor_user.id,
            'roles': []
        }, response.json.get('user'))
        self.assertEqual(response.json['isSubscribedContributor'], False)

    def test_update_user_add_enabled_admin(self):
        request_body = json.dumps({"enabled": True})
        response = self.client.post("/users/"+self.unenabled_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.unenabled_user.email,
            'first_name': self.unenabled_user.first_name,
            'last_name': self.unenabled_user.last_name,
            'id': self.unenabled_user.id,
            'enabled': True
        }, response.json.get('user'))
        self.assertIn('confirmed_date', response.json['user']['properties'])

    def test_update_user_remove_enabled_admin(self):
        request_body = json.dumps({"enabled": False})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'enabled': False
        }, response.json.get('user'))

    def test_update_user_add_role_not_admin(self):
        request_body = json.dumps({"isQA": True})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'roles': []
        }, response.json.get('user'))

    def test_update_user_remove_role_not_admin(self):
        request_body = json.dumps({"isQA": False})
        response = self.client.post("/users/"+self.qa_user.email, headers={'Authorization': self.qa_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.qa_user.email,
            'first_name': self.qa_user.first_name,
            'last_name': self.qa_user.last_name,
            'id': self.qa_user.id,
            'roles': ['qa']
        }, response.json.get('user'))

    def test_update_user_add_contributor_role_not_admin(self):
        request_body = json.dumps({"isContributor": True})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'roles': []
        }, response.json.get('user'))

    def test_update_user_add_contributor_role_by_qa_user(self):
        request_body = json.dumps({"isContributor": True})
        response = self.client.post("/users/"+self.qa_user.email, headers={'Authorization': self.qa_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.qa_user.email,
            'first_name': self.qa_user.first_name,
            'last_name': self.qa_user.last_name,
            'id': self.qa_user.id,
            'roles': ['qa']
        }, response.json.get('user'))

    def test_update_user_remove_contributor_role_not_admin(self):
        request_body = json.dumps({"isContributor": False})
        response = self.client.post("/users/"+self.contributor_user.email, headers={'Authorization': self.contributor_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.contributor_user.email,
            'first_name': self.contributor_user.first_name,
            'last_name': self.contributor_user.last_name,
            'id': self.contributor_user.id,
            'roles': ['contributor']
        }, response.json.get('user'))

    def test_update_user_add_enabled_not_admin(self):
        request_body = json.dumps({"enabled": True})
        response = self.client.post("/users/"+self.unenabled_user.email, headers={'Authorization': self.unenabled_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.unenabled_user.email,
            'first_name': self.unenabled_user.first_name,
            'last_name': self.unenabled_user.last_name,
            'id': self.unenabled_user.id,
            'enabled': False
        }, response.json.get('user'))

    def test_update_user_remove_enabled_not_admin(self):
        request_body = json.dumps({"enabled": False})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'enabled': True
        }, response.json.get('user'))

    def test_update_user_toggle_suspended_admin(self):
        request_body = json.dumps({"suspended": True, "suspended_reason": "test"})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'suspended': True,
            "suspended_reason": "test"
        }, response.json.get('user'))

        self.assertIn("suspended_time", response.json["user"]["properties"])

    def test_update_user_toggle_suspended_no_admin(self):
        request_body = json.dumps({"suspended": True, "suspended_reason": "test"})
        response = self.client.post("/users/"+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'suspended': None,
            "suspended_reason": None
        }, response.json.get('user'))


    def test_update_user_toggle_suspended_suspended(self):
        request_body = json.dumps({"suspended": False, "suspended_reason": None})
        response = self.client.post("/users/" + self.suspended_user.email, headers={'Authorization': self.suspended_user_token},
                                    data=request_body)
        self.assert403(response)
