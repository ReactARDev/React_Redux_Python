import json
import datetime as dt
import test_app
from schemas.base_users import AnnotationTask, AnnotationJob, UserFlaggedDocument
from test_app import db_session_users

class ContributorReviewsTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(AnnotationJob).delete()
        db_session_users.query(AnnotationTask).delete()
        db_session_users.query(UserFlaggedDocument).delete()
        t1 = AnnotationTask({
            'name': 'foo',
            'type': 'contributor',
        })
        self.tasks = [t1]
        self.jobs = []
        self.docs = []
        for i in xrange(1, 6):
            j1 = AnnotationJob({
                "doc_id": i,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.COMPLETE_STATUS,
                "user_id": self.user.id
            })
            j1.annotation_task = t1
            self.jobs.append(j1)
            if i % 2 == 0:
                flagged_doc = UserFlaggedDocument({
                    'user_id': self.user.id,
                    'doc_id': i,
                    'issue_severity': UserFlaggedDocument.REVIEW_SEVERITY,
                    'issue_type': UserFlaggedDocument.CONTRIBUTOR_ISSUE_TYPE,
                    'multiple_field': {"field1": "test notes"},
                })
                self.docs.append(flagged_doc)

            j1 = AnnotationJob({
                "doc_id": i,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.COMPLETE_STATUS,
                "user_id": self.contributor_user.id
            })
            j1.annotation_task = t1
            self.jobs.append(j1)
            flagged_doc = UserFlaggedDocument({
                'user_id': self.contributor_user.id,
                'doc_id': i,
                'issue_severity': UserFlaggedDocument.REVIEW_SEVERITY,
                'issue_type': UserFlaggedDocument.CONTRIBUTOR_ISSUE_TYPE,
                'multiple_field': {"field1": "test notes"},
                'status': UserFlaggedDocument.FIXED_STATUS if i % 2 == 0 else UserFlaggedDocument.PROCESSED_STATUS
            })
            self.docs.append(flagged_doc)

            j1 = AnnotationJob({
                "doc_id": i,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.COMPLETE_STATUS,
                "user_id": self.qa_user.id
            })
            j1.annotation_task = t1
            self.jobs.append(j1)

            j1 = AnnotationJob({
                "doc_id": i,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.QUEUED_STATUS,
                "user_id": self.internal_user.id
            })
            j1.annotation_task = t1
            self.jobs.append(j1)
            
            

        db_session_users.add_all(self.tasks)
        db_session_users.add_all(self.jobs)
        db_session_users.add_all(self.docs)
        db_session_users.commit()
        for t in self.tasks:
            db_session_users.refresh(t)
        for j in self.jobs:
            db_session_users.refresh(j)
        for d in self.docs:
            db_session_users.refresh(d)

    def test_get_contributor_review_breakdown(self):
        self.before_each()

        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/contributor_review_breakdown",
                                   headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("total", response.json)
        self.assertIn(self.user.email, response.json)
        self.assertIn(self.contributor_user.email, response.json)
        self.assertIn(self.qa_user.email, response.json)
        self.assertEqual(len(response.json), 4)

        self.assertEqual(response.json["total"]["approved"], 8)
        self.assertEqual(response.json["total"]["flagged"], 7)

        self.assertEqual(response.json[self.user.email]["approved"], 3)
        self.assertEqual(response.json[self.user.email]["flagged"], 2)
        self.assertEqual(response.json[self.user.email]["accepted"], 0)
        self.assertEqual(response.json[self.user.email]["dismissed"], 0)

        self.assertEqual(response.json[self.contributor_user.email]["approved"], 0)
        self.assertEqual(response.json[self.contributor_user.email]["flagged"], 5)
        self.assertEqual(response.json[self.contributor_user.email]["accepted"], 2)
        self.assertEqual(response.json[self.contributor_user.email]["dismissed"], 3)

        self.assertEqual(response.json[self.qa_user.email]["approved"], 5)
        self.assertEqual(response.json[self.qa_user.email]["flagged"], 0)
        self.assertEqual(response.json[self.qa_user.email]["accepted"], 0)
        self.assertEqual(response.json[self.qa_user.email]["dismissed"], 0)