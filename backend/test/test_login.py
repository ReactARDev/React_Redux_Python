import json
import test_app
import factories
import pprint
from app import db_session_users
from schemas.base_users import User, MarketingCampaignUsers

class LoginTest(test_app.AppTest):
    def test_login(self):
        user = factories.UserFactory.build(
            first_name=None,
            last_name=None,
        )
        user.enabled = False

        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        # test with a disabled account
        req_body = {
            'email': user.email,
            'password': 'doesntmatter',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        # test that proper error message is sent back, in the case a user is not from a campaign
        # but has signed-up with open registration so the msg must contain the term `verified`
        user_part_of_campaign = db_session_users.query(MarketingCampaignUsers).filter_by(id=user.id).first()
        if user_part_of_campaign or "invited_by" not in user.properties:
            self.assertRegexpMatches(resp.json['error'], r'verified')

        # invite a random user
        req_body = json.dumps({'email': 'foo+2@example.com' })
        resp = self.client.post(
            "/invite",
            headers={'Authorization': self.admin_user_token},
            data=req_body
        )

        self.assert200(resp)

        new_user = db_session_users.query(User).filter_by(email='foo+2@example.com').first()
        self.assertFalse(new_user.enabled)

        # then have the user login before becoming enabled
        req_body = {
            'email': 'foo+2@example.com',
            'password': 'doesntmatter',
        }
        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        # test that proper error message is sent out, in the case a user is neither from a campaign
        # nor has signed-up with open registration, but has been invited so the msg must contain the term `enabled`
        self.assertRegexpMatches(resp.json['error'], r'enabled')

        # enable but don't set password
        user.enabled = True
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        req_body = {
            'email': user.email,
            'password': '',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert400(resp)

        # set a password and login
        user.update_password('foo')
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        req_body = {
            'email': user.email,
            'password': 'foo',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert200(resp)

        # make sure bad password is rejected
        req_body = {
            'email': user.email,
            'password': 'bar',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert401(resp)

        # now suspend the user and make sure it fails
        user.suspended = True
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        req_body = {
            'email': user.email,
            'password': 'foo',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert401(resp)
