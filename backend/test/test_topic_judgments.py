import test_app
from models import *
from app import db_session_users
import json

class JudgmentsTest(test_app.AppTest):
    def test_pop_judgment(self):
        response = self.client.get("/topic_judgments/pop", headers={'Authorization': self.token})
        self.assert200(response)
        for key in ['id', 'status', 'judgment', 'document', 'user', 'topic_name']:
            self.assertIn(key, response.json)

        # make sure it is tagged as assigned and the user_id is set to the user whose token we provided above
        self.assertEqual(response.json['status'], 'assigned')
        self.assertEqual(response.json['user']['id'], self.user.id)

    def test_update_judgment(self):
        topic_judgment = db_session_users.query(TopicJudgment).first()
        request_body = json.dumps({
            'status': 'judged',
            'judgment': True
        })

        response = self.client.post("/topic_judgments/"+str(topic_judgment.id), headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        for key in ['id', 'status', 'judgment', 'topic_id', 'topic_name', 'doc_id', 'user_id']:
            self.assertIn(key, response.json)

        # make sure it is tagged as judged, judgment=True, and the user_id is set
        self.assertEqual(response.json['status'], 'judged')
        self.assertEqual(response.json['user_id'], self.user.id)
        self.assertEqual(response.json['judgment'], True)

    def test_pop_judgment_with_empty_queue(self):
        # hack: change the status of everything on the queue to something that won't be popped to
        # simulate an empty queue scenario
        for tj in db_session_users.query(TopicJudgment).all():
            tj.status = 'skipped'
            db_session_users.add(tj)
        db_session_users.commit()

        response = self.client.get("/topic_judgments/pop", headers={'Authorization': self.token})
        self.assert200(response)
        for key in ['id', 'status', 'judgment', 'document', 'user', 'topic_name']:
            self.assertNotIn(key, response.json)

        self.assertIn('queue', response.json)
        self.assertEqual(response.json['queue'], 'empty')

    def test_pop_judgment_with_zz_bad_doc(self):
        # hack: change the status back for everything to queued and set all but one doc to an invalid doc id
        original_tj = db_session_users.query(TopicJudgment).first()
        bad_tj = TopicJudgment(original_tj.__dict__)
        bad_tj.doc_id = 1000000
        bad_tj.status = 'queued'
        bad_tj.user_id = self.new_user.id
        db_session_users.add(bad_tj)
        db_session_users.commit()

        response = self.client.get("/topic_judgments/pop", headers={'Authorization': self.new_user_token})
        self.assert200(response)\

        #n.b. the previous test left this in the state where everything else is queued
        for key in ['id', 'status', 'judgment', 'document', 'user', 'topic_name']:
            self.assertNotIn(key, response.json)

        self.assertIn('queue', response.json)
        self.assertEqual(response.json['queue'], 'empty')