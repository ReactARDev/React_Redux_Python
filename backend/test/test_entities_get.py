import test_app

class EntityGetTest(test_app.AppTest):

    def test_non_whitelist_object(self):
        response = self.client.get("/entities/users/1", headers={'Authorization': self.token})
        self.assert400(response)
        self.assertIn('errors', response.json)

    def test_get_concept_mention(self):
        response = self.client.get("/entities/concepts/1", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('id', response.json)
        self.assertIn('name', response.json)
        self.assertEqual(response.json['id'], 1)
        self.assertEqual(response.json['name'], 'Consumer Protection')

    def test_get_regulation(self):
        response = self.client.get("/entities/named_regulations/1", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('id', response.json)
        self.assertIn('name', response.json)
        self.assertEqual(response.json['id'], 1)
        self.assertEqual(response.json['name'], 'Regulation S')

    def test_get_act(self):
        response = self.client.get("/entities/acts/2", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('id', response.json)
        self.assertIn('name', response.json)
        self.assertEqual(response.json['id'], 2)
        self.assertEqual(response.json['name'], 'A.A.A. Farm Relief and Inflation Act')

    def test_get_agency(self):
        response = self.client.get("/entities/agencies/466", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn('id', response.json)
        self.assertIn('name', response.json)
        self.assertEqual(response.json['id'], 466)
        self.assertEqual(response.json['name'], 'Securities and Exchange Commission')
