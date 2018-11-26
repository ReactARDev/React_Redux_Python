import test_app
import json
from models import *
from helpers.agency_helper import DefaultAgencies
this_folder = os.path.dirname(os.path.realpath(__file__))

def is_between_dates(init_date, last_date, test_date):
    return init_date <= test_date and test_date <= last_date


class DocumentListTest(test_app.AppTest):
    @classmethod
    def setUpClass(cls):
        super(DocumentListTest, cls).setUpClass()
        fixtures = json.loads(open(this_folder + '/fixtures/fixtures_201712.json').read())
        all_agencies = json.loads(open(this_folder + '/fixtures/agencies_20160721.json').read())['agencies']
        default_agency_lookup = set(DefaultAgencies)
        cls.agencies = [a for a in all_agencies if a['id'] in default_agency_lookup]

        cls.all_default_agency_docs = fixtures['documents'][:-1]
        cls.acts = fixtures['acts']
        cls.named_regulations = fixtures['named_regulations']

    def setUp(self):
        super(DocumentListTest, self).setUp()
        self.all_default_agency_docs = self.__class__.all_default_agency_docs
        self.agencies = self.__class__.agencies
        self.acts = self.__class__.acts
        self.regulations = self.__class__.named_regulations

    def validate_basic_doc_details(self, document, right_panel=False):
        self.assertIsInstance(document['id'], int)

        basic_doc_fields = ['category', 'title', 'summary_text', 'pdf_url', 'publication_date']
        basic_right_panel_doc_fields = ['category', 'title', 'summary_text', 'publication_date']

        if not right_panel:
            for string_field in basic_doc_fields:
                self.assertIsInstance(document[string_field], unicode)
            self.assertIsInstance(document['children'], list)
        else:
            for string_field in basic_right_panel_doc_fields:
                self.assertIsInstance(document[string_field], unicode)

        self.assertIsInstance(document['read'], bool)
        self.assertIsInstance(document['bookmarked'], bool)
        self.assertIsInstance(document['tags'], list)

        self.assertIn('agencies', document)
        self.assertIsInstance(document['agencies'], list)
        for agency in document['agencies']:
            for string_field in ['short_name', 'name', 'type']:
                self.assertIsInstance(agency[string_field], unicode)
            self.assertIsInstance(agency['id'], int)

        self.assertIn('topics', document)
        self.assertIsInstance(document['topics'], list)
        for topic in document['topics']:
            self.assertIsInstance(topic['name'], unicode)
            for int_field in ['id', 'judge_count', 'positive_judgments']:
                self.assertIsInstance(topic[int_field], int)
            self.assertIn('model_probability', topic)

    def test_get_document_by_id(self):
        response = self.client.get('/documents/0', headers={'Authorization': self.token})
        self.assertIn('document', response.json)
        self.assertIsInstance(response.json['document'], dict)
        self.validate_basic_doc_details(response.json['document'])
        self.assertEqual(len(response.json['document']['children']), 1)

        # validate the presence of extra fields that we might otherwise skip
        for field in ["cfr_parts", "full_text", "dockets", "meta_table"]:
            self.assertIn(field, response.json['document'])

    def test_get_document_by_id_with_decorated_children(self):
        response = self.client.get('/documents/0?decorate_children=True', headers={'Authorization': self.token})
        self.assertIn('document', response.json)
        self.assertIsInstance(response.json['document'], dict)
        self.validate_basic_doc_details(response.json['document'])
        self.assertEqual(len(response.json['document']['children']), 1)
        for child in response.json['document']['children']:
            self.assertIsInstance(child['read'], bool)
            self.assertIsInstance(child['bookmarked'], bool)
            self.assertIsInstance(child['tags'], list)

    def test_get_document_by_id_skip_unused_fields(self):
        response = self.client.get('/documents/0?skip_unused_fields=True', headers={'Authorization': self.token})
        self.assertIn('document', response.json)
        self.assertIsInstance(response.json['document'], dict)
        self.validate_basic_doc_details(response.json['document'])
        self.assertEqual(len(response.json['document']['children']), 1)

        for field in ["cited_associations", "meta_table"]:
            self.assertNotIn(field, response.json['document'])

    def test_get_document_by_id_skip_unused_fields_for_state_code(self):
        response = self.client.get('/documents/0?skip_unused_fields=True&skip_fields_for_state_code=True', headers={'Authorization': self.token})
        self.assertIn('document', response.json)
        self.assertIsInstance(response.json['document'], dict)
        self.validate_basic_doc_details(response.json['document'])
        self.assertEqual(len(response.json['document']['children']), 1)

        for field in ["cited_associations", "meta_table", "full_text", "dockets", "cfr_parts"]:
            self.assertNotIn(field, response.json['document'])

    def test_get_document_by_id_skip_unused_fields_for_right_panel(self):
        response = self.client.get('/documents/0?skip_unused_fields=True&skip_fields_for_right_panel=True', headers={'Authorization': self.token})
        self.assertIn('document', response.json)
        self.assertIsInstance(response.json['document'], dict)
        self.validate_basic_doc_details(response.json['document'], True)

        skipped_fields = [
            "full_text", "agency_ids", "children", "created_at", "docket_ids",
            "parent", "jurisdiction", "pdf_url", "spider_name", "times_cited", "total_citation_count"
        ]

        for field in skipped_fields:
            self.assertNotIn(field, response.json['document'])
