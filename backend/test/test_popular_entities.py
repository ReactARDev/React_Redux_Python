import datetime as dt
import test_app
from schemas.base_users import UserAgency, UserDocument
from helpers.agency_helper import DefaultAgencies
from test_app import db_session_users

class PopularEntitiesTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(UserAgency).delete()
        db_session_users.query(UserDocument).delete()

        followed_agencies = []
        # add all agencies for 2 users
        for agency_id in DefaultAgencies:
            for user_id in [self.user.id, self.new_user.id]:
                followed_agencies.append(UserAgency({
                    'user_id': user_id,
                    'agency_id': agency_id,
                    'following': True
                }))

        # for one more user, add 4 agencies
        for agency_id in DefaultAgencies[2:6]:
            for user_id in [self.qa_user.id]:
                followed_agencies.append(UserAgency({
                    'user_id': user_id,
                    'agency_id': agency_id,
                    'following': True
                }))

        # and then for a 4th user, add 2 of the agencies
        for agency_id in DefaultAgencies[3:5]:
            for user_id in [self.admin_user.id]:
                followed_agencies.append(UserAgency({
                    'user_id': user_id,
                    'agency_id': agency_id,
                    'following': True
                }))

        read_docs = []
        # add 10 docs for 2 users
        for doc_id in range(1, 10):
            for user_id in [self.user.id, self.new_user.id]:
                read_docs.append(UserDocument({
                    'user_id': user_id,
                    'doc_id': doc_id,
                    'read': True
                }))

        # for one more user, add 4 docs
        for doc_id in range(3, 7):
            for user_id in [self.qa_user.id]:
                read_docs.append(UserDocument({
                    'user_id': user_id,
                    'doc_id': doc_id,
                    'read': True
                }))

        # and then for a 4th user, add 1 of the docs
        for user_id in [self.admin_user.id]:
            read_docs.append(UserDocument({
                'user_id': user_id,
                'doc_id': 4,
                'read': True
            }))

        # for another doc, make it read by all of the users (but make it updated more than 30 days ago so it is ignored)
        ninety_days_ago = dt.datetime.now() - dt.timedelta(days=90)
        for user_id in [self.user.id, self.new_user.id, self.qa_user.id, self.admin_user.id]:
            read_doc = UserDocument({
                'user_id': user_id,
                'doc_id': 22,
                'read': True
            })
            read_doc.updated_at = ninety_days_ago
            read_docs.append(read_doc)

        db_session_users.add_all(read_docs)
        db_session_users.add_all(followed_agencies)
        db_session_users.commit()

    def test_get_popular_sources(self):
        self.before_each()
        response = self.client.get("/popular_sources", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("popular_sources", response.json)
        self.assertIsInstance(response.json["popular_sources"], list)
        self.assertEqual(len(response.json["popular_sources"]), 5)

        # n.b. validate the counts look right for the contrived scenario
        result_lookup_map = {r['agency_id']: r['count'] for r in response.json["popular_sources"]}
        for agency_id in DefaultAgencies[3:5]:
            self.assertEqual(result_lookup_map[agency_id], 4)
        self.assertEqual(result_lookup_map[DefaultAgencies[2]], 3)
        self.assertEqual(result_lookup_map[DefaultAgencies[5]], 3)

        for d in response.json["popular_sources"]:
            self.assertIsInstance(d["agency_id"], int)
            self.assertIsInstance(d["count"], int)

    def test_get_popular_docs(self):
        self.before_each()
        response = self.client.get("/popular_docs", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("popular_docs", response.json)
        self.assertIsInstance(response.json["popular_docs"], list)
        self.assertEqual(len(response.json["popular_docs"]), 5)

        # n.b. validate the counts look right for the contrived scenario
        result_lookup_map = {r['doc_id']: r['count'] for r in response.json["popular_docs"]}
        self.assertEqual(result_lookup_map[4], 4)
        self.assertEqual(result_lookup_map[3], 3)
        self.assertEqual(result_lookup_map[5], 3)
        self.assertEqual(result_lookup_map[6], 3)

        for d in response.json["popular_docs"]:
            self.assertIsInstance(d["title"], unicode)
            self.assertIsInstance(d["doc_id"], int)
            self.assertIsInstance(d["count"], int)
