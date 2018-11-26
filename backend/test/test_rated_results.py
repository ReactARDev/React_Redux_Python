import json
import hashlib
import test_app
from schemas.base_users import SearchQuery, UserSearchResultRating, UserSearchQuery
from test_app import db_session_users

class RatedResultsTest(test_app.AppTest):
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

        self.search_queries[2].user_search_result_ratings.append(UserSearchResultRating({"user_id": self.user.id, "doc_id": 1, 'is_relevant': True}))

        db_session_users.add_all(self.search_queries)
        db_session_users.commit()

    def test_create_rating_new_search_query(self):
        self.before_each()
        search_args = {"agency_id": 80}
        request_body = json.dumps({'search_args': search_args, 'doc_id': 2, 'is_relevant': True})
        response = self.client.post("/rated_results", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertFalse(entry.is_arbitrary_query)
        self.assertEqual(entry.display_name, "Comptroller of the Currency")

        user_rated_result = db_session_users.query(UserSearchResultRating).filter_by(user_id=self.user.id, doc_id=2, search_query_id=entry.id).first()
        self.assertIsNotNone(user_rated_result)
        self.assertTrue(user_rated_result.is_relevant)

    def test_create_rating_new_doc(self):
        self.before_each()
        search_args = {"agency_id": 466}
        request_body = json.dumps({'search_args': search_args, 'doc_id': 2, 'is_relevant': True})
        response = self.client.post("/rated_results", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertFalse(entry.is_arbitrary_query)

        user_rated_result = db_session_users.query(UserSearchResultRating).filter_by(user_id=self.user.id, doc_id=2,
                                                                                     search_query_id=entry.id).first()
        self.assertIsNotNone(user_rated_result)
        self.assertTrue(user_rated_result.is_relevant)

    def test_create_rating_existing_rating(self):
        self.before_each()
        search_args = {"agency_id": 466}
        request_body = json.dumps({'search_args': search_args, 'doc_id': 1, 'is_relevant': False})
        response = self.client.post("/rated_results", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        lookup_hash = hashlib.sha1(json.dumps(search_args)).hexdigest()
        entry = db_session_users.query(SearchQuery).filter_by(search_args_hash=lookup_hash).first()
        self.assertIsNotNone(entry)
        self.assertFalse(entry.is_arbitrary_query)

        user_rated_result = db_session_users.query(UserSearchResultRating).filter_by(user_id=self.user.id, doc_id=1,
                                                                                     search_query_id=entry.id).first()
        self.assertIsNotNone(user_rated_result)
        self.assertFalse(user_rated_result.is_relevant)
