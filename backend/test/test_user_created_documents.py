import json
import test_app
from schemas.base_users import UserCreatedDocument
from test_app import db_session_users

class UserCreatedDocumentsTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(UserCreatedDocument).delete()
        self.created_docs = [
            UserCreatedDocument({
                'user_id': self.user.id,
                'notes': 'first doc',
                'doc_details': {
                    'title': 'foo',
                    'pdf_url': 'https://www.somehost.com/somepdf.pdf'
                }
            }),
            UserCreatedDocument({
                'user_id': self.user.id,
                'notes': 'yet another doc',
                'doc_details': {
                    'title': 'foo',
                    'pdf_url': 'https://www.somehost.com/someotherpdf.pdf'
                }
            })
        ]
        db_session_users.add_all(self.created_docs)
        db_session_users.commit()
        for u in self.created_docs:
            db_session_users.refresh(u)

    def test_get_user_created_documents(self):
        self.before_each()
        response = self.client.get("/user_created_documents", headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("user_created_documents", response.json)
        self.assertIsInstance(response.json["user_created_documents"], list)
        self.assertEqual(len(response.json["user_created_documents"]), 2)
        for i, doc in enumerate(self.created_docs):
            self.assertEqual(response.json["user_created_documents"][i]['status'], UserCreatedDocument.QUEUED_STATUS)
            self.assertEqual(response.json["user_created_documents"][i]['notes'], doc.notes)
            self.assertEqual(response.json["user_created_documents"][i]['user_id'], doc.user_id)
            for key in doc.doc_details.keys():
                self.assertEqual(response.json["user_created_documents"][i]['doc_details'][key], doc.doc_details[key])

    def test_post_user_created_documents(self):
        self.before_each()
        request_data = {
            'notes': 'some rando doc i found',
            'doc_details': {
                'title': 'watman',
                'pdf_url': 'https://www.somehost.com/rando-pdf.pdf'
            }
        }
        request_body = json.dumps(request_data)
        response = self.client.post("/user_created_documents", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("user_created_document", response.json)
        self.assertIsInstance(response.json["user_created_document"], dict)

        self.assertEqual(response.json["user_created_document"]["status"], UserCreatedDocument.QUEUED_STATUS)
        self.assertEqual(response.json["user_created_document"]["notes"], request_data['notes'])
        self.assertEqual(response.json["user_created_document"]["user_id"], self.admin_user.id)
        for key in request_data['doc_details'].keys():
            self.assertEqual(response.json["user_created_document"]['doc_details'][key], request_data['doc_details'][key])