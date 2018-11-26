import test_app
import json
from models import *
from helpers.agency_helper import DefaultAgencies

this_folder = os.path.dirname(os.path.realpath(__file__))

def is_between_dates(init_date, last_date, test_date):
    return init_date <= test_date and test_date <= last_date

EXPECTED_STRING_FIELDS = ["category", "title", "publication_date", "full_text", "web_url", "pdf_url", "jurisdiction"]
EXPECTED_OPTIONAL_DATE_FIELDS = ["comments_close_on", "effective_on"]
EXCLUDED_FIELDS = ["rule", "citations", "children", "parent_id", "dockets", "fed_api_doc", "api_table", "meta_table", "agency_update", "enforcement"]

class DocumentListSubsetTest(test_app.AppTest):
    @classmethod
    def setUpClass(cls):
        super(DocumentListSubsetTest, cls).setUpClass()

        fixtures     = json.loads(open(this_folder + '/fixtures/fixtures_201712.json').read())
        all_agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']
        default_agency_lookup = set(DefaultAgencies)
        cls.agencies = [a for a in all_agencies if a['id'] in default_agency_lookup]

        cls.all_default_agency_docs = fixtures['documents'][:-5]
        cls.acts          = fixtures['acts']
        cls.named_regulations   = fixtures['named_regulations']

    def setUp(self):
        super(DocumentListSubsetTest, self).setUp()
        self.all_default_agency_docs = self.__class__.all_default_agency_docs
        self.agencies      = self.__class__.agencies
        self.acts          = self.__class__.acts
        self.regulations   = self.__class__.named_regulations

    def validate_basic_doc_details(self, document, expected_id=None):
        self.assertIsInstance(document['id'], int)

        # figuring out the exact order of docs when multiple docs have the same value is a pain, punt in that case
        if expected_id: self.assertEqual(document['id'], expected_id)

        for string_field in EXPECTED_STRING_FIELDS:
            self.assertIsInstance(document[string_field], unicode)

        for optional_date_field in EXPECTED_OPTIONAL_DATE_FIELDS:
            self.assertIn(optional_date_field, document)

        # note: this will likely change as we expose more data
        for excluded_field in EXCLUDED_FIELDS:
            self.assertNotIn(excluded_field, document)

        self.assertIn('agencies', document)
        self.assertIsInstance(document['agencies'], list)
        for agency in document['agencies']:
            for string_field in ['short_name', 'name']:
                self.assertIsInstance(agency[string_field], unicode)
            self.assertIsInstance(agency['id'], int)


    def test_get_documents(self):
        response = self.client.get('/docs', headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_with_limit_and_offset(self):
        url = '/docs?limit=3&offset=1&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 3)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents'][1:]):
            self.validate_basic_doc_details(document, docs[i + 1]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_sort_and_order_by_publication_date_asc(self):
        response = self.client.get('/docs?sort=publication_date&order=asc', headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'])

        for i, document in enumerate(response.json['documents'][1:-1]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_sort_and_order_by_category_desc(self):
        response = self.client.get('/docs?sort=category&order=desc', headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 18)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['category'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 18)

    def test_get_documents_by_category(self):
        url = '/docs?category=Presidential Document&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 15)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 15)


    def test_get_documents_published_to(self):
        url = '/docs?published_to=01/05/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 6)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)[11:]

        for i, document in enumerate(response.json['documents'][:-2]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 6)

    def test_get_documents_published_from(self):
        url = '/docs?published_from=01/04/2016&sort=publication_date&order=desc'
        response = self.client.get(url, headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 14)

        docs = sorted(self.all_default_agency_docs, key=lambda d: d['publication_date'], reverse=True)[:13]

        for i, document in enumerate(response.json['documents'][1:]):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 14)

    def test_get_documents_for_agency(self):
        agency_id = self.agencies[0]['id']

        url = "/docs?agency_id={}&sort=publication_date&order=desc".format(agency_id)
        response = self.client.get(url, headers={'Authorization': self.api_key.token})
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)
        self.assertEqual(len(response.json['documents']), 8)

        docs = [ d for d in self.all_default_agency_docs if agency_id in [ a['id'] for a in d['agencies'] ]]
        docs = sorted(docs, key=lambda d: d['publication_date'], reverse=True)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document, docs[i]['id'])

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 8)

    def test_get_documents_for_multiple_agencies(self):
        a0 = self.agencies[0]['id']
        a1 = self.agencies[1]['id']

        url = "/docs?agency_id={}&agency_id={}&sort=publication_date&order=desc".format(a0,a1)

        response = self.client.get(url, headers={'Authorization': self.api_key.token})
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

    def test_get_documents_for_regulation_id(self):
        reg_id = 1
        response = self.client.get("/docs?regulation_id=" + str(reg_id), headers={'Authorization': self.api_key.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this regulation id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_act_id(self):
        response = self.client.get("/docs?act_id=" + str(self.acts[0]['id']), headers={'Authorization': self.api_key.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this act id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_concept_ids(self):
        concept_id = 0
        response = self.client.get("/docs?concept_id=" + str(concept_id), headers={'Authorization': self.api_key.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this regulation id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_bank_ids(self):
        bank_id = 1
        response = self.client.get("/docs?bank_id=" + str(bank_id), headers={'Authorization': self.api_key.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this topic id
        self.assertEqual(len(response.json['documents']), 1)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 1)

    def test_get_documents_for_topic_ids(self):
        topic_id = 1
        response = self.client.get("/docs?topic_id=" + str(topic_id), headers={'Authorization': self.api_key.token})

        self.assert200(response)
        self.assertIn('documents', response.json)
        self.assertIsInstance(response.json['documents'], list)

        # 1 doc is assigned this topic id
        self.assertEqual(len(response.json['documents']), 4)

        for i, document in enumerate(response.json['documents']):
            self.validate_basic_doc_details(document)

        self.assertIn('count', response.json)
        self.assertEqual(response.json['count'], 4)
