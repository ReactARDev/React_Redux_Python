import test_app
import json
import elasticsearch

class AgencyEnforcementsByMonthTest(test_app.AppTest):
    def test_agency_enforcements_by_month_no_params(self):
        response = self.client.get(
            "/agency_enforcements_by_month",
            headers={'Authorization': self.api_key.token}
        )

        self.assert200(response)
        self.assertIn('aggregations', response.json)
        self.assertIsInstance(response.json['aggregations'], dict)
        response_data = (response.json['aggregations']['filtered_documents']
            ['by_agencies.name']['buckets'])
        self.assertIsInstance(response_data, list)

    def test_agency_enforcements_by_month_no_from_date(self):
        response = self.client.get(
            "/agency_enforcements_by_month?agency_id=466",
            headers={'Authorization': self.api_key.token}
        )

        self.assert200(response)
        self.assertIn('aggregations', response.json)
        self.assertIsInstance(response.json['aggregations'], dict)
        response_data = (response.json['aggregations']['filtered_documents']
            ['by_agencies.name']['buckets'])
        self.assertIsInstance(response_data, list)
        agency = response_data[0]['key']
        self.assertEqual(agency, 'Securities and Exchange Commission')
        doc_count = response_data[0]['doc_count']
        self.assertEqual(doc_count, 2)

    def test_agency_enforcements_by_month_bad_date_format(self):
        self.app.config['PRESERVE_CONTEXT_ON_EXCEPTION'] = False
        try:
            response = self.client.get(
                "/agency_enforcements_by_month?agency_id=466&from_date=banana",
                headers={'Authorization': self.api_key.token}
            )
        except elasticsearch.exceptions.RequestError as e:
            response = e

        self.assert400(response)

    def test_agency_enforcements_by_month_full_params(self):
        response = self.client.get(
            "/agency_enforcements_by_month?agency_id=466&from_date=now-3y/M",
            headers={'Authorization': self.api_key.token}
        )

        self.assert200(response)
        self.assertIn('aggregations', response.json)
        self.assertIsInstance(response.json['aggregations'], dict)
        response_data = (response.json['aggregations']['filtered_documents']
            ['by_agencies.name']['buckets'])
        self.assertIsInstance(response_data, list)
        agency = response_data[0]['key']
        self.assertEqual(agency, 'Securities and Exchange Commission')
        doc_count = response_data[0]['doc_count']
        self.assertEqual(doc_count, 1)