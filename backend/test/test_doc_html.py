import test_app

class DocumentHTMLTest(test_app.AppTest):
    def test_pdf_api_no_cover(self):
        doc_id = 1

        response = self.client.get(
            '/document_html/%d' % doc_id,
            headers={'Authorization': self.token},
        )

        self.assert200(response)
        self.assertIn("html", response.json)
        self.assertIsInstance(response.json['html'], unicode)

        expected_html = open('./test/fixtures/fed_doc.html', 'rb').read().decode("utf-8")
        self.assertEqual(response.json['html'], expected_html)
