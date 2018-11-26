import json
import test_app
from schemas.base_users import UserFolder, UserFolderDocument, UserSharedFolder
from test_app import db_session_users
from factories import UserFolderDocFactory, UserSharedFolderFactory

class FolderDeleteTest(test_app.AppTest):
    def before_each(self):  
        # n.b. cleaning this out due to other test interference
        db_session_users.query(UserSharedFolder).delete()
        db_session_users.query(UserFolderDocument).delete()
        db_session_users.query(UserFolder).delete()     
            
        # create a folder
        self.user_folder = UserFolder({
            "name": 'test_folder',
            'user_id': self.user.id,
        })
        db_session_users.add(self.user_folder)
        db_session_users.commit()
        db_session_users.refresh(self.user_folder)
    
    def test_delete_folders_with_no_documents(self):
        self.before_each()
        # delete the folder 
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id, name='test_folder').first()
        request_body = json.dumps({})
        
        response = self.client.delete("/folders/" + str(folder.id), headers={'Authorization': self.token}, data=request_body)
        
        self.assert200(response)
        self.assertIn('msg', response.json)
        
    def test_delete_folder_with_documents(self):
        self.before_each()
        # add docs to folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id, name='test_folder').first()
        user_folder_documents = [
            UserFolderDocFactory(user_folder_id=folder.id, doc_id=1),
            UserFolderDocFactory(user_folder_id=folder.id, doc_id=2),
        ]
        db_session_users.add_all(user_folder_documents)
        db_session_users.commit()
        # delete the folder 
        request_body = json.dumps({})
        response = self.client.delete("/folders/" + str(folder.id), headers={'Authorization': self.token}, data=request_body)
        
        self.assert200(response)
        self.assertIn('msg', response.json)
        
    def test_delete_shared_folder_with_documents(self):
        self.before_each()
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id, name='test_folder').first()
        # share folder
        user_shared_folder = UserSharedFolderFactory(user_id=self.user.id, folder_id=folder.id, owner=True)
        db_session_users.add(user_shared_folder)
        db_session_users.commit()
        
        # add docs to folder
        user_folder_documents = [
            UserFolderDocFactory(user_folder_id=folder.id, doc_id=1),
            UserFolderDocFactory(user_folder_id=folder.id, doc_id=2),
        ]
        db_session_users.add_all(user_folder_documents)
        db_session_users.commit()
        
        # delete the folder 
        request_body = json.dumps({})
        response = self.client.delete("/folders/" + str(folder.id), headers={'Authorization': self.token}, data=request_body)
        
        self.assert200(response)
        self.assertIn('msg', response.json)
        
    def test_delete_document_from_folder(self):
        self.before_each()
        # add docs to folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id, name='test_folder').first()
        user_folder_documents = [
            UserFolderDocument({
                "user_folder_id": folder.id,
                'doc_id': 1,
            }),
            UserFolderDocument({
                "user_folder_id": folder.id,
                'doc_id': 2,
            }),
        ]
        db_session_users.add_all(user_folder_documents)
        db_session_users.commit()
        # delete docs in the folder 
        request_body = json.dumps({'document_ids': [1, 2]})
        
        response = self.client.delete("/folders/" + str(folder.id), headers={'Authorization': self.token}, data=request_body)
        
        self.assert200(response)
        self.assertIn('msg', response.json)
        
    def test_delete_document_not_in_folder(self):
        self.before_each()
        # add document to folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id, name='test_folder').first()
        user_folder_documents = UserFolderDocument({
            "user_folder_id": folder.id,
            'doc_id': 1,
        })
        db_session_users.add(user_folder_documents)
        db_session_users.commit()

        # make sure document does not exsist
        user_folder_document = db_session_users.query(UserFolderDocument).filter_by(user_folder_id=folder.id, doc_id=1872).first()
        self.assertIsNone(user_folder_document)
        
        # delete another non-existent document from the folder 
        request_body = json.dumps({'document_ids': [1872, 2983, 1992]})
        
        response = self.client.delete("/folders/" + str(folder.id), headers={'Authorization': self.token}, data=request_body)
        
        self.assert404(response)
        self.assertIn('errors', response.json)
        
    def test_delete_no_id_folder(self):
        self.before_each()
        # delete a non exisitant folder 
        request_body = json.dumps({})
        response = self.client.delete("/folders/328", headers={'Authorization': self.token}, data=request_body)
        
        self.assert404(response)
        self.assertIn('errors', response.json)