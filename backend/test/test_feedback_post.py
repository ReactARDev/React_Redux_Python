import json
import test_app
import pprint

class FeedbackTest(test_app.AppTest):
    def test_send_feedback(self):
        # First lets have the user send feedback successfully
        req_body = json.dumps({'feedback': 'This app is great!'})
        resp = self.client.post(
            "/feedback",
            headers={'Authorization': self.token},
            data=req_body
        )
        self.assert200(resp)

    def test_send_feedback_on_topics(self):
        # lets test if the proper subject line is printed out when the topics flag is passed
        req_body = json.dumps({'feedback': 'This app is great!', 'topics': True})
        resp = self.client.post(
            "/feedback",
            headers={'Authorization': self.token},
            data=req_body
        )

        self.assert200(resp)
