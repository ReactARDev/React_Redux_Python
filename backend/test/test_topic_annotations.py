import json
import datetime as dt
import test_app
from schemas.base_users import AnnotationTask, AnnotationJob, TopicAnnotation
from test_app import db_session_users

class TopicAnnotationsTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(TopicAnnotation).delete()
        db_session_users.query(AnnotationJob).delete()
        db_session_users.query(AnnotationTask).delete()
        t1 = AnnotationTask({
            'name': 'foo',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            }
        })
        self.tasks = [t1]
        self.jobs = []
        self.annotations = []
        for i in xrange(1, 6):
            j1 = AnnotationJob({
                "doc_id": i,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.COMPLETE_STATUS,
                "user_id": self.user.id,
                "was_skipped": True if i % 2 == 0 else None
            })
            j1.annotation_task = t1
            self.jobs.append(j1)

            j1 = AnnotationJob({
                "doc_id": i,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.COMPLETE_STATUS,
                "user_id": self.admin_user.id,
                "was_skipped": None
            })
            j1.annotation_task = t1
            self.jobs.append(j1)

            a1 = TopicAnnotation({
                "doc_id": i,
                "is_positive": True if i % 2 == 0 else False,
                "user_id": self.user.id,
                "topic_name": "Lending"
            })
            a1.annotation_task = t1
            self.annotations.append(a1)

            a1 = TopicAnnotation({
                "doc_id": i,
                "is_positive": False if i % 2 == 0 else True,
                "user_id": self.admin_user.id,
                "topic_name": "Lending"
            })
            a1.annotation_task = t1
            self.annotations.append(a1)

        db_session_users.add_all(self.tasks)
        db_session_users.add_all(self.jobs)
        db_session_users.add_all(self.annotations)
        db_session_users.commit()
        for t in self.tasks:
            db_session_users.refresh(t)
        for j in self.jobs:
            db_session_users.refresh(j)

    def test_get_annotation_breakdown(self):
        self.before_each()

        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/topic_annotations",
                                   headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("total", response.json)
        self.assertIn(self.user.email, response.json)
        self.assertIn(self.admin_user.email, response.json)

        self.assertEqual(response.json["total"]["positive"], 5)
        self.assertEqual(response.json["total"]["negative"], 5)

        self.assertEqual(response.json[self.user.email]["positive"], 2)
        self.assertEqual(response.json[self.user.email]["negative"], 3)
        self.assertEqual(response.json[self.user.email]["skipped"], 2)

        self.assertEqual(response.json[self.admin_user.email]["positive"], 3)
        self.assertEqual(response.json[self.admin_user.email]["negative"], 2)
        self.assertEqual(response.json[self.admin_user.email]["skipped"], 0)