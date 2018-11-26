import json
import test_app
from schemas.base_users import UserFolder, UserSharedFolder
from test_app import db_session_users
from factories import *
from settings import SECRET_JWT
import jwt
import datetime as dt

class FolderGetTest(test_app.AppTest):
    def before_each(self):
        self.users =[
            UserFactory(first_name='foo', last_name='bar'),
            UserFactory(first_name='foo2', last_name='bar2')
        ]
        db_session_users.add_all(self.users)
        db_session_users.commit()
        db_session_users.flush()
        for user in self.users:
            db_session_users.refresh(user)
        
        # create a special token to use for authorization for the specific user whom we share a folder 
        seconds_until_expiration = 60 * 60 * 24 * 14
        expiration_datetime = dt.datetime.utcnow() + dt.timedelta(seconds=seconds_until_expiration)
        self.folder_user_token = jwt.encode({'user_id': self.users[0].id, 'exp': expiration_datetime}, SECRET_JWT)
        
        self.user_folders = [
            UserFolderFactory(user_id=self.user.id),
            UserFolderFactory(user_id=self.user.id),
            UserFolderFactory(user_id=self.user.id),
            UserFolderFactory(user_id=self.user.id),
        ]
        db_session_users.add_all(self.user_folders)
        db_session_users.commit()
        
        self.user_shared_folders = [
            UserSharedFolderFactory(user_id=self.user.id, folder_id=self.user_folders[0].id, owner=True),
            UserSharedFolderFactory(user_id=self.user.id, folder_id=self.user_folders[1].id, owner=True),
            UserSharedFolderFactory(user_id=self.users[0].id, folder_id=self.user_folders[0].id, viewer=True),
            UserSharedFolderFactory(user_id=self.users[1].id, folder_id=self.user_folders[1].id, editor=True),
        ]
        db_session_users.add_all(self.user_shared_folders)
        db_session_users.commit()

    def test_get_folders(self):
        self.before_each()
        response = self.client.get("/folders", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("personal_folders", response.json)
        self.assertIn("shared_folders", response.json)
        self.assertIsInstance(response.json["personal_folders"], list)
        self.assertIsInstance(response.json["shared_folders"], list)
        self.assertEqual(len(response.json["personal_folders"]), 2)
        self.assertEqual(len(response.json["shared_folders"]), 2)
        self.assertIsInstance(response.json["personal_folders"][0]['updated_at'], basestring)
        self.assertIsInstance(response.json["shared_folders"][0]['updated_at'], basestring)
        self.assertIn('shared_folder_users', response.json["shared_folders"][0])
        self.assertIn('user_permission_access', response.json["shared_folders"][0]['shared_folder_users'][0])
        
    def test_get_folders_with_no_personal_folders(self):
        self.before_each()
        response = self.client.get("/folders", headers={'Authorization': self.folder_user_token})
        self.assert200(response)
        self.assertIn("personal_folders", response.json)
        self.assertIn("shared_folders", response.json)
        self.assertIsInstance(response.json["personal_folders"], list)
        self.assertIsInstance(response.json["shared_folders"], list)
        self.assertEqual(len(response.json["personal_folders"]), 0)
        self.assertEqual(len(response.json["shared_folders"]), 1)
        self.assertIsInstance(response.json["shared_folders"][0]['updated_at'], basestring)
        self.assertIn('shared_folder_users', response.json["shared_folders"][0])
        self.assertIn('user_permission_access', response.json["shared_folders"][0]['shared_folder_users'][0])