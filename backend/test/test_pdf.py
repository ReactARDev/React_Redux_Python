import json
import pprint
import test_app
from helpers.pdf_utils import create_cover_page, add_cover_to_pdf
import schemas.jurasticsearch as jsearch
from schemas.document import Document

title = 'Self-Regulatory Organizations; Fixed Income Clearing Corporation; Notice of Filing of Proposed Rule Change To Describe the Blackout Period Exposure Charge That May Be Imposed on GCF Repo Participants'

summary = 'The FDIC is revising a provision of its Securitization Safe Harbor Rule, which relates to the treatment of financial assets transferred in connection with a securitization or participation, in order to clarify a requirement as to loss mitigation by servicers of residential mortgage loans.'

table_contents = [
    ['Summary', summary],
    ['PUBLISHED', 	'Monday, June 27th, 2016'],
    ['KEY DATES',	'Effective Wednesday, July 27th, 2016.'],
    ['AUTHOR',	'FDIC'],
    ['DOCUMENT TYPE',	'Final Rule'],
    ['CFR',	'12 CFR 1024, 12 CFR 360'],
    ['Number', 42]
]

class DocumentPDFTest(test_app.AppTest):

    def test_cover_page(self):
        es_doc = jsearch.get_record(1) # XXX real id

        doc = Document(es_doc)

        cover_file = open('/tmp/cover.pdf', 'w')

        create_cover_page(
            title="Check out this cool document",
            table_contents=table_contents,
            text_para=summary,
            file_obj=cover_file
        )

        cover_file.close()


    def test_cover_cat(self):
        out_file = open('/tmp/cats.pdf', 'w')
        pdf_file = open('./assets/fr-sample.pdf')
        pdf_contents = pdf_file.read()
        pdf_file.close()

        add_cover_to_pdf(
            title="Check out this cool document",
            table_contents=table_contents,
            text_para=summary,
            out_file_obj=out_file,
            pdf_contents=pdf_contents
        )

    def test_pdf_api_with_cover(self):
        doc_id = 1

        req_body = {
            'coverpage': True,
            'title': 'My cool title',
            'table_contents': [['Foo', 'Bar'], ['Long thing', 'The quick brown fox jumps over the lazy dog']],
        }

        response = self.client.post(
            '/document_pdf/%d' % doc_id,
            headers={'Authorization': self.token},
            data=json.dumps(req_body),
        )

        self.assert200(response)

        pdf_file=open('/tmp/test.pdf', 'w')
        pdf_file.write(response.data)
        pdf_file.close()

    def test_pdf_api_no_cover(self):
        doc_id = 1

        response = self.client.get(
            '/document_pdf/%d' % doc_id,
            headers={'Authorization': self.token},
        )

        self.assert200(response)

    def test_pdf_api_no_cover_api_key_with_query_arg(self):
        doc_id = 1

        response = self.client.get(
            '/doc_pdf?doc_id=%d' % doc_id,
            headers={'Authorization': self.api_key.token},
        )

        self.assert200(response)
