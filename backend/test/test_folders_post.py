import json
import test_app
from schemas.base_users import UserFolder, UserFolderDocument, UserSharedFolder
from test_app import db_session_users
from factories import *

class FolderPostTest(test_app.AppTest):
    def before_each(self):
        self.user_folder = [
            UserFolderFactory(user_id=self.user.id),
            UserFolderFactory(user_id=self.user.id),
        ]
        db_session_users.add_all(self.user_folder)
        db_session_users.commit()

    def test_update_folder_unique_name(self):
        self.before_each()
        user_folder = self.user_folder[0]
        request_body = json.dumps({'name': 'OCC_files'})
        response = self.client.post("/folders/" + str(user_folder.id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertEqual(response.json["id"], user_folder.id)
        self.assertEqual(response.json["name"], "OCC_files")

    def test_update_user_folder_existing_name(self):
        self.before_each()
        user_folder = self.user_folder[0]
        other_folder = self.user_folder[1]
        request_body = json.dumps({'name': other_folder.name})
        response = self.client.post("/folders/" + str(user_folder.id), headers={'Authorization': self.token}, data=request_body)
        self.assertStatus(response, 409)
        self.assertIn("errors", response.json)

    def test_create_user_folder_unique_name(self):
        self.before_each()
        request_body = json.dumps({'name': 'SEC_files'})
        response = self.client.post("/folders", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertEqual(response.json["name"], "SEC_files")

    def test_create_user_folder_existing_name(self):
        self.before_each()
        user_folder = self.user_folder[0]
        request_body = json.dumps({'name': user_folder.name})
        response = self.client.post("/folders", headers={'Authorization': self.token}, data=request_body)
        self.assertStatus(response, 409)
        self.assertIn("errors", response.json)

    def test_create_user_folder_no_name(self):
        self.before_each()
        request_body = json.dumps({})
        response = self.client.post("/folders", headers={'Authorization': self.token}, data=request_body)
        self.assert400(response)
        self.assertIn("errors", response.json)

    def test_create_user_folder_no_id(self):
        self.before_each()
        request_body = json.dumps({})
        response = self.client.post("/folders/0", headers={'Authorization': self.token}, data=request_body)
        self.assert404(response)
        self.assertIn("errors", response.json)

    def test_share_user_folder(self):
        self.before_each()
        user_folder = self.user_folder[0]
        request_body = json.dumps({ "share": True })
        # test err
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assertIn("errors", response.json)

        # test success
        request_body = json.dumps({ "share": True, "user_id": self.user.id })
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertIn("id", response.json)
        self.assertIn("user_id", response.json)
        self.assertIn("folder_id", response.json)
        self.assertTrue(response.json['owner'])

    def test_share_user_folder_multiple_users(self):
        self.before_each()
        # first lets create a shared folder
        shared_folder = UserSharedFolder({
            "user_id": self.user.id,
            "folder_id": self.user_folder[0].id,
            "owner": True,
            "editor": False,
            "viewer": False
        })

        db_session_users.add(shared_folder)
        db_session_users.commit()

        # now lets add users
        users = [
        {
         "id": 2,
         "editor": False,
         "viewer": True
        },
        {
         "id": 3,
         "editor": True,
         "viewer": False
        },
        {
         "id": 4,
         "editor": False,
         "viewer": True
        }]

        request_body = json.dumps({ "share_add_users": True, "users": users })
        # test err
        response = self.client.post("/folders/"+ str(self.user_folder[1].id), headers={'Authorization': self.token}, data=request_body)
        self.assertIn("errors", response.json)

        # test success
        request_body = json.dumps({ "share_add_users": True, "users": users })
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['folder_shared_with_users'])

    def test_update_share_permissions(self):
        self.before_each()
        # first lets create a shared folder
        shared_folder = UserSharedFolder({
            "user_id": self.user.id,
            "folder_id": self.user_folder[0].id,
            "owner": True,
            "editor": False,
            "viewer": False
        })
        db_session_users.add(shared_folder)
        db_session_users.commit()

        # now lets add users
        users = [
        {
         "id": 2,
         "editor": False,
         "viewer": True
        },
        {
         "id": 3,
         "editor": False,
         "viewer": True
        },
        {
         "id": 4,
         "editor": True,
         "viewer": False
        }]

        # share folder with users
        request_body = json.dumps({ "share_add_users": True, "users": users })
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['folder_shared_with_users'])

        # test err
        request_body = json.dumps({ "update_share_permissions": True, "users": users, "removed_users": [] })
        response = self.client.post("/folders/"+ str(self.user_folder[1].id), headers={'Authorization': self.token}, data=request_body)
        self.assertIn("errors", response.json)

        # test success
        request_body = json.dumps({ "update_share_permissions": True, "users": users, "removed_users": [] })
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['shared_folder_updated'])

        # test add users and update permissions
        users = [
        {
         "id": 2,
         "editor": True,
         "viewer": False
        },
        {
         "id": 3,
         "editor": True,
         "viewer": False
        },
        {
         "id": 4,
         "editor": False,
         "viewer": True
        },
        {
         "id": 5, # new user
         "editor": True,
         "viewer": False
        }]
        request_body = json.dumps({ "update_share_permissions": True, "users": users, "removed_users": [] })
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['shared_folder_updated'])

        # test explict removal of users
        removed_users = [4, 5]
        request_body = json.dumps({ "update_share_permissions": True, "users": [], "removed_users": removed_users })
        response = self.client.post("/folders/"+ str(self.user_folder[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['shared_folder_updated'])
        
