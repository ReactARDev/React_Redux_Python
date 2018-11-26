import os
import json
import test_app
from schemas.base_users import UserSavedSearch
from test_app import db_session_users

this_folder = os.path.dirname(os.path.realpath(__file__))

class SavedSearchesTest(test_app.AppTest):
    @classmethod
    def setUpClass(cls):
        super(SavedSearchesTest, cls).setUpClass()
        fixtures = json.loads(open(this_folder + '/fixtures/fixtures_201712.json').read())
        cls.acts = fixtures['acts']

    def setUp(self):
        super(SavedSearchesTest, self).setUp()
        self.acts = self.__class__.acts

    def before_each(self):
        db_session_users.query(UserSavedSearch).delete()
        self.user_saved_searches = [
            UserSavedSearch({
                'name': 'test',
                'user_id': self.user.id,
                'search_args': {"query": "test"}
            }),
            UserSavedSearch({
                'user_id': self.user.id,
                'search_args': {"agency": 466}
            }),
            UserSavedSearch({
                'name': 'bar',
                'user_id': self.user.id,
                'search_args': {"act_id": self.acts[0]['id']}
            }),
            UserSavedSearch({
                'name': 'multy',
                'user_id': self.user.id,
                'search_args': {"act_id": [d['id'] for d in self.acts[0:2]]}
            }),
            UserSavedSearch({
                'name': 'test3',
                'user_id': self.new_user.id,
                'search_args': {"query": "test"}
            }),
        ]
        db_session_users.add_all(self.user_saved_searches)
        db_session_users.commit()

    def test_get_saved_searches(self):
        self.before_each()
        response = self.client.get("/saved_searches", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("saved_searches", response.json)
        self.assertIsInstance(response.json["saved_searches"], list)
        self.assertEqual(len(response.json["saved_searches"]), 4)
        self.assertIsInstance(response.json["saved_searches"][0]['search_args'], dict)
        self.assertEqual(response.json["saved_searches"][0]['name'], "test")
        self.assertEqual(response.json["saved_searches"][0]['search_args'], {"query": "test"})
        self.assertIsInstance(response.json["saved_searches"][0]['updated_at'], basestring)

        self.assertIsInstance(response.json["saved_searches"][1]['search_args'], dict)
        self.assertIsNone(response.json["saved_searches"][1]['name'])
        self.assertEqual(response.json["saved_searches"][1]['search_args'], {"agency": 466})
        self.assertIn("entity", response.json["saved_searches"][1])
        self.assertEqual(response.json["saved_searches"][1]["entity"]["id"], 466)

        self.assertIsInstance(response.json["saved_searches"][2]['search_args'], dict)
        self.assertEqual(response.json["saved_searches"][2]['name'], "bar")
        self.assertEqual(response.json["saved_searches"][2]['search_args'], {"act_id": self.acts[0]['id']})
        self.assertIn("entity", response.json["saved_searches"][2])
        self.assertEqual(response.json["saved_searches"][2]["entity"]["id"], self.acts[0]['id'])

        self.assertIsInstance(response.json["saved_searches"][3]['search_args'], dict)
        self.assertEqual(response.json["saved_searches"][3]['name'], "multy")
        self.assertEqual(response.json["saved_searches"][3]['search_args'], {"act_id": [act['id'] for act in self.acts[0:2]]})
        self.assertIn("entity", response.json["saved_searches"][3])
        self.assertEqual(response.json["saved_searches"][3]["entity"][0]["id"], self.acts[1]['id'])
        self.assertEqual(response.json["saved_searches"][3]["entity"][1]["id"], self.acts[0]['id'])

    def test_create_saved_search_unique(self):
        self.before_each()
        request_body = json.dumps({'name': 'foo', 'search_args': {"query": "foo"}})
        response = self.client.post("/saved_searches", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("saved_search", response.json)
        self.assertIsInstance(response.json["saved_search"], dict)
        self.assertIsInstance(response.json["saved_search"]['search_args'], dict)
        self.assertEqual(response.json["saved_search"]['name'], "foo")
        self.assertEqual(response.json["saved_search"]['search_args'], {"query": "foo"})

    def test_create_saved_search_existing_name(self):
        self.before_each()
        name = self.user_saved_searches[0].name
        request_body = json.dumps({'name': name})
        response = self.client.post("/saved_searches", headers={'Authorization': self.token}, data=request_body)
        self.assertStatus(response, 409)
        self.assertIn("errors", response.json)

    def test_update_saved_search(self):
        self.before_each()
        update_id = db_session_users.query(UserSavedSearch).all()[1].id
        request_body = json.dumps({'name': 'agency', 'search_args': {"query": "agency", "agency": 466}})
        response = self.client.post("/saved_searches/"+str(update_id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("saved_search", response.json)
        self.assertIsInstance(response.json["saved_search"], dict)
        self.assertIsInstance(response.json["saved_search"]['search_args'], dict)
        self.assertEqual(response.json["saved_search"]['name'], "agency")
        self.assertEqual(response.json["saved_search"]['search_args'], {"query": "agency", "agency": 466})

    def test_update_saved_search_existing_name(self):
        self.before_each()
        update_id = db_session_users.query(UserSavedSearch).all()[1].id
        name = self.user_saved_searches[0].name
        request_body = json.dumps({'name': name})
        response = self.client.post("/saved_searches/"+str(update_id), headers={'Authorization': self.token}, data=request_body)
        self.assertStatus(response, 409)
        self.assertIn("errors", response.json)

    def test_delete_saved_search(self):
        self.before_each()
        delete_id = db_session_users.query(UserSavedSearch).all()[1].id
        response = self.client.delete("/saved_searches/"+str(delete_id), headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("deleted", response.json)
        self.assertTrue(response.json["deleted"])
