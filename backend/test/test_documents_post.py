import json
import test_app
from test_app import db_session_users
from schemas.base_users import UserDocument, UserDocumentTag, UserFlaggedDocument, UserFolder, UserFolderDocument
from factories import UserTagFactory, SystemTagFactory, UserFolderFactory

class DocumentPostTest(test_app.AppTest):

    def test_mark_document_as_read(self):
        request_body = json.dumps({
            'document_ids': [3, 4],
            'read': True
        })
        response = self.client.post(
            "/documents",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertEquals(response.json['documents'], {'ids': [3, 4], 'read': True})

        user_document = db_session_users.query(UserDocument).filter_by(doc_id=3, user_id=self.user.id).first()
        self.assertIsNotNone(user_document)
        self.assertTrue(user_document.read)

        user_document_two = db_session_users.query(UserDocument).filter_by(doc_id=4, user_id=self.user.id).first()
        self.assertIsNotNone(user_document_two)
        self.assertTrue(user_document_two.read)

        # now check that it shows up in the get_document route
        response = self.client.get(
            "/documents/3",
            headers={'Authorization': self.token},
        )

        self.assert200(response)
        self.assertIn('document', response.json)
        for key in ['tags', 'bookmarked', 'read']:
            self.assertIn(key, response.json['document'])

        self.assertTrue(response.json['document']['read'])

    def test_mark_document_as_unread(self):
        # first lets mark this document/user pair as read, so the test can try marking it as unread
        user_documents = [
            UserDocument({'user_id': self.user.id, 'doc_id': 3, 'read': True}),
            UserDocument({'user_id': self.user.id, 'doc_id': 4, 'read': True}),
            UserDocument({'user_id': self.user.id, 'doc_id': 5, 'read': True}),
        ]
        db_session_users.add_all(user_documents)
        db_session_users.commit()

        request_body = json.dumps({
            'document_ids': [3,4,5],
            'read': False
        })

        response = self.client.post(
            "/documents",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertEquals(response.json['documents'], {'ids': [3,4,5], 'read': False})

        user_document = db_session_users.query(UserDocument).filter_by(doc_id=3, user_id=self.user.id).first()
        self.assertIsNotNone(user_document)
        self.assertFalse(user_document.read)

        user_document_two = db_session_users.query(UserDocument).filter_by(doc_id=4, user_id=self.user.id).first()
        self.assertIsNotNone(user_document_two)
        self.assertFalse(user_document_two.read)

        user_document_three = db_session_users.query(UserDocument).filter_by(doc_id=5, user_id=self.user.id).first()
        self.assertIsNotNone(user_document_three)
        self.assertFalse(user_document_three.read)

    def test_mark_document_as_bookmarked(self):
        request_body = json.dumps({
            'document_ids': [3, 4],
            'bookmarked': True
        })
        response = self.client.post(
            "/documents",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertEquals(response.json['documents'], {'ids': [3, 4], 'bookmarked': True})

        user_document = db_session_users.query(UserDocument).filter_by(doc_id=3, user_id=self.user.id).first()
        self.assertIsNotNone(user_document)
        self.assertTrue(user_document.bookmarked)

        user_document_two = db_session_users.query(UserDocument).filter_by(doc_id=4, user_id=self.user.id).first()
        self.assertIsNotNone(user_document_two)
        self.assertTrue(user_document_two.bookmarked)

        # now check that it shows up in the get_document route
        response = self.client.get(
            "/documents/{}".format(3),
            headers={'Authorization': self.token},
        )

        self.assert200(response)
        self.assertIn('document', response.json)
        for key in ['tags', 'bookmarked', 'read']:
            self.assertIn(key, response.json['document'])

        self.assertTrue(response.json['document']['bookmarked'])

    def test_mark_document_as_unbookmarked(self):
        # first lets mark this document/user pair as bookmarked, so the test can try marking it as unbookmarked
        user_documents = [
            UserDocument({'user_id': self.user.id, 'doc_id': 3, 'bookmarked': True}),
            UserDocument({'user_id': self.user.id, 'doc_id': 4, 'bookmarked': True}),
            UserDocument({'user_id': self.user.id, 'doc_id': 5, 'bookmarked': True}),
        ]
        db_session_users.add_all(user_documents)
        db_session_users.commit()

        request_body = json.dumps({
            'document_ids': [3,4,5],
            'bookmarked': False
        })

        response = self.client.post(
            "/documents",
            headers={'Authorization': self.token},
            data=request_body
        )
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertEquals(response.json['documents'], {'ids': [3,4,5], 'bookmarked': False})

        user_document = db_session_users.query(UserDocument).filter_by(doc_id=3, user_id=self.user.id).first()
        self.assertIsNotNone(user_document)
        self.assertFalse(user_document.bookmarked)

        user_document_two = db_session_users.query(UserDocument).filter_by(doc_id=4, user_id=self.user.id).first()
        self.assertIsNotNone(user_document_two)
        self.assertFalse(user_document_two.bookmarked)

        user_document_three = db_session_users.query(UserDocument).filter_by(doc_id=5, user_id=self.user.id).first()
        self.assertIsNotNone(user_document_three)
        self.assertFalse(user_document_three.bookmarked)

    def before_each_tags(self):
        self.user_tags = [
            UserTagFactory(user_id=self.user.id),
            UserTagFactory(user_id=self.user.id)
        ]
        self.system_tags = [
            SystemTagFactory(),
            SystemTagFactory()
        ]
        db_session_users.add_all(self.system_tags)
        db_session_users.add_all(self.user_tags)
        db_session_users.commit()

    def test_add_positive_tag_to_document(self):
        self.before_each_tags()
        doc_id = 3
        request_data = {'tag': {'id': self.user_tags[0].id, 'is_positive': True, 'display_style': 'modal'}}
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.token},
            data=json.dumps(request_data)
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        for key in ['doc_id', 'user_id', 'user_tag_id', 'is_positive', 'display_style']:
            self.assertIn(key, response.json['document'])

        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['user_tag_id'], self.user_tags[0].id)
        self.assertEquals(response.json['document']['user_id'], self.user.id)
        self.assertTrue(response.json['document']['is_positive'])
        self.assertEquals(response.json['document']['display_style'], 'modal')

    def test_add_negative_tag_to_document(self):
        self.before_each_tags()
        doc_id = 3
        request_data = {'tag': {'id': self.user_tags[0].id, 'is_positive': False, 'display_style': 'modal'}}
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.token},
            data=json.dumps(request_data)
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        for key in ['doc_id', 'user_id', 'user_tag_id', 'is_positive', 'display_style']:
            self.assertIn(key, response.json['document'])

        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['user_tag_id'], self.user_tags[0].id)
        self.assertEquals(response.json['document']['user_id'], self.user.id)
        self.assertFalse(response.json['document']['is_positive'])
        self.assertEquals(response.json['document']['display_style'], 'modal')

        # now check that it shows up in the get_document route
        response = self.client.get(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.token},
        )

        self.assert200(response)
        self.assertIn('document', response.json)
        for key in ['tags', 'bookmarked', 'read']:
            self.assertIn(key, response.json['document'])

        tag_ids = [ t[0] for t in response.json['document']['tags'] ]

        self.assertNotIn(self.user_tags[0].id, tag_ids)

    # test that it gets marked as negative
    def test_remove_positive_tag_from_document(self):
        doc_id = 3
        self.before_each_tags()
        user_doc_tag = UserDocumentTag({
            'user_tag_id': self.user_tags[0].id,
            'is_positive': True,
            'display_style': 'modal',
            'doc_id': doc_id,
            'user_id': self.user.id
        })
        db_session_users.add(user_doc_tag)
        db_session_users.commit()

        request_data = {'tag': {'id': self.user_tags[0].id, 'is_positive': False, 'display_style': 'modal'}}
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.token},
            data=json.dumps(request_data)
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        for key in ['doc_id', 'user_id', 'user_tag_id', 'is_positive', 'display_style']:
            self.assertIn(key, response.json['document'])

        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['user_tag_id'], self.user_tags[0].id)
        self.assertEquals(response.json['document']['user_id'], self.user.id)
        self.assertFalse(response.json['document']['is_positive'])
        self.assertEquals(response.json['document']['display_style'], 'modal')

        # make sure it is updated (not new) in the db too
        db_session_users.refresh(user_doc_tag)
        self.assertFalse(user_doc_tag.is_positive)

        # now check that it does not show up in the get_document route
        response = self.client.get(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.token},
        )

        self.assert200(response)

        tag_ids = [ t[0] for t in response.json['document']['tags'] ]
        self.assertNotIn(self.user_tags[0].id, tag_ids)

    def test_flag_document_as_bad(self):
        doc_id = 3
        flagged_data = json.dumps({
            'flagged': {
                'issue_severity': 'hide_now',
                'issue_type': 'technical',
                'field': 'title',
                'notes': 'typo in title',
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['issue_severity'], 'hide_now')
        self.assertEquals(response.json['document']['issue_type'], 'technical')

    def test_flag_document_as_good(self):
        doc_id = 3
        flagged_data = json.dumps({
            'flagged': {
                'issue_severity': 'show_now',
                'issue_type': 'show again',
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['issue_severity'], 'show_now')
        self.assertEquals(response.json['document']['issue_type'], 'show again')

    def test_flag_document_for_review(self):
        doc_id = 3
        flagged_data = json.dumps({
            'flagged': {
                'issue_severity': 'review',
                'issue_type': 'technical',
                'field': 'title',
                'notes': 'typo in title',
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['issue_severity'], 'review')
        self.assertEquals(response.json['document']['issue_type'], 'technical')

    def test_flag_document_as_bad_no_issue_type(self):
        doc_id = 3
        flagged_data = json.dumps({
            'flagged': {
                'issue_severity': 'hide_now',
                'field': 'title',
                'notes': 'typo in title',
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert400(response)
        self.assertIn('errors', response.json)

    def test_flag_document_as_bad_bad_issue_severity(self):
        doc_id = 3
        flagged_data = json.dumps({
            'flagged': {
                'issue_severity': 'foobar',
                'issue_type': 'technical',
                'field': 'title',
                'notes': 'typo in title',
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert400(response)
        self.assertIn('errors', response.json)

    def test_flag_document_as_bad_no_issue_severity(self):
        doc_id = 3
        flagged_data = json.dumps({
            'flagged': {
                'issue_type': 'technical',
                'field': 'title',
                'notes': 'typo in title',
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['issue_severity'], 'review')
        self.assertEquals(response.json['document']['issue_type'], 'technical')

    def test_skip_flagged_document(self):
        doc_id = 3

        # first write a doc for review
        ufd = UserFlaggedDocument({
            'issue_severity': 'review',
            'issue_type': 'technical',
            'field': 'title',
            'notes': 'typo in title',
            'user_id': self.user.id,
            'doc_id': doc_id
        })
        db_session_users.add(ufd)
        db_session_users.commit()
        db_session_users.refresh(ufd)

        # then post a status update to skipped
        flagged_data = json.dumps({
            'flagged': {
                'id': ufd.id,
                'status': 'skipped'
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert200(response)
        self.assertIn('document', response.json)
        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['issue_severity'], 'review')
        self.assertEquals(response.json['document']['issue_type'], 'technical')
        self.assertEquals(response.json['document']['status'], 'skipped')
        db_session_users.refresh(ufd)
        self.assertEquals(ufd.status, 'skipped')

    def test_update_user_folder_with_new_documents(self):
        # create a folder
        user_folder = UserFolderFactory(user_id=self.user.id)
        db_session_users.add(user_folder)
        db_session_users.commit()
        db_session_users.refresh(user_folder)
        # add single doc to folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id).first()

        request_body = json.dumps({
            'document_ids': [1,2,3],
            'folder_id': folder.id,
        })

        response = self.client.post("/documents", headers={'Authorization': self.token}, data=request_body)

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertEquals(response.json['documents'], {'ids': [1,2,3], 'documents_added_to_folder': True})

    def test_update_user_folder_with_existing_documents(self):
        # create a folder
        user_folder = UserFolderFactory(user_id=self.user.id)
        db_session_users.add(user_folder)
        db_session_users.commit()
        db_session_users.refresh(user_folder)
        # add a document to the folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id).first()
        user_folder_documents = [
            UserFolderDocument({
                "user_folder_id": folder.id,
                'doc_id': 1,
            }),
            UserFolderDocument({
                "user_folder_id": folder.id,
                'doc_id': 2,
            }),
            UserFolderDocument({
                "user_folder_id": folder.id,
                'doc_id': 3,
            }),
        ]

        db_session_users.add_all(user_folder_documents)
        db_session_users.commit()
        # add the doc that already exists in the folder
        request_body = json.dumps({
            'document_ids': [1,2,3],
            'folder_id': folder.id,
        })
        response = self.client.post("/documents", headers={'Authorization': self.token}, data=request_body)

        self.assertStatus(response, 409)
        self.assertIn('errors', response.json)

    def test_user_document_update_no_flag(self):
        topics_to_add = [{'name': 'nada', 'id':1}]
        topics_to_remove = [{'name': 'foo', 'id': 2}]
        doc_id = 3
        flagged_data = json.dumps({
            'update': {
                'publication_date': '2017-11-08',
                'notes': 'tra la la',
                'topics_to_add': topics_to_add,
                'topics_to_remove': topics_to_remove
            }
        })
        response = self.client.post(
            "/documents/{}".format(doc_id),
            headers={'Authorization': self.qa_user_token},
            data=flagged_data
        )
        self.assert200(response)
        self.assertIn('document', response.json)

        self.assertEquals(response.json['document']['id'], doc_id)
        self.assertEquals(response.json['document']['status'], 'queued')
        self.assertEquals(response.json['document']['user_id'], self.qa_user.id)
        self.assertEquals(response.json['document']['notes'], 'tra la la')
        self.assertIn('changes', response.json['document'])
        self.assertEquals(response.json['document']['changes']['publication_date'], '2017-11-08')
        self.assertEquals(len(response.json['document']['changes']['topics_to_add']), len(topics_to_add))
        self.assertEquals(len(response.json['document']['changes']['topics_to_remove']), len(topics_to_remove))
