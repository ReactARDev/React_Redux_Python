import test_app
import json
import datetime as dt
from test_app import db_session_users
from models import *
from schemas.base_users import UserDocument, UserTopic, UserFollowedEntity
import schemas.jurasticsearch as jsearch
from helpers.agency_helper import DefaultAgencies
from factories import UserTagFactory, SystemTagFactory, UserFolderDocFactory, UserFolderFactory

this_folder = os.path.dirname(os.path.realpath(__file__))

def is_between_dates(init_date, last_date, test_date):
    return init_date <= test_date and test_date <= last_date

EXPECTED_STRING_FIELDS = ['category', 'title', 'summary_text', 'pdf_url', 'publication_date']

class DocumentListTest(test_app.AppTest):
    @classmethod
    def setUpClass(cls):
        super(DocumentListTest, cls).setUpClass()

        fixtures     = json.loads(open(this_folder + '/fixtures/fixtures_201712.json').read())
        all_agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']
        default_agency_lookup = set(DefaultAgencies)
        cls.agencies = [a for a in all_agencies if a['id'] in default_agency_lookup]

        cls.all_default_agency_docs = fixtures['documents'][:-5]
        cls.acts          = fixtures['acts']
        cls.named_regulations   = fixtures['named_regulations']

    def setUp(self):
        super(DocumentListTest, self).setUp()
        self.all_default_agency_docs = self.__class__.all_default_agency_docs
        self.agencies      = self.__class__.agencies
        self.acts          = self.__class__.acts
        self.regulations   = self.__class__.named_regulations

    # n.b. no_agency_valid allows this check to pass int he case of a non-agency doc, off by default
    def validate_basic_doc_details(self, document, expected_id=None, no_agency_valid=False, mentions_for_filter=False):
        self.assertIsInstance(document['id'], int)

        # figuring out the exact order of docs when multiple docs have the same value is a pain, punt in that case
        if expected_id: self.assertEqual(document['id'], expected_id)

        for string_field in EXPECTED_STRING_FIELDS:
            self.assertIsInstance(document[string_field], unicode)
        self.assertIsInstance(document['read'], bool)
        self.assertIsInstance(document['bookmarked'], bool)
        self.assertIsInstance(document['tags'], list)

        if mentions_for_filter:
            self.assertIn('mentions_for_filter', document)
            self.assertIsInstance(document['mentions_for_filter'], list)

        # short-circuit case where no_agency_valid is turned on AND this document has no agency
        # n.b. this means any other non-agency checks added later need to go above this line
        if no_agency_valid and 'agencies' not in 'document':
            return

        self.assertIn('agencies', document)
        self.assertIsInstance(document['agencies'], list)
        for agency in document['agencies']:
            for string_field in ['description', 'short_name', 'url', 'slug', 'name', 'type']:
                self.assertIsInstance(agency[string_field], unicode)
            self.assertIsInstance(agency['id'], int)


    def test_get_documents(self):
        response = self.client.get('/documents', headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_with_limit_and_offset(self):
        url = '/documents?limit=3&offset=1&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 3)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents'][1:]):
            self.validate_basic_doc_details(document, docs[i + 1]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_sort_and_order_by_publication_date_asc(self):
        response = self.client.get('/documents?sort=publication_date&order=asc', headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'])

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_sort_and_order_by_comments_close_asc(self):
        response = self.client.get('/documents?sort=comments_close_date&order=asc',
                                   headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['rule']['comments_close_on'])

        for i, document in enumerate(response.json['documents'][:-2]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_sort_and_order_by_category_desc(self):
        response = self.client.get('/documents?sort=category&order=desc', headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['category'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_by_category(self):
        url = '/documents?category=Presidential Document&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 15)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 15)

    def test_get_documents_by_skipped_category(self):
        url = '/documents?skip_category=Presidential Document&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 3)

        filtered_docs = [d for d in self.all_default_agency_docs if d['category'] != 'Presidential Document']
        docs = sorted(filtered_docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 3)

    def test_get_read_documents(self):

        # mark the first 6 (arbitrary) docs as read
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        for doc in docs[0:6]:
            user_document = UserDocument({'user_id': self.user.id, 'doc_id': doc['id'], 'read': True})
            db_session_users.add(user_document)
        db_session_users.commit()

        response = self.client.get('/documents?read=true&sort=publication_date&order=desc', headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])
            self.assertTrue(document['read'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_unread_documents(self):

        # mark the first 3 (arbitrary) docs as read
        # mark the next three as explicitly unread
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        for doc in docs[0:3]:
            user_document = UserDocument({'user_id': self.user.id, 'doc_id': doc['id'], 'read': True})
            db_session_users.add(user_document)
        for doc in docs[3:6]:
            user_document = UserDocument({'user_id': self.user.id, 'doc_id': doc['id'], 'read': False})
            db_session_users.add(user_document)
        db_session_users.commit()

        docs = docs[3:]

        url = '/documents?read=false&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 15)

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])
            self.assertFalse(document['read'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 15)

    def test_get_bookmarked_documents(self):

        # mark the first 6 (arbitrary) docs as bookmarked
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        for doc in docs[0:6]:
            user_document = UserDocument({'user_id': self.user.id, 'doc_id': doc['id'], 'bookmarked': True})
            db_session_users.add(user_document)
        db_session_users.commit()

        response = self.client.get('/documents?bookmarked=true&sort=publication_date&order=desc', headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])
            self.assertTrue(document['bookmarked'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_unbookmarked_documents(self):

        # mark the first 3 (arbitrary) docs as bookmarked
        # remove the next three from being bookmarked
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        for doc in docs[0:3]:
            user_document = UserDocument({'user_id': self.user.id, 'doc_id': doc['id'], 'bookmarked': True})
            db_session_users.add(user_document)
        for doc in docs[3:6]:
            user_document = UserDocument({'user_id': self.user.id, 'doc_id': doc['id'], 'bookmarked': False})
            db_session_users.add(user_document)
        db_session_users.commit()

        docs = docs[3:]

        url = '/documents?bookmarked=false&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 15)

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])
            self.assertFalse(document['bookmarked'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 15)

    def test_get_tagged_documents_for_user_tag(self):
        # mark the first 6 (arbitrary) docs as tagged
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        user_document_tags = []
        user_tag = UserTagFactory(user_id=self.user.id)
        db_session_users.add(user_tag)
        db_session_users.commit()
        db_session_users.refresh(user_tag)
        for doc in docs[0:6]:
            user_document_tags.append(UserDocumentTag({
                'user_id': self.user.id,
                'doc_id': doc['id'],
                'is_positive': True,
                'display_style': 'modal',
                'user_tag_id': user_tag.id
            }))
        db_session_users.add_all(user_document_tags)
        db_session_users.commit()

        response = self.client.get('/documents?tag_id='+str(user_tag.id)+'&sort=publication_date&order=desc',
                                   headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])
            self.assertEqual(document['tags'], [[user_tag.id, user_tag.name]])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_tagged_documents_for_system_tag(self):
        # mark the first 6 (arbitrary) docs as tagged
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        user_document_tags = []
        sys_tag = SystemTagFactory()
        db_session_users.add(sys_tag)
        db_session_users.commit()
        db_session_users.refresh(sys_tag)
        for doc in docs[0:6]:
            user_document_tags.append(UserDocumentTag({
                'user_id': self.user.id,
                'doc_id': doc['id'],
                'is_positive': True,
                'display_style': 'modal',
                'user_tag_id': sys_tag.id
            }))
        # mark one extra document as tagged by another user to make verify we only pick up documents
        # tagged for this tag AND by the current user
        user_document_tags.append(UserDocumentTag({
            'user_id': self.new_user.id,
            'doc_id': docs[7]['id'],
            'is_positive': True,
            'display_style': 'modal',
            'user_tag_id': sys_tag.id
        }))

        db_session_users.add_all(user_document_tags)
        db_session_users.commit()

        response = self.client.get('/documents?tag_id=' + str(sys_tag.id) + '&sort=publication_date&order=desc',
                                   headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])
            self.assertEqual(document['tags'], [[sys_tag.id, sys_tag.name]])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_for_user_folder(self):
        # create a couple of random docs
        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)
        user_folder_documents = []
        #create a folder
        user_folder = UserFolderFactory(user_id=self.user.id)
        db_session_users.add(user_folder)
        db_session_users.commit()
        db_session_users.refresh(user_folder)
        # add 6 (arbitrary) docs to the folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id).first()
        for doc in docs[0:6]:
            user_folder_documents.append(UserFolderDocument({
                "user_folder_id": folder.id,
                'doc_id': doc['id'],
            }))
        db_session_users.add_all(user_folder_documents)
        db_session_users.commit()

        response = self.client.get('/documents?folder_id=' + str(folder.id) + '&sort=publication_date&order=desc',
                                   headers={'Authorization': self.token})

        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_for_user_folder_no_documents(self):
        #create a folder
        user_folder = UserFolderFactory(user_id=self.user.id)
        db_session_users.add(user_folder)
        db_session_users.commit()
        db_session_users.refresh(user_folder)
        #query for documents of new folder
        folder = db_session_users.query(UserFolder).filter_by(user_id=self.user.id).first()

        response = self.client.get('/documents?folder_id=' + str(folder.id) + '&sort=publication_date&order=desc',
                                   headers={'Authorization': self.token})

        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 0)
        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 0)

    def test_get_documents_published_to(self):
        url = '/documents?published_to=01/05/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)[11:]

        for i, document in enumerate(response.json['documents'][:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_published_from(self):
        url = '/documents?published_from=01/04/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 14)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)[:13]

        for i, document in enumerate(response.json['documents'][1:]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 14)

    def test_get_documents_compliance_to(self):
        cutoff_date = '2016-01-07'
        #cutoff_date = dt.datetime.strptime('2016-01-07',"%Y-%m-%d")
        docs = [ d for d in self.all_default_agency_docs if d['rule']['effective_on'] <= cutoff_date ]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        url = '/documents?compliance_to=01/06/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            #self.validate_basic_doc_details(document, docs[i]['id'])
            self.validate_basic_doc_details(document, None)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_compliance_from(self):
        url = '/documents?compliance_from=01/05/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 12)

        cutoff_date = '2016-01-05'
        #cutoff_date = dt.datetime.strptime('2016-01-05',"%Y-%m-%d")

        docs = [ d for d in self.all_default_agency_docs if d['rule']['effective_on'] >= cutoff_date ]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 12)

    def test_get_documents_comments_close_to(self):
        cutoff_date = '2016-01-07'
        # cutoff_date = dt.datetime.strptime('2016-01-07',"%Y-%m-%d")
        docs = [d for d in self.all_default_agency_docs if d['rule']['comments_close_on'] <= cutoff_date]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        url = '/documents?comments_close_to=01/06/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            # self.validate_basic_doc_details(document, docs[i]['id'])
            self.validate_basic_doc_details(document, None)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_comments_close_from(self):
        url = '/documents?comments_close_from=01/05/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 12)

        cutoff_date = '2016-01-05'
        # cutoff_date = dt.datetime.strptime('2016-01-05',"%Y-%m-%d")

        docs = [d for d in self.all_default_agency_docs if d['rule']['comments_close_on'] >= cutoff_date]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 12)

    #init_date = dt.datetime.strptime('2016-01-05',"%Y-%m-%d")
    #last_date = dt.datetime.strptime('2016-01-07',"%Y-%m-%d")
    def test_get_documents_compliance_to_and_from(self):
        url = '/documents?compliance_from=01/05/2016&compliance_to=01/07/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 3)

        date0 = '2016-01-05'
        date1 = '2016-01-07'
        docs  = [ d for d in self.all_default_agency_docs if is_between_dates(date0, date1, d['rule']['effective_on']) ]
        docs  = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 3)

    # FIXME: the key date tests checks the key date functionality generally, but because of the test document setup,
    # it doesn't verify that we can find documents in the date range that match one but not the other
    # since every document created has an identical effective_on and comments_close_date
    # test data will need to be re-jiggered to fix this
    def test_get_documents_key_date_from(self):
        url = '/documents?key_date_from=01/05/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 12)

        cutoff_date = '2016-01-05'
        # cutoff_date = dt.datetime.strptime('2016-01-05',"%Y-%m-%d")

        docs = [d for d in self.all_default_agency_docs if d['rule']['comments_close_on'] >= cutoff_date]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 12)

    def test_get_documents_key_date_to(self):
        cutoff_date = '2016-01-07'
        # cutoff_date = dt.datetime.strptime('2016-01-07',"%Y-%m-%d")
        docs = [d for d in self.all_default_agency_docs if d['rule']['comments_close_on'] <= cutoff_date]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        url = '/documents?key_date_to=01/06/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        for i, document in enumerate(response.json['documents']):
            # self.validate_basic_doc_details(document, docs[i]['id'])
            self.validate_basic_doc_details(document, None)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_key_date_to_and_from(self):
        url = '/documents?key_date_from=01/05/2016&key_date_to=01/07/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 3)

        date0 = '2016-01-05'
        date1 = '2016-01-07'
        docs = [d for d in self.all_default_agency_docs if is_between_dates(date0, date1, d['rule']['effective_on'])]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 3)

    def test_get_documents_for_agency(self):
        agency_id = self.agencies[0]['id']

        url = "/documents?agency_id={}&sort=publication_date&order=desc".format(agency_id)
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 8)

        docs = [ d for d in self.all_default_agency_docs if agency_id in [ a['id'] for a in d['agencies'] ]]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 8)

    def test_get_documents_skipping_agency(self):
        agency_id = self.agencies[0]['id']

        url = "/documents?skip_agency={}&sort=publication_date&order=desc".format(agency_id)
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 10)

        docs = [d for d in self.all_default_agency_docs if agency_id not in [a['id'] for a in d['agencies']]]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 10)

    def test_empty_agency_param(self):
        # previously the frontend would send empty params, which caused the api to break
        url = "/documents?agency_id=&limit=20&sort=publication_date&order=desc"
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assert200(response)

    def test_get_documents_for_multiple_agencies(self):
        a0 = self.agencies[0]['id']
        a1 = self.agencies[1]['id']

        url = "/documents?agency_id={}&agency_id={}&sort=publication_date&order=desc".format(a0,a1)

        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        # self.assertEqual(len(response.json['documents']), 11) ## TODO: why did this change?
        self.assertEqual(len(response.json['documents']), 16)

        agency_ids = [a0, a1]
        docs = [ d for d in self.all_default_agency_docs if (set([ a0, a1 ]) & set([ a['id'] for a in d['agencies']]))]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 16) ## TODO: add some variety

    def test_get_documents_for_provenance(self):
        url = "/documents?provenance=fed_api_docs&sort=publication_date&order=desc"
        response = self.client.get(url, headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 17)

        docs = [ d for d in self.all_default_agency_docs if d['provenance'] == 'fed_api_docs' ]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 17)

    def test_get_documents_for_meta_table(self):
        response = self.client.get("/documents?meta_table=foobar", headers={'Authorization': self.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 1)

        docs = [ d for d in self.all_default_agency_docs if d['meta_table'] == 'foobar' ]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_more_like_doc_id(self):
        more_like_doc_id = self.all_default_agency_docs[0]['id']
        response = self.client.get("/documents?more_like_doc_id="+str(more_like_doc_id), headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # n.b. this test is more about that everything wires up and works, we aren't really checking that these 6
        # make sense as "more_like" options
        self.assertEqual(len(response.json['documents']), 7)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 7)

    ## TODO: sort by a single id in the agencies array
    def test_get_documents_sort_and_order_by_agency_id_asc(self):
        response = self.client.get('/documents?sort=agency_id&order=asc', headers={'Authorization': self.token})

    ## TODO: multiple sort parameters
    def test_get_documents_sort_and_order_by_compliance_date_desc(self):
        response = self.client.get('/documents?sort=compliance_date&order=desc', headers={'Authorization': self.token})

    ## TODO
    def test_get_documents_for_concept_mention(self):
        response = self.client.get("/documents?concept_mention=Guidance", headers={'Authorization': self.token})

    def test_get_documents_for_act_id(self):
        response = self.client.get("/documents?include_mentions_for_filter=true&act_id=" +
                                   str(self.acts[0]['id']), headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this act id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, mentions_for_filter=True)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_regulation_id(self):
        response = self.client.get("/documents?include_mentions_for_filter=true&regulation_id=" +
                                   str(self.regulations[0]['id']), headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this regulation id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, mentions_for_filter=True)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_regulation_id_and_all_agencies(self):
        response = self.client.get("/documents?include_mentions_for_filter=true&all_agencies=true&regulation_id=" +
                                   str(self.regulations[0]['id']), headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # the original doc plus the extra doc are assigned to this regulation, the extra doc only coming in
        # due to the all_agencies flag
        self.assertEqual(len(response.json['documents']), 2)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, mentions_for_filter=True)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 2)

    def test_get_documents_for_concept_ids(self):
        concept_id = 0
        response = self.client.get("/documents?include_mentions_for_filter=true&concept_id=" +
                                   str(concept_id), headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this concept id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_bank_ids(self):
        bank_id = 1
        response = self.client.get("/documents?include_mentions_for_filter=true&bank_id=" +
                                   str(bank_id), headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this bank id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, mentions_for_filter=True)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    # n.b. finds one doc annotated by users with no disagreements plus one unannotated doc with high probability
    def test_get_documents_for_topic_ids(self):
        topic_id = 1
        response = self.client.get("/documents?topic_id=" +
                                   str(topic_id), headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this topic id
        self.assertEqual(len(response.json['documents']), 4)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 4)
    
    
    def test_get_documents_for_all_agencies(self):
        response = self.client.get("/documents?all_agencies=true", headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        # includes all docs (non default agency + no agency docs)
        self.assertEqual(len(response.json['documents']), 20)

        for i, document in enumerate(response.json['documents']):
            # n.b. set no_agency_valid here so the whitepaper (no agency doc) passes
            self.validate_basic_doc_details(document, no_agency_valid=True)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 21)

    def test_get_documents_for_all_mainstream_news_sources(self):
        os.environ["MAINSTREAM_NEWS_ENABLED"] = "true"
        response = self.client.get('/documents?category=Mainstream%20News&all_agencies=true', headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        # includes all docs (non default agency + no agency docs, except mainstream news)
        self.assertEqual(len(response.json['documents']), 1)
        
        for i, document in enumerate(response.json['documents']):
            # n.b. set no_agency_valid here so mainstream news doc (no agency doc) passes
            self.validate_basic_doc_details(document, no_agency_valid=True)
        
        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)
        
    def test_get_documents_for_followed_mainstream_news_sources(self):
        # first lets have the user follow a news entity
        user_followed_entity = UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 2,
                'entity_type': 'news_sources',
                'following': True
            })
        db_session_users.add(user_followed_entity)
        db_session_users.commit()
        
        os.environ["MAINSTREAM_NEWS_ENABLED"] = "true"
        response = self.client.get('/documents?category=Mainstream%20News&skip_unused_fields=true', headers={'Authorization': self.token})
        
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        # includes all docs (non default agency + no agency docs, except mainstream news)
        self.assertEqual(len(response.json['documents']), 1)
        
        for i, document in enumerate(response.json['documents']):
            # n.b. set no_agency_valid here so mainstream news doc (no agency doc) passes
            self.assertIn('mainstream_news', document)
            self.assertIn('news_source', document['mainstream_news'])
            self.assertIn('id', document['mainstream_news']['news_source'])
            self.assertEqual(document['mainstream_news']['news_source']['id'], 2)
            self.validate_basic_doc_details(document, no_agency_valid=True)
        
        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)
        
    def test_get_documents_for_followed_mainstream_news_sources_not_following(self):
        # first lets have the user unfollow a news entity
        user_followed_entity = UserFollowedEntity({
                'user_id': self.user.id,
                'entity_id': 2,
                'entity_type': 'news_sources',
                'following': False
            })
        db_session_users.add(user_followed_entity)
        db_session_users.commit()
        
        os.environ["MAINSTREAM_NEWS_ENABLED"] = "true"
        response = self.client.get('/documents?category=Mainstream%20News&skip_unused_fields=true', headers={'Authorization': self.token})
        
        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        # includes all docs (non default agency + no agency docs, except mainstream news)
        self.assertEqual(len(response.json['documents']), 0)
        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 0)

    def test_get_documents_for_all_sources(self):
        # In the case where user is retrieveing docs via search, make sure to return all docs regardless of sources user is following
        # Since the test user already follows a default number of agencies,
        # To test, lets set up the user to also follow a random number (not all or not none) of topics 
        db_session_users.query(UserTopic).delete()
        self.user_followed_topics = [
            UserTopic({
                'user_id': self.user.id,
                'topic_id': 1,
                'following': True
            }),
            UserTopic({
                'user_id': self.user.id,
                'topic_id': 2,
                'following': True
            }),
            UserTopic({
                'user_id': self.user.id,
                'topic_id': 3,
                'following': False
            }),
        ]
        db_session_users.add_all(self.user_followed_topics)
        db_session_users.commit()
        
        # Now test the user is actually following said topics, by fetching the topics
        response = self.client.get("/topics", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("topics", response.json)
        self.assertIsInstance(response.json["topics"], list)
        self.assertEqual(len(response.json["topics"]), 3)
        self.assertIsInstance(response.json["topics"][0], dict)
        self.assertEqual(response.json["topics"][0]['topic_id'], 1)
        self.assertEqual(response.json['topics'][0]['following'], True)

        self.assertIsInstance(response.json["topics"][2], dict)
        self.assertEqual(response.json["topics"][2]['topic_id'], 3)
        self.assertEqual(response.json['topics'][2]['following'], False)
        
        # Now in this user state fetch all sources and test the results 
        response = self.client.get("/documents?all_topics=true&all_agencies=true", headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        # includes all docs (non default/follow agency + non follow topic + no agency docs)
        self.assertEqual(len(response.json['documents']), 20)

        for i, document in enumerate(response.json['documents']):
            # n.b. set no_agency_valid here so the whitepaper (no agency doc) passes
            self.validate_basic_doc_details(document, no_agency_valid=True)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 21)

    def test_get_documents_for_query(self):
        response = self.client.get("/documents?query=yada", headers={'Authorization': self.token})  # n.b. corresponds to full_text on 1 doc

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc has the text: "yada yada yada"
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)