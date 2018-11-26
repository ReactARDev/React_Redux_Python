import json
import test_app

class TopicsStatTest(test_app.AppTest):

    def test_get_stats(self):
        response = self.client.get('/topics_stats', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("stats", response.json)
        self.assertIsInstance(response.json["stats"], list)
        self.assertEqual(len(response.json["stats"]) > 0, True)
        self.assertIsInstance(response.json["stats"][0], dict)
        self.assertEqual(response.json["stats"][0]['id'] > 0, True)
        self.assertEqual(response.json["stats"][0]['judged_sum'] >= response.json["stats"][0]['judged'], True)
        self.assertEqual(response.json["stats"][0]['positively_judged_sum'] >= response.json["stats"][0]['positively_judged'], True)