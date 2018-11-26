import json
import test_app
from schemas.base_users import Plan, Subscription, User
from test_app import db_session_users

class WebsocketTest(test_app.AppTest):

    def test_post_data_update(self):
        request_body = json.dumps({"documents": "True"})
        response = self.client.post("/data_updates", headers={'Authorization': self.api_key.token}, data=request_body)
        self.assertIn("data", response.json)
        self.assertEqual(response.json['data'], 'updates received')
