import test_app
from schemas.base_users import User
from test_app import db_session_users

class UserFetchTest(test_app.AppTest):
    def get_user_hash(self):
        return {
                'email': self.user.email,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'id': self.user.id,
                'company': self.user.company,
                'team_id': self.user.team_id,
                'industry': self.user.industry,
                'discipline': self.user.discipline,
                'level': self.user.level,
                'properties': self.user.properties,
                'is_internal_user': self.user.is_internal_user
        }

    def test_user_details(self):
        response = self.client.get("/users/"+self.user.email, headers={'Authorization': self.token})

        user_response = response.json.get('user')

        self.assertIsInstance(user_response, dict)

        self.assertDictContainsSubset(
            self.get_user_hash(),
            user_response
        )

    def test_user_details_by_other_normal_user(self):
        response = self.client.get("/users/"+self.user.email, headers={'Authorization': self.new_user_token})
        self.assert404(response)
        self.assertEqual(response.json, {'errors': 'Not found'})

    def test_user_details_by_other_admin_user(self):
        response = self.client.get("/users/"+self.user.email, headers={'Authorization': self.admin_user_token})

        user_response = response.json.get('user')

        self.assertIsInstance(user_response, dict)

        self.assertDictContainsSubset(
            self.get_user_hash(),
            user_response
        )

    def test_current_user(self):
        response = self.client.get("/current_user", headers={'Authorization': self.token})

        user_response = response.json.get('user')

        self.assertIsInstance(user_response, dict)

        self.assertDictContainsSubset(
            self.get_user_hash(),
            user_response
        )

        user_properties = user_response.get('properties')

        self.assertIsInstance(user_properties, dict)


    def test_user_emails_by_normal_user(self):
        response = self.client.get("/users", headers={'Authorization': self.token})
        self.assert404(response)
        self.assertEqual(response.json, {'errors': 'Not found'})


    def test_user_emails_by_admin_user(self):
        fields = [User.email, User.enabled, User.first_name, User.last_name, User.company, User.team_id, User.industry,
                  User.discipline, User.level, User.properties, User.roles, User.id, User.suspended,
                  User.suspended_reason, User.created_at]
        all_users = [{
                         "email": u[0],
                         "enabled": u[1],
                         "first_name": u[2],
                         "last_name": u[3],
                         "company": u[4],
                         "team_id": u[5],
                         "industry": u[6],
                         "discipline": u[7],
                         "level": u[8],
                         "properties": u[9],
                         "roles": u[10],
                         'id': u[11],
                         "suspended": u[12],
                         "suspended_reason": u[13],
                         "created_at": unicode(u[14]),
                     } for u in db_session_users.query(*fields).all()]
        response = self.client.get("/users", headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn('users', response.json)
        self.assertIsInstance(response.json['users'], list)
        self.assertEqual(response.json['users'], all_users)
