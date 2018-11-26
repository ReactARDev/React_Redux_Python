import json
import test_app
from schemas.base_users import UserFollowedEntity
from test_app import db_session_users
from factories import *

class FolowedEntitiesGetTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(UserFollowedEntity).delete()
        self.user_followed_entities = [
            UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 1,
                'entity_type': 'named_regulations',
                'following': True
            }),
            UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 2,
                'entity_type': 'acts',
                'following': True
            }),
            UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 3,
                'entity_type': 'acts',
                'following': False
            }),
            UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 1,
                'entity_type': 'jurisdictions',
                'following': True
            }),
            UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 2,
                'entity_type': 'jurisdictions',
                'following': True
            }),
            UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 1,
                'entity_type': 'news_sources',
                'following': True
            }),
        ]
        self.actually_followed_entities = [f for f in self.user_followed_entities if f.following]
        db_session_users.add_all(self.user_followed_entities)
        db_session_users.commit()

    def test_get_followed_entities(self):
        self.before_each()
        response = self.client.get("/followed_entities", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("followed_entities", response.json)
        self.assertIsInstance(response.json["followed_entities"], list)
        self.assertEqual(len(response.json["followed_entities"]), 5)
        for i, f in enumerate(self.actually_followed_entities):
            self.assertEqual(response.json["followed_entities"][i]['entity_id'], f.entity_id)
            self.assertEqual(response.json["followed_entities"][i]['entity_type'], f.entity_type)
            self.assertIsInstance(response.json["followed_entities"][i]['entity'], dict)
            self.assertIsInstance(response.json["followed_entities"][i]['entity']['id'], int)

        #test only getting followed states
        response = self.client.get("/followed_entities?entity_type=jurisdictions", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('followed_entities', response.json)
        self.assertEqual(len(response.json['followed_entities']), 2)

        self.assertEqual(response.json["followed_entities"][0]['entity_id'], 2)
        self.assertEqual(response.json["followed_entities"][0]['entity_type'], 'jurisdictions')
        self.assertIsInstance(response.json["followed_entities"][0]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][0]['entity']['id'], 2)
        self.assertEqual(response.json["followed_entities"][1]['entity_id'], 1)
        self.assertEqual(response.json["followed_entities"][1]['entity_type'], 'jurisdictions')
        self.assertIsInstance(response.json["followed_entities"][1]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][1]['entity']['id'], 1)

    def test_follow_a_new_entity(self):
        self.before_each()
        request_body = json.dumps({'entities': [{ 'entity_id': 2, 'entity_type': 'named_regulations', 'following': True }]})
        response = self.client.post("/followed_entities", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("followed_entities", response.json)
        self.assertIsInstance(response.json["followed_entities"], list)
        self.assertEqual(response.json["followed_entities"][0]['entity_id'], 2)
        self.assertEqual(response.json["followed_entities"][0]['entity_type'], 'named_regulations')
        self.assertIsInstance(response.json["followed_entities"][0]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][0]['entity']['id'], 2)
        self.assertEqual(response.json["followed_entities"][0]['following'], True)

    def test_follow_unfollow_multiple_entities(self):
        self.before_each()
        request_body = json.dumps({'entities': [
                { 'entity_id': 1, 'entity_type': 'named_regulations', 'following': False }, # previously set to True in before_each()
                { 'entity_id': 2, 'entity_type': 'named_regulations', 'following': True },
                { 'entity_id': 3, 'entity_type': 'acts', 'following': True }, # previously set to False in before_each()
                { 'entity_id': 1, 'entity_type': 'jurisdictions', 'following': False },
                { 'entity_id': 2, 'entity_type': 'jurisdictions', 'following': False },
                { 'entity_id': 6, 'entity_type': 'acts', 'following': True },
            ]})
        response = self.client.post("/followed_entities", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("followed_entities", response.json)
        self.assertIsInstance(response.json["followed_entities"], list)
        self.assertEqual(response.json["followed_entities"][0]['entity_id'], 1)
        self.assertEqual(response.json["followed_entities"][0]['entity_type'], 'named_regulations')
        self.assertIsInstance(response.json["followed_entities"][0]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][0]['entity']['id'], 1)
        self.assertEqual(response.json["followed_entities"][0]['following'], False)

        self.assertEqual(response.json["followed_entities"][1]['entity_id'], 2)
        self.assertEqual(response.json["followed_entities"][1]['entity_type'], 'named_regulations')
        self.assertIsInstance(response.json["followed_entities"][1]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][1]['entity']['id'], 2)
        self.assertEqual(response.json["followed_entities"][1]['following'], True)

        self.assertEqual(response.json["followed_entities"][2]['entity_id'], 3)
        self.assertEqual(response.json["followed_entities"][2]['entity_type'], 'acts')
        self.assertIsInstance(response.json["followed_entities"][2]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][2]['entity']['id'], 3)
        self.assertEqual(response.json["followed_entities"][2]['following'], True)

        self.assertEqual(response.json["followed_entities"][3]['entity_id'], 1)
        self.assertEqual(response.json["followed_entities"][3]['entity_type'], 'jurisdictions')
        self.assertIsInstance(response.json["followed_entities"][3]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][3]['entity']['id'], 1)
        self.assertEqual(response.json["followed_entities"][3]['following'], False)

        self.assertEqual(response.json["followed_entities"][4]['entity_id'], 2)
        self.assertEqual(response.json["followed_entities"][4]['entity_type'], 'jurisdictions')
        self.assertIsInstance(response.json["followed_entities"][4]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][4]['entity']['id'], 2)
        self.assertEqual(response.json["followed_entities"][4]['following'], False)

        self.assertEqual(response.json["followed_entities"][5]['entity_id'], 6)
        self.assertEqual(response.json["followed_entities"][5]['entity_type'], 'acts')
        self.assertIsInstance(response.json["followed_entities"][5]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][5]['entity']['id'], 6)
        self.assertEqual(response.json["followed_entities"][5]['following'], True)

    def test_unfollow_a_single_existing_entity(self):
        self.before_each()
        request_body = json.dumps({'entities': [{ 'entity_id': 1, 'entity_type': 'named_regulations', 'following': False }]})
        response = self.client.post("/followed_entities", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("followed_entities", response.json)
        self.assertIsInstance(response.json["followed_entities"], list)
        self.assertEqual(response.json["followed_entities"][0]['entity_id'], 1)
        self.assertEqual(response.json["followed_entities"][0]['entity_type'], 'named_regulations')
        self.assertIsInstance(response.json["followed_entities"][0]['entity'], dict)
        self.assertEqual(response.json["followed_entities"][0]['entity']['id'], 1)
        self.assertEqual(response.json["followed_entities"][0]['following'], False)
