import datetime as dt
import json
import hashlib
from random import randint
import test_app
from schemas.base_users import UserSearchQuery, SearchQuery, UserSearchResultRating
from test_app import db_session_users

class SearchQueriesTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(UserSearchQuery).delete()
        db_session_users.query(UserSearchResultRating).delete()
        db_session_users.query(SearchQuery).delete()
        self.search_queries = [
            # n.b. add this and check that it doesn't appear
            SearchQuery({
                'is_arbitrary_query': True,
                'search_args': {"query": "test"},
            }),
            SearchQuery({
                'is_arbitrary_query': None,
                'display_name': 'foo',
                'search_args': {"citation_id": 123},
            }),
            SearchQuery({
                'is_arbitrary_query': None,
                'display_name': 'bar',
                'search_args': {"agency_id": 466},
            }),
            SearchQuery({
                'is_arbitrary_query': False,
                'display_name': 'wat',
                'search_args': {"agency_id": 268},
            }),
            SearchQuery({
                'is_arbitrary_query': False,
                'display_name': 'doge',
                'search_args': {"regulation_id": 25},
            }),
            SearchQuery({
                'is_arbitrary_query': False,
                'display_name': 'smoll',
                'search_args': {"citation_id": 345},
            }),
            SearchQuery({
                'is_arbitrary_query': False,
                'display_name': 'nope',
                'search_args': {"regulation_id": 26},
            }),
        ]
        # numbers of searches to be associated with each entry
        self.search_counts = [100, 25, 22, 17, 16, 15, 5]

        for i, s in enumerate(self.search_queries):
            for _ in range(self.search_counts[i]):
                s.user_search_queries.append(UserSearchQuery({"user_id": self.user.id}))

        # add a random number of queries for the internal user, which will get ignored - but validates that
        # the check to ignore internal users is in place
        for s in self.search_queries:
            for _ in range(randint(1, 10)):
                s.user_search_queries.append(UserSearchQuery({"user_id": self.internal_user.id}))

        # add a lot of queries from > 30 days ago to the last query (that has only 5 entries)
        ninety_days_ago = dt.datetime.now() - dt.timedelta(days=90)
        for _ in range(100):
            usr = UserSearchQuery({"user_id": self.user.id})
            usr.updated_at = ninety_days_ago
            self.search_queries[6].user_search_queries.append(usr)

        db_session_users.add_all(self.search_queries)
        db_session_users.commit()

    def test_get_search_queries(self):
        self.before_each()
        response = self.client.get("/search_queries", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("search_queries", response.json)
        self.assertIsInstance(response.json["search_queries"], list)
        self.assertEqual(len(response.json["search_queries"]), 5)
        for i, query in enumerate(response.json["search_queries"]):
            self.assertEqual(query["search_args"], self.search_queries[i+1].search_args)
            self.assertEqual(query["display_name"], self.search_queries[i+1].display_name)
            self.assertEqual(query["search_count"], self.search_counts[i+1])

    def test_get_search_queries_num_queries(self):
        self.before_each()
        response = self.client.get("/search_queries?num_queries=3", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("search_queries", response.json)
        self.assertIsInstance(response.json["search_queries"], list)
        self.assertEqual(len(response.json["search_queries"]), 3)
        for i, query in enumerate(response.json["search_queries"]):
            self.assertEqual(query["search_args"], self.search_queries[i+1].search_args)
            self.assertEqual(query["display_name"], self.search_queries[i+1].display_name)
            self.assertEqual(query["search_count"], self.search_counts[i+1])

    def test_create_search_query_unique(self):
        self.before_each()
        search_args = {"agency_id": 80}
        request_body = json.dumps({'search_args': search_args})
        response = self.client.post("/search_queries", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertFalse(entry.is_arbitrary_query)

        self.assertEqual(entry.get_search_count(), 1)
        self.assertEqual(entry.display_name, "Comptroller of the Currency")
        # TODO add tests for the other "new" search query use-cases to make sure it gets the display name

    def test_create_search_query_unique_arbitrary(self):
        self.before_each()
        search_args = {"query": "foobar"}
        request_body = json.dumps({'search_args': search_args})
        response = self.client.post("/search_queries", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.get_search_count(), 1)
        self.assertIsNone(entry.display_name)
        self.assertTrue(entry.is_arbitrary_query)
        # TODO add tests for the other "new" search query use-cases to make sure it gets the display name

    def test_create_search_query_existing(self):
        self.before_each()
        search_args = {"agency_id": 268}
        request_body = json.dumps({'search_args': search_args})
        response = self.client.post("/search_queries", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.get_search_count(), 18)

        response = self.client.post("/search_queries", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.get_search_count(), 19)

        # also test that string values get converted to ints
        search_args_str = {"agency_id": '268'}
        request_body_str = json.dumps({'search_args': search_args_str})
        response = self.client.post("/search_queries", headers={'Authorization': self.token}, data=request_body_str)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.get_search_count(), 20)

        # and make sure a new entry was not created
        lookup_hash_str = hashlib.sha1(json.dumps(search_args_str)).hexdigest()
        entry_str = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash_str).first()
        self.assertIsNone(entry_str)