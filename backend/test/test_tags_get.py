import test_app
from schemas.base_users import UserTag, UserDocumentTag
from test_app import db_session_users
from factories import *

class TagsGetTest(test_app.AppTest):
    def before_each(self):
        # n.b. cleaning this out due to other test interference
        db_session_users.query(UserDocumentTag).delete()
        db_session_users.query(UserTag).delete()

        self.user_tags = [
            UserTagFactory(user_id=self.user.id),
            UserTagFactory(user_id=self.user.id),
        ]
        self.system_tags = [
            SystemTagFactory(),
            SystemTagFactory(),
            SystemTagFactory(active_suggestion=False)
        ]
        db_session_users.add_all(self.system_tags)
        db_session_users.add_all(self.user_tags)
        db_session_users.commit()

    def test_get_tags(self):
        self.before_each()
        response = self.client.get("/tags", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("user", response.json)
        self.assertIn("system", response.json)
        self.assertIsInstance(response.json["user"], list)
        self.assertIsInstance(response.json["system"], list)
        self.assertEqual(len(response.json["user"]), 2)
        self.assertEqual(len(response.json["system"]), 2)