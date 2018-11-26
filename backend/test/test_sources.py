import json
import test_app

class SourcesTest(test_app.AppTest):

    def test_get_sources(self):
        response = self.client.get("/sources", headers={'Authorization': self.token})

        self.assert200(response)

        self.assertIn("defaultMainstreamNewsSources", response.json)
        self.assertIsInstance(response.json["defaultMainstreamNewsSources"], list)
        self.assertEqual(len(response.json["defaultMainstreamNewsSources"]) > 0, True)

        self.assertIn("defaultTopics", response.json)
        self.assertIsInstance(response.json["defaultTopics"], list)
        self.assertEqual(len(response.json["defaultTopics"]) > 0, True)

        self.assertIn("activeTopics", response.json)
        self.assertIsInstance(response.json["activeTopics"], list)
        self.assertEqual(len(response.json["activeTopics"]) > 0, True)
