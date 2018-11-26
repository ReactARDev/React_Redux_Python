import json
import test_app
from schemas.base_users import Team, TeamMember
from test_app import db_session_users
from factories import UserTeamFactory, UserTeamMemberFactory

class TeamGetTest(test_app.AppTest):
    def before_each(self):
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
        
    def test_get_all_teams(self):
        self.before_each()
        
        response = self.client.get("/teams", headers={'Authorization': self.admin_user_token})
        self.assertIn('teams', response.json)
        self.assertIsInstance(response.json['teams'], list)
        self.assertEqual(len(response.json['teams']), 2)
        
    def test_get_all_team_members(self):
        self.before_each()
        
        response = self.client.get("/teams/" + str(self.teams[0].id) + "/team_members", headers={'Authorization': self.token})
        self.assertIn('team_members', response.json)
        self.assertIsInstance(response.json['team_members'], list)
        self.assertEqual(len(response.json['team_members']), 1)