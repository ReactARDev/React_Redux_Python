import json
import test_app
from schemas.base_users import InsightsTable
from test_app import db_session_users

class EnforcementGraph(test_app.AppTest):
    def before_each(self):
        db_session_users.query(InsightsTable).delete()
        self.data = [
            InsightsTable({
                'slug': 'enforcement-action-12months',
                'name': 'enforcements_pie',
                'raw_data': {"table": [["agency", "count"], ["TREAS", 219], ["OCC", 109], ["NYSE", 63], ["CFPB", 394], ["FRS", 89], ["FDIC", 270], ["FTC", 208], ["SEC", 1885], ["FINRA", 1236]], "tuples": [["TREAS", 219], ["OCC", 109], ["NYSE", 63], ["CFPB", 394], ["FRS", 89], ["FDIC", 270], ["FTC", 208], ["SEC", 1885], ["FINRA", 1236]]},
                'csv_table': "agency,count\nTREAS,219\nOCC,109\nNYSE,63\nCFPB,394\nFRS,89\nFDIC,270\nFTC,208\nSEC,1885\nFINRA,1236"
            })
        ]
        db_session_users.add_all(self.data)
        db_session_users.commit()

    def test_csv_graph_data(self):
        self.before_each()
        response = self.client.get('/insights_csv/enforcement-action-12months', headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("raw_data", response.json)
        self.assertIsInstance(response.json["raw_data"], dict)
        self.assertIn("table", response.json['raw_data'])
        
        self.assertIsInstance(response.json['raw_data']['table'], list)
        self.assertEqual(len(response.json['raw_data']['table']), 10)

        self.assertIsInstance(response.json['raw_data']['tuples'], list)
        self.assertEqual(len(response.json['raw_data']['tuples']), 9)

        self.assertIn("result", response.json)
        self.assertIsInstance(response.json['result'], basestring)
