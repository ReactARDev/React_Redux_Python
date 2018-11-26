import test_app

class DocumentImageTest(test_app.AppTest):
    def test_doc_with_image(self):
        doc_id = 19

        response = self.client.get(
            '/document_image/%d' % doc_id,
            headers={'Authorization': self.token},
        )

        self.assert200(response)
        self.assertEqual(response.headers["Content-Disposition"], 'inline; filename="foo.jpeg"')
        self.assertEqual(response.headers["Content-Type"], "image/jpeg")

    def test_doc_without_image(self):
        doc_id = 18

        response = self.client.get(
            '/document_image/%d' % doc_id,
            headers={'Authorization': self.token},
        )

        self.assert404(response)
