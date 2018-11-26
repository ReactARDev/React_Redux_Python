import json
import test_app
from test_app import db_session_users
from schemas.base_users import User
from factories import UserTeamFactory

class UserDeleteTest(test_app.AppTest):
    def test_delete_user(self):
        response = self.client.delete('/delete_user/'+self.new_user.email, headers={'Authorization': self.admin_user_token})

        self.assert200(response)
        self.assertEqual(response.json, {'msg': self.new_user.email + ' successfully deleted'})

    def test_delete_user_no_admin(self):
        response = self.client.delete('/delete_user/'+self.new_user.email, headers={'Authorization': self.new_user_token})

        self.assert404(response)
        self.assertEqual(response.json, {'message': 'Not found'})

    def test_delete_user_nonexistent_email(self):
        nonexistent_email = 'banana@banana.com'
        response = self.client.delete('/delete_user/'+nonexistent_email, headers={'Authorization': self.admin_user_token})

        self.assert200(response)
        self.assertEqual(response.json, {'errors': nonexistent_email + ' doesn\'t exist'})

    def test_delete_user_with_team_folders(self):
        # create a team
        team = UserTeamFactory(name='foo_team_2')
        db_session_users.add(team)
        db_session_users.commit()

        # add user to team
        request_body = json.dumps({'team_id': team.id})
        response = self.client.post('/users/'+self.new_user.email, headers={'Authorization': self.new_user_token},
                                    data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'email': self.new_user.email,
            'first_name': self.new_user.first_name,
            'last_name': self.new_user.last_name,
            'id': self.new_user.id,
            'team_id': team.id
        }, response.json.get('user'))

        # add user to folder
        request_body = json.dumps({'name': 'foo_folder'})
        response = self.client.post('/folders', headers={'Authorization': self.new_user_token}, data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'user_id': self.new_user.id,
            'name': 'foo_folder'
        }, response.json)

        folder_id = response.json['id']

        # share folder with team
        request_body = json.dumps({'share': True, 'owner': True, 'user_id': self.new_user.id})
        response = self.client.post('/folders/'+str(folder_id), headers={'Authorization': self.new_user_token}, data=request_body)

        self.assert200(response)
        self.assertDictContainsSubset({
            'user_id': self.new_user.id,
            'folder_id': folder_id,
            'owner': True,
        }, response.json)

        # now delete the user
        response = self.client.delete('/delete_user/'+self.new_user.email, headers={'Authorization': self.admin_user_token})

        self.assert200(response)
        self.assertEqual(response.json, {'msg': self.new_user.email + ' successfully deleted'})
