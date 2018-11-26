import json
import test_app
from schemas.base_users import Team
from test_app import db_session_users
from factories import UserTeamFactory

class TeamPostTest(test_app.AppTest):
    def before_each(self): 
        self.teams = [
            UserTeamFactory(name='test_team'),
            UserTeamFactory(name='foo_team_2'),
        ]
        db_session_users.add_all(self.teams)
        db_session_users.commit()
        
    def test_add_team(self):
        self.before_each()
        # test conflict error
        request_body = json.dumps({'name': 'test_team'})
        response = self.client.post("/teams", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assertIn("errors", response.json)
        
        # test successful team add
        request_body = json.dumps({'name': 'compliance.ai'})
        response = self.client.post("/teams", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn('id', response.json)
        self.assertEqual(response.json["name"], "compliance.ai")
        
    def test_add_team_member(self):    
        self.before_each()    
        # add team member to team
        request_body = json.dumps({'user_id': self.user.id})
        response = self.client.post("/teams/"+ str(self.teams[0].id) +"/team_members", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['team_member_added'])
        
        # add team member again to test conflict error
        request_body = json.dumps({'user_id': self.user.id})
        response = self.client.post("/teams/"+ str(self.teams[0].id) +"/team_members", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assertIn("errors", response.json)
    
    def test_update_team(self):
        self.before_each()
        
        # test not found error
        request_body = json.dumps({'name': 'new_test_team'})
        response = self.client.post("/teams/365", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assertIn("errors", response.json)
        
        # test conflict error
        request_body = json.dumps({'name': 'test_team'})
        response = self.client.post("/teams/"+ str(self.teams[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assertIn("errors", response.json)
        
        # test update success
        request_body = json.dumps({'name': 'new_test_team'})
        response = self.client.post("/teams/"+ str(self.teams[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn(response.json['name'], 'new_test_team')
        