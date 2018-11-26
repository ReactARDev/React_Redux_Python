import json
import test_app
import factories
import pprint
from app import db_session_users
from schemas.base_users import User

class ResetPasswordTest(test_app.AppTest):
    def test_reset(self):
        user = factories.UserFactory.build(
            first_name=None,
            last_name=None,
        )
        user.enabled = True
        user.update_password('foo')
        user.properties = {"activation_time": 'foo'}
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

        req_body = {
            'email': user.email,
        }

        resp = self.client.post(
            "/reset",
            data=json.dumps(req_body),
        )

        self.assert200(resp)

        # original password still works
        req_body = {
            'email': user.email,
            'password': 'foo',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert200(resp)

        # now actually set a new password
        req_body = {
            'email': user.email,
            'new_password': 'bar',
            'token': user.reset_token,
        }

        resp = self.client.post(
            "/activate",
            data=json.dumps(req_body),
        )

        self.assert200(resp)
        db_session_users.refresh(user)
        self.assertEqual(user.properties['activation_time'], 'foo')

        # original password doesn't work
        req_body = {
            'email': user.email,
            'password': 'foo',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert401(resp)

        # but the new one does!
        req_body = {
            'email': user.email,
            'password': 'bar',
        }

        resp = self.client.post(
            "/login",
            data=json.dumps(req_body),
        )

        self.assert200(resp)

    def test_reset_disabled_user(self):
        user = factories.UserFactory.build(
            first_name=None,
            last_name=None,
        )
        user.enabled = False
        user.gen_reset_token()
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        req_body = {
            'email': user.email,
        }

        resp = self.client.post(
            "/reset",
            data=json.dumps(req_body),
        )
        self.assert200(resp)

        updated_user = db_session_users.query(User).filter_by(email=user.email).first()
        self.assertEqual(user.reset_token, updated_user.reset_token)