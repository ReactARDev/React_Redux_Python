import json
import test_app
from schemas.base_users import MarketingCampaign, MarketingCampaignUsers
from test_app import db_session_users

class MarketingCampaignsTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(MarketingCampaignUsers).delete()
        db_session_users.query(MarketingCampaign).delete()
        m1 = MarketingCampaign({
            'name': 'foo',
            'start_date': '01/01/2017',
            'end_date': '01/06/2017',
            'created_by_user_id': self.user.id,
            'notes': 'yada yada yada'
        })
        m1.gen_token()
        m1.users.append(self.user)
        m2 = MarketingCampaign({
            'name': 'bar',
            'start_date': '01/01/2015',
            'end_date': '01/06/2015',
            'created_by_user_id': self.user.id
        })
        m2.gen_token()
        self.marketing_campaigns = [m1, m2]
        db_session_users.add_all(self.marketing_campaigns)
        db_session_users.commit()
        for m in self.marketing_campaigns:
            db_session_users.refresh(m)

    def test_get_marketing_campaigns(self):
        self.before_each()

        # auth test
        response = self.client.get("/marketing_campaigns", headers={'Authorization': self.token})
        self.assert404(response)
        self.assertEqual(response.json, {'message': 'Not found'})

        response = self.client.get("/marketing_campaigns", headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("marketing_campaigns", response.json)
        self.assertIsInstance(response.json["marketing_campaigns"], list)
        self.assertEqual(len(response.json["marketing_campaigns"]), 2)
        self.assertEqual(response.json["marketing_campaigns"][0]['name'], "foo")
        self.assertEqual(response.json["marketing_campaigns"][0]['num_users'], 1)
        self.assertEqual(response.json["marketing_campaigns"][0]['created_by'], self.user.email)
        self.assertEqual(response.json["marketing_campaigns"][1]['name'], "bar")
        self.assertEqual(response.json["marketing_campaigns"][1]['num_users'], 0)
        self.assertEqual(response.json["marketing_campaigns"][1]['created_by'], self.user.email)

    def test_create_marketing_campaign(self):
        self.before_each()
        request_body = json.dumps({
            'name': 'wat',
            'start_date': '01/01/2017',
            'end_date': '01/06/2017',
            'notes': 'some useful notes about the campaign'
        })

        # auth test
        response = self.client.post("/marketing_campaigns", headers={'Authorization': self.token}, data=request_body)
        self.assert404(response)
        self.assertEqual(response.json, {'message': 'Not found'})

        response = self.client.post("/marketing_campaigns", headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("marketing_campaign", response.json)
        self.assertIsInstance(response.json["marketing_campaign"], dict)
        self.assertEqual(response.json["marketing_campaign"]['name'], 'wat')
        self.assertEqual(response.json["marketing_campaign"]['created_by'], self.admin_user.email)
        self.assertEqual(response.json["marketing_campaign"]['num_users'], 0)
        for key in ['token', 'start_date', 'end_date', 'notes']:
            self.assertIsInstance(response.json["marketing_campaign"][key], unicode)


    def test_update_marketing_campaign(self):
        self.before_each()
        request_body = json.dumps({
            'name': 'watman',
            'notes': 'some useful notes about the campaign'
        })

        # auth test
        response = self.client.post("/marketing_campaigns/" + str(self.marketing_campaigns[0].id), headers={'Authorization': self.token}, data=request_body)
        self.assert404(response)
        self.assertEqual(response.json, {'message': 'Not found'})

        response = self.client.post("/marketing_campaigns/"+str(self.marketing_campaigns[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("marketing_campaign", response.json)
        self.assertIsInstance(response.json["marketing_campaign"], dict)
        self.assertEqual(response.json["marketing_campaign"]['name'], 'watman')
        self.assertEqual(response.json["marketing_campaign"]['num_users'], 1)
        for key in ['token', 'start_date', 'end_date', 'notes']:
            self.assertIsInstance(response.json["marketing_campaign"][key], unicode)

    def test_get_marketing_campaign_details(self):
        self.before_each()

        # auth test
        response = self.client.get("/marketing_campaigns/" + str(self.marketing_campaigns[0].id), headers={'Authorization': self.token})
        self.assert404(response)
        self.assertEqual(response.json, {'message': 'Not found'})

        response = self.client.get("/marketing_campaigns/"+str(self.marketing_campaigns[0].id), headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("marketing_campaign", response.json)
        self.assertIsInstance(response.json["marketing_campaign"], dict)
        self.assertEqual(response.json["marketing_campaign"]['name'], 'foo')
        self.assertEqual(response.json["marketing_campaign"]['num_users'], 1)
        for key in ['token', 'start_date', 'end_date', 'notes']:
            self.assertIsInstance(response.json["marketing_campaign"][key], unicode)
        self.assertIsInstance(response.json["marketing_campaign"]["users"], list)
        self.assertEqual(len(response.json["marketing_campaign"]["users"]), 1)
        self.assertEqual(response.json["marketing_campaign"]["users"][0]['email'], self.user.email)
