from mock import patch
import test_app
import datetime as dt
from app import db_session_users
from schemas.base_users import User

class GoogleLoginTest(test_app.AppTest):
    def test_google_success(self):
        with patch("requests.post") as rpost:
            mock_response = rpost.return_value
            mock_response.status_code = 200
            mock_response.json.return_value = {"access_token": "doesntmatter"}
            email = "noduplicateemailsmatter@mail.com"
            with patch("requests.get") as rget:
                mock_response = rget.return_value
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "given_name": "doesntmatter",
                    "family_name": "doesntmatter",
                    "id": "doesntmatter",
                    "email": email
                }
                req_body = {'code': 'doesntmatter', "redirect_uri": "doesntmatter", 'termsAgreed': 'true'}
                resp = self.client.post("/auth_google_token", data=req_body)

        user = db_session_users.query(User).filter_by(email=email).first()
        self.assert200(resp)
        self.assertIn("jwt_token", resp.data)
        self.assertIn('confirmed_date', user.properties)
        self.assertIsInstance(user.properties['confirmed_date'], basestring)
        self.assertEqual(True, user.enabled)

    def test_success_link_to_email_account(self):
        email = "yesnoduplicateemailsmatter@mail.com"
        db_session_users.add(User({
            'email': email,
            'password': '123asdfasdf',
            'enabled': False
        }))
        db_session_users.commit()
        initial_user = db_session_users.query(User).filter_by(email=email).first()
        with patch("requests.post") as rpost:
            mock_response = rpost.return_value
            mock_response.status_code = 200
            mock_response.json.return_value = {"access_token": "doesntmatter"}
            with patch("requests.get") as rget:
                mock_response = rget.return_value
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "given_name": "doesntmatter",
                    "family_name": "doesntmatter",
                    "id": "doesntmatter",
                    "email": email
                }
                req_body = {'code': 'doesntmatter', "redirect_uri": "doesntmatter", 'termsAgreed': 'true'}
                resp = self.client.post("/auth_google_token", data=req_body)

        updated_user = db_session_users.query(User).filter_by(email=email).first()
        self.assert200(resp)
        self.assertIn("jwt_token", resp.data)
        self.assertIn('confirmed_date', updated_user.properties)
        self.assertIsInstance(updated_user.properties['confirmed_date'], basestring)
        self.assertEqual(True, updated_user.enabled)
        self.assertEqual(True, len(updated_user.google_id) > 0)
        self.assertIn('secondary_signup_dates', updated_user.properties)
        self.assertIn('google', updated_user.properties['secondary_signup_dates'])
        self.assertIsInstance(updated_user.properties['secondary_signup_dates']['google'], basestring)

    def test_google_fail_wrong_status(self):
        with patch("requests.post") as rpost:
            mock_response = rpost.return_value
            mock_response.status_code = 400
            req_body = {'code': 'doesntmatter', "redirect_uri": "doesntmatter"}
            resp = self.client.post("/auth_google_token", data=req_body)

        self.assert400(resp)
        self.assertIn("error", resp.data)

    def test_google_fail_wrong_response(self):
        with patch("requests.post") as rpost:
            mock_response = rpost.return_value
            mock_response.status_code = 200
            mock_response.json.return_value = {"error": "random"}
            req_body = {'code': 'doesntmatter', "redirect_uri": "doesntmatter"}
            resp = self.client.post("/auth_google_token", data=req_body)

        self.assert400(resp)
        self.assertIn("error", resp.data)

    def test_google_fail_no_email(self):
        with patch("requests.post") as rpost:
            mock_response = rpost.return_value
            mock_response.status_code = 200
            mock_response.json.return_value = {"access_token": "doesntmatter"}
            with patch("requests.get") as rget:
                mock_response = rget.return_value
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "given_name": "doesntmatter",
                    "family_name": "doesntmatter",
                    "id": "doesntmatter",
                }
                req_body = {'code': 'doesntmatter', "redirect_uri": "doesntmatter"}
                resp = self.client.post("/auth_google_token", data=req_body)

        self.assert400(resp)
        self.assertIn("error", resp.data)

    def test_google_fail_terms_not_agreed(self):
        with patch("requests.post") as rpost:
            mock_response = rpost.return_value
            mock_response.status_code = 200
            mock_response.json.return_value = {"access_token": "doesntmatter"}
            with patch("requests.get") as rget:
                mock_response = rget.return_value
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "firstName": "doesntmatter",
                    "lastName": "doesntmatter",
                    "id": "doesntmatter",
                    "email": "noduplicateemailsmatter@mail.com"
                }
                req_body = {'code': 'doesntmatter', "redirect_uri": "doesntmatter", 'termsAgreed': 'false'}
                resp = self.client.post("/auth_google_token", data=req_body)

        self.assert200(resp)
        self.assertEqual(resp.json["redirectToCallback"], '/socialcallback')
        self.assertEqual(resp.json["loginType"], 'google')
