import test_app


class AutosuggestSubsetTest(test_app.AppTest):
    def validate_search_result_item(self, item, expected_type, expected_name=None, matched_queries=None):
        self.assertIsInstance(item, dict)
        self.assertEqual(item['_type'], expected_type)
        if expected_name: self.assertEqual(item['name'], expected_name)
        if matched_queries: self.assertEqual(item['_matched_queries'], matched_queries)

    # FIXME: these should really be separate tests
    def test_search_all(self):
        # N.B. elasticsearch seems to be injecting itself into the nose/unitest failures here, making the output
        # a right mess to read through. TODO: figure out a way to get around this

        # test an empty set of results
        response = self.client.get("/suggestion?query=zxy", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEquals(response.json['results'], [])

        # test a single agency name we know will match
        response = self.client.get("/suggestion?query=Comptroller", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEquals(len(response.json['results']) > 0, True)

        # test a partial match for a popular act name
        response = self.client.get("/suggestion?query=Aamodt%20Litigation", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'acts',
                                         'Aamodt Litigation Settlement Act', ['name'])

        # test a match for a regulation id (short name)
        response = self.client.get("/suggestion?query=1337", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations')
        self.assertEqual(response.json['results'][0]['short_name'], '1337')

        # test a partial match for regulation name (title)
        response = self.client.get("suggestion?query=Regulation", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations')
        self.assertEqual(response.json['results'][0]['name'], "Regulation S")

        # test a match for a regulation name
        response = self.client.get("suggestion?query=Regulation", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations', "Regulation S", ['name'])

        # test a partial match for another regulation name
        response = self.client.get("suggestion?query=Yet another", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations', "Yet another named regulation", ['name'])

        # test a partial match for a concept mention
        response = self.client.get("suggestion?query=Consumer Pro", headers={'Authorization': self.api_key.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'concepts', "Consumer Protection", ['name'])

        # test that searches with slashes in them are successful (no 404)
        response = self.client.get("suggestion?query=Consumer Pro%2F", headers={'Authorization': self.api_key.token})
        self.assert200(response)

        # test that searches with leading slashes in them are successful (no 404)
        response = self.client.get("suggestion?query=%2FConsumer Pro", headers={'Authorization': self.api_key.token})
        self.assert200(response)


        # test that jurisdictions are omitted from search results
        response = self.client.get("suggestion?query=Califo", headers={'Authorization': self.api_key.token})
        self.assert200(response)
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 0)
