import json
import test_app
from schemas.base_users import UserTag
from test_app import db_session_users
from factories import *

class TagsPostTest(test_app.AppTest):
    def before_each(self):
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

    def test_update_user_tag_unique_name(self):
        self.before_each()
        user_tag = self.user.user_tags[0]
        request_body = json.dumps({'name': 'wat'})
        response = self.client.post("/tags/" + str(user_tag.id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertEqual(response.json["id"], user_tag.id)
        self.assertEqual(response.json["name"], "wat")

    def test_update_user_tag_existing_name(self):
        self.before_each()
        user_tag = self.user.user_tags[0]
        other_tag = self.user.user_tags[1]
        request_body = json.dumps({'name': other_tag.name})
        response = self.client.post("/tags/" + str(user_tag.id), headers={'Authorization': self.token}, data=request_body)
        self.assert400(response)
        self.assertIn("errors", response.json)

    def test_update_user_tag_system_tag(self):
        self.before_each()
        system_tag = db_session_users.query(UserTag).filter_by(user_id=None).first()
        request_body = json.dumps({'name': "watman"})
        response = self.client.post("/tags/" + str(system_tag.id), headers={'Authorization': self.token}, data=request_body)
        self.assert404(response)
        self.assertIn("errors", response.json)

    def test_create_user_tag_unique_name(self):
        self.before_each()
        request_body = json.dumps({'name': 'watman'})
        response = self.client.post("/tags", headers={'Authorization': self.token},
                                    data=request_body)
        self.assert200(response)
        self.assertEqual(response.json["name"], "watman")

    def test_create_user_tag_existing_name(self):
        self.before_each()
        user_tag = self.user.user_tags[0]
        request_body = json.dumps({'name': user_tag.name})
        response = self.client.post("/tags", headers={'Authorization': self.token},
                                    data=request_body)
        self.assert400(response)
        self.assertIn("errors", response.json)

    def test_create_user_tag_existing_system_name(self):
        self.before_each()
        system_tag = db_session_users.query(UserTag).filter_by(user_id=None).first()
        request_body = json.dumps({'name': system_tag.name})
        response = self.client.post("/tags", headers={'Authorization': self.token},
                                    data=request_body)
        self.assert400(response)
        self.assertIn("errors", response.json)

    def test_create_user_tag_no_name(self):
        self.before_each()
        request_body = json.dumps({})
        response = self.client.post("/tags", headers={'Authorization': self.token},
                                    data=request_body)
        self.assert400(response)
        self.assertIn("errors", response.json)