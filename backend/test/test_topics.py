import json
import test_app
from schemas.base_users import UserTopic
from test_app import db_session_users
from factories import *

class FolowedTopicsTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(UserTopic).delete()
        self.user_followed_topics = [
            UserTopic({
                'user_id': self.user.id,
                'topic_id': 1,
                'following': True
            }),
            UserTopic({
                'user_id': self.user.id,
                'topic_id': 2,
                'following': True
            }),
            UserTopic({
                'user_id': self.user.id,
                'topic_id': 3,
                'following': False
            }),
        ]
        db_session_users.add_all(self.user_followed_topics)
        db_session_users.commit()

    def test_get_followed_topics(self):
        self.before_each()
        response = self.client.get("/topics", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("topics", response.json)
        self.assertIsInstance(response.json["topics"], list)
        self.assertEqual(len(response.json["topics"]), 3)
        self.assertIsInstance(response.json["topics"][0], dict)
        self.assertEqual(response.json["topics"][0]['topic_id'], 1)
        self.assertEqual(response.json['topics'][0]['following'], True)

        self.assertIsInstance(response.json["topics"][2], dict)
        self.assertEqual(response.json["topics"][2]['topic_id'], 3)
        self.assertEqual(response.json['topics'][2]['following'], False)

    def test_follow_a_topic(self):
        self.before_each()
        request_body = json.dumps({'topics': [{ 'id': 3, 'following': True }]})
        response = self.client.post("/topics", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("topics", response.json)
        self.assertIsInstance(response.json["topics"], list)
        self.assertEqual(response.json['success'], True)
        self.assertEqual(response.json['topics'][0]['id'], 3)
        self.assertEqual(response.json['topics'][0]['following'], True)

    def test_unfollow_a_topic(self):
        self.before_each()
        request_body = json.dumps({'topics': [{ 'id': 2, 'following': False }]})
        response = self.client.post("/topics", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("topics", response.json)
        self.assertIsInstance(response.json["topics"], list)
        self.assertEqual(response.json['success'], True)
        self.assertEqual(response.json['topics'][0]['id'], 2)
        self.assertEqual(response.json['topics'][0]['following'], False)

    def test_follow_unfollow_multiple_topics(self):
        self.before_each()
        request_body = json.dumps({'topics': [{ 'id': 3, 'following': True }, { 'id': 2, 'following': False }]})
        response = self.client.post("/topics", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("topics", response.json)
        self.assertIsInstance(response.json["topics"], list)
        self.assertEqual(response.json['success'], True)
        self.assertEqual(response.json['topics'][0]['id'], 3)
        self.assertEqual(response.json['topics'][0]['following'], True)
        self.assertEqual(response.json['topics'][1]['id'], 2)
        self.assertEqual(response.json['topics'][1]['following'], False)
