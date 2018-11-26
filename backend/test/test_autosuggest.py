import test_app


class AutoSuggestTest(test_app.AppTest):
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
        response = self.client.get("/autosuggest/zxy", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEquals(response.json['results'], [])

        # test a single agency name we know will match
        response = self.client.get("/autosuggest/Comptroller", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'agencies', 'Comptroller of the Currency', ['name'])

        # test a partial match for a popular act name
        response = self.client.get("/autosuggest/Aamodt%20Litigation", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'acts',
                                         'Aamodt Litigation Settlement Act', ['name'])

        # test a match for a regulation id (short name)
        response = self.client.get("/autosuggest/1337", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations')
        self.assertEqual(response.json['results'][0]['short_name'], '1337')

        # test a partial match for regulation name (title)
        response = self.client.get("/autosuggest/Regulation", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations')
        self.assertEqual(response.json['results'][0]['name'], "Regulation S")

        # test a match for a regulation name
        response = self.client.get("/autosuggest/Regulation", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations', "Regulation S", ['name'])

        # test a partial match for another regulation name
        response = self.client.get("/autosuggest/Yet another", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'named_regulations', "Yet another named regulation", ['name'])

        # test a partial match for a concept mention
        response = self.client.get("/autosuggest/Consumer Pro", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'concepts', "Consumer Protection", ['name'])

        # test that searches with slashes in them are successful (no 404)
        response = self.client.get("/autosuggest/Consumer Pro%2F", headers={'Authorization': self.token})
        self.assert200(response)

        # test that searches with leading slashes in them are successful (no 404)
        response = self.client.get("/autosuggest/%2FConsumer Pro", headers={'Authorization': self.token})
        self.assert200(response)


        # test that jurisdictions are omitted from search results
        response = self.client.get("/autosuggest/Califo", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 0)

        # test that a bank can be found by name
        response = self.client.get("/autosuggest/Wells", headers={'Authorization': self.token})
        self.assertIn('results', response.json)
        self.assertEqual(len(response.json['results']), 1)
        self.validate_search_result_item(response.json['results'][0], 'banks', "Wells Fargo Bank, National Association", ['name'])