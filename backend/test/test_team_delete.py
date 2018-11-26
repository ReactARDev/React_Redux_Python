import json
import test_app
from schemas.base_users import Team, TeamMember
from test_app import db_session_users
from factories import UserTeamFactory, UserTeamMemberFactory

class TeamDeleteTest(test_app.AppTest):
    def before_each(self):
        # n.b. cleaning this out due to other test interference
        db_session_users.query(TeamMember).delete() 
        db_session_users.query(Team).delete()    
        
        self.teams = [
            UserTeamFactory(name='test_team'),
            UserTeamFactory(name='foo_team_2')
        ]
        db_session_users.add_all(self.teams)
        db_session_users.commit()
        for team in self.teams:
            db_session_users.refresh(team)
        
        self.teamMembers = [
            UserTeamMemberFactory(user_id=self.user.id, team_id=self.teams[0].id),
            UserTeamMemberFactory(user_id=self.user.id, team_id=self.teams[1].id),
        ]
        db_session_users.add_all(self.teamMembers)
        db_session_users.commit()
        for tm in self.teamMembers:
            db_session_users.refresh(tm)

    def test_remove_team_member(self):
        self.before_each()
        # verify error returned if user not on team
        request_body = json.dumps({'user_id': 767})
        response = self.client.delete("/teams/"+ str(self.teams[0].id) +"/team_members", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assertIn("errors", response.json)
        
        # verify success message 
        request_body = json.dumps({'user_id': self.user.id})
        response = self.client.delete("/teams/"+ str(self.teams[0].id) +"/team_members", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['team_member_removed'])
        
    def test_remove_team(self):
        self.before_each()
        # verify error returned if user not on team
        response = self.client.delete("/teams/199", headers={'Authorization': self.admin_user_token})
        self.assertIn("errors", response.json)
        
        # verify success message 
        response = self.client.delete("/teams/"+ str(self.teams[0].id), headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn('msg', response.json)
                