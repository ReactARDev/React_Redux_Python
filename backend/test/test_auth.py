import urllib
import test_app
from schemas.base_users import User
from test_app import db_session_users

class UserFetchTest(test_app.AppTest):
    def test_access_token_header(self):
        response = self.client.get("/users/"+self.user.email, headers={'Authorization': self.token})

        self.assert200(response)

    def test_access_token_query(self):
        url = "/users/%s?access_token=%s" % (self.user.email, self.token)
        response = self.client.get(url)

        self.assert200(response)

    def test_access_token_header_invalid(self):
        response = self.client.get("/users/"+self.user.email, headers={'Authorization': 'foo'})

        self.assert403(response)

    def test_access_token_query_invalid(self):
        url = "/users/%s?access_token=%s" % (self.user.email, 'bar')
        response = self.client.get(url)

        self.assert403(response)

    def test_access_token_header_empty(self):
        response = self.client.get("/users/"+self.user.email, headers={'Authorization': ''})

        self.assert403(response)

    def test_access_token_query_empty(self):
        url = "/users/%s?access_token=%s" % (self.user.email, '')
        response = self.client.get(url)

        self.assert403(response)

    def test_no_access_token(self):
        url = "/users/%s"
        response = self.client.get(url)

        self.assert403(response)

    def test_access_suspended_user_token(self):
        response = self.client.get("/users/"+self.suspended_user.email, headers={'Authorization': self.suspended_user_token})

        self.assert403(response)

    def test_access_token_header_api_key(self):
        response = self.client.get("/docs", headers={'Authorization': self.api_key.token})

        self.assert200(response)

    def test_access_token_query_api_key(self):
        url = "/docs?access_token=%s" % urllib.quote(self.api_key.token)
        response = self.client.get(url)

        self.assert200(response)
