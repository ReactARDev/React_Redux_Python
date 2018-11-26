import json
import test_app
from schemas.base_users import AnnotationTask, AnnotationJob, TopicAnnotation, AnnotationTaskTermSamplingGroup, \
    AnnotationTaskTopicGroup
from test_app import db_session_users

class AnnotationTasksTest(test_app.AppTest):
    def before_each(self, with_annotations=False):
        db_session_users.query(AnnotationTaskTermSamplingGroup).delete()
        db_session_users.query(TopicAnnotation).delete()
        db_session_users.query(AnnotationJob).delete()
        db_session_users.query(AnnotationTask).delete()
        db_session_users.query(AnnotationTaskTopicGroup).delete()

        t1 = AnnotationTask({
            'name': 'bar',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            },
            'type': 'topic_annotation'
        })
        t2 = AnnotationTask({
            'name': 'foo',
            'topics': {
                'fintech': {'topic_id': 3, 'topic_table': 'topics'},
                'payments': {'topic_id': 4, 'topic_table': 'topics'},
            },
            "user_ids": [self.user.id, self.new_user.id, self.qa_user.id],
            "config": {
                "dummy-value": 1
            }
        })
        # n.b. add a third task that will be totally ignored
        t3 = AnnotationTask({
            'name': 'annotate any doc',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            },
            'type': AnnotationTask.ANNOTATE_ANY_DOCUMENT_TYPE
        })
        self.tasks = [t1, t2]
        self.jobs = []
        for i in xrange(1, 5):
            j1 = AnnotationJob({
                "doc_id": 1,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS
            })
            j1.annotation_task = t1

            j2 = AnnotationJob({
                "doc_id": 1,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS
            })
            j2.annotation_task = t2

            self.jobs.append(j1)
            self.jobs.append(j2)

            if with_annotations:
                ta1 = TopicAnnotation({"doc_id": 1, "topic_name": "test", "is_positive": True, "user_id": self.user.id})
                ta1.annotation_job = j1
                ta1.annotation_task = t1
                ta2 = TopicAnnotation({"doc_id": 3, "topic_name": "test2", "is_positive": True, "user_id": self.user.id})
                ta2.annotation_job = j2
                ta2.annotation_task = t2
                db_session_users.add_all([ta1, ta2])

        db_session_users.add_all(self.tasks)
        db_session_users.add(t3)
        db_session_users.add_all(self.jobs)
        db_session_users.commit()
        for t in self.tasks:
            db_session_users.refresh(t)

    def test_get_annotation_tasks(self):
        self.before_each()
        response = self.client.get("/annotation_tasks", headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("annotation_tasks", response.json)
        self.assertIsInstance(response.json["annotation_tasks"], list)
        self.assertEqual(len(response.json["annotation_tasks"]), 2)

        for i, task_result in enumerate(response.json["annotation_tasks"]):
            self.assertEqual(task_result['name'], self.tasks[i].name)
            self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
            self.assertIsInstance(task_result['topics'], dict)
            for key in self.tasks[i].topics.keys():
                self.assertIn(key, task_result['topics'])
            self.assertIsInstance(task_result['user_ids'], list)
            for user_id in self.tasks[i].user_ids:
                self.assertIn(user_id, task_result['user_ids'])
            self.assertIsInstance(task_result['old_tasks'], list)
            self.assertEqual(len(task_result['old_tasks']), 0)
            self.assertIsInstance(task_result['updated_at'], unicode)
            self.assertIsInstance(task_result['created_at'], unicode)
            self.assertIsInstance(task_result['config'], dict)
            self.assertIsInstance(task_result['id'], int)

    def test_get_annotation_tasks_qa_user(self):
        self.before_each()
        response = self.client.get("/annotation_tasks", headers={'Authorization': self.qa_user_token})
        self.assert200(response)
        self.assertIn("annotation_tasks", response.json)
        self.assertIsInstance(response.json["annotation_tasks"], list)
        self.assertEqual(len(response.json["annotation_tasks"]), 1)

        task_result = response.json["annotation_tasks"][0]
        self.assertEqual(task_result['name'], self.tasks[1].name)
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in self.tasks[1].topics.keys():
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        for user_id in self.tasks[1].user_ids:
            self.assertIn(user_id, task_result['user_ids'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 0)
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)

    def test_get_annotation_task_group_tags_for_task(self):
        self.before_each()

        # create AnnotationTaskGroups objects
        # self.tasks[0] is contained in both task groups
        task_group_1 = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'first task group',
            'annotation_task_ids': [self.tasks[0].id],
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1
        })

        task_group_2 = AnnotationTaskTopicGroup({
            'name': 'task_group_2',
            'description': 'second task group',
            'annotation_task_ids': [self.tasks[0].id, self.tasks[1].id],
            'arbitrary_tags': ["tag2", "tag3"],
            'topic_id': 2
        })

        self.task_groups = [task_group_1, task_group_2]
        db_session_users.add_all(self.task_groups)
        db_session_users.commit()
        for tg in self.task_groups:
            db_session_users.refresh(tg)

        # make request for task contained in one task group
        response = self.client.get('/annotation_tasks/' + str(self.tasks[1].id) + '/task_group_labels',
                                   headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("annotation_task_group_tags", response.json)
        self.assertEqual(set(response.json["annotation_task_group_tags"]),
                         {"tag2", "tag3"})

        # make request for task contained in two task groups
        response = self.client.get('/annotation_tasks/' + str(self.tasks[0].id) + '/task_group_labels',
                                   headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("annotation_task_group_tags", response.json)
        self.assertEqual(set(response.json["annotation_task_group_tags"]),
                         {"tag1", "tag2", "tag3", "WARNING: MORE THAN ONE ANNOTATION TASK GROUP CONTAINS THIS TASK"})

    def test_create_annotation_task(self):
        self.before_each()
        request_body = json.dumps({
            'name': 'wat',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'}
            },
            'user_ids': [self.user.id],
            'term_sampling_group_ids': [1],
        })
        response = self.client.post("/annotation_tasks", headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'wat')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['banking', 'lending']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        self.assertEqual(task_result['user_ids'][0], self.user.id)
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 1)

        # check that is_contributor_task, is_training_task and include_gold_annotations have correct defaults
        self.assertFalse(task_result['is_contributor_task'])
        self.assertFalse(task_result['is_training_task'])
        self.assertTrue(task_result['include_gold_annotations'])
        self.assertEqual(task_result['type'], AnnotationTask.TOPIC_ANNOTATION_TYPE)

    def test_create_annotation_task_contributor_doc_review(self):
        self.before_each()
        request_body = json.dumps({
            'name': 'wat',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'}
            },
            'user_ids': [self.user.id],
            'term_sampling_group_ids': [1],
            'type': 'contributor'
        })
        response = self.client.post("/annotation_tasks", headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'wat')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['banking', 'lending']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        self.assertEqual(task_result['user_ids'][0], self.user.id)
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 1)

        # check that is_contributor_task, is_training_task and include_gold_annotations have correct defaults
        self.assertTrue(task_result['is_contributor_task'])
        self.assertFalse(task_result['is_training_task'])
        self.assertTrue(task_result['include_gold_annotations'])
        self.assertEqual(task_result['type'], 'contributor')

    def test_create_annotation_task_with_task_group(self):
        self.before_each()

        # make an AnnotationTaskTopicGroup that contains first two annotation tasks in self.tasks
        task_group = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'first task group',
            'annotation_task_ids': [self.tasks[0].id, self.tasks[1].id],
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1,
            'gold_annotator_user_ids': [1, 2]
        })
        self.task_groups = [task_group]
        db_session_users.add_all(self.task_groups)
        db_session_users.commit()
        for group in self.task_groups:
            db_session_users.refresh(group)

        # create two new annotation tasks that point point to this existing annotation_task_topic_group
        request_body_1 = json.dumps({
            'name': 'wat_1',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'}
            },
            'user_ids': [self.user.id],
            'term_sampling_group_ids': [1],
            'annotation_task_topic_group_id': self.task_groups[0].id
        })
        request_body_2 = json.dumps({
            'name': 'wat_2',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'}
            },
            'user_ids': [self.user.id],
            'term_sampling_group_ids': [1],
            'annotation_task_topic_group_id': self.task_groups[0].id
        })
        response_1 = self.client.post("/annotation_tasks", headers={'Authorization': self.admin_user_token},
                                    data=request_body_1)
        task_result_1 = response_1.json["annotation_task"]
        response_2 = self.client.post("/annotation_tasks", headers={'Authorization': self.admin_user_token},
                                    data=request_body_2)
        task_result_2 = response_2.json["annotation_task"]

        for group in self.task_groups:
            db_session_users.refresh(group)

        # check that these two tasks point to task group correctly
        task_from_db_1 = db_session_users.query(AnnotationTask).filter_by(id=task_result_1['id']).first()
        task_from_db_2 = db_session_users.query(AnnotationTask).filter_by(id=task_result_2['id']).first()
        self.assertEqual(task_from_db_1.annotation_task_topic_group_id, self.task_groups[0].id)
        self.assertEqual(task_from_db_2.annotation_task_topic_group_id, self.task_groups[0].id)

        # check that ORM query on the annotation_task_topic_group now gives the these two annotation tasks
        task_group_from_db = db_session_users.query(AnnotationTaskTopicGroup)\
                                             .filter_by(id=self.task_groups[0].id)\
                                             .first()
        self.assertEqual({task_from_db_1, task_from_db_2}, set(task_group_from_db.annotation_tasks))

    def test_update_annotation_task_simple(self):
        self.before_each()
        request_body = json.dumps({
            'name': 'watman',
            'status': AnnotationTask.INACTIVE_STATUS,
            'is_contributor_task': True
        })
        response = self.client.post("/annotation_tasks/"+str(self.tasks[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'watman')
        self.assertEqual(task_result['is_contributor_task'], True)
        self.assertEqual(task_result['status'], AnnotationTask.INACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['banking', 'lending']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        self.assertEqual(len(task_result['user_ids']), 0)
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)
        self.assertEqual(task_result['id'], self.tasks[0].id)
        self.assertIsNone(task_result['active_task_id'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 0)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 0)

    # n.b. updates to topics/such before any annotation jobs are added should not generate a new annotation task
    def test_update_annotation_task_topics_but_no_jobs(self):
        self.before_each()
        db_session_users.query(AnnotationJob).delete()
        db_session_users.add(AnnotationTaskTermSamplingGroup({'annotation_task_id': self.tasks[0].id, 'term_sampling_group_id': 1}))
        db_session_users.commit()
        request_body = json.dumps({
            'name': 'watman',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
                'fintech': {'topic_id': 3, 'topic_table': 'topics'},
                'payments': {'topic_id': 4, 'topic_table': 'topics'},
            },
            'user_ids': [self.user.id],
            'term_sampling_group_ids': [2],
            'config': {
                "foo": "bar"
            }
        })
        response = self.client.post("/annotation_tasks/"+str(self.tasks[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'watman')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['banking', 'lending']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        self.assertEqual(len(task_result['user_ids']), 1)
        self.assertIn(self.user.id, task_result['user_ids'])
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIn('foo', task_result['config'])
        self.assertIsInstance(task_result['id'], int)
        self.assertEqual(task_result['id'], self.tasks[0].id)
        self.assertIsNone(task_result['active_task_id'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 0)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 1)
        self.assertIn(2, task_result['term_sampling_group_ids'])
        self.assertNotIn(1, task_result['term_sampling_group_ids'])

    def test_update_annotation_task_topics(self):
        self.before_each()
        body_hash = {
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
                'fintech': {'topic_id': 3, 'topic_table': 'topics'},
                'payments': {'topic_id': 4, 'topic_table': 'topics'},
            }
        }
        request_body = json.dumps(body_hash)
        response = self.client.post("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'foo')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['banking', 'lending', 'fintech', 'payments']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)
        self.assertNotEqual(task_result['id'], self.tasks[0].id)
        self.assertIsNone(task_result['active_task_id'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 1)
        self.assertEqual(task_result['old_tasks'][0]['active_task_id'], task_result['id'])
        self.assertEqual(task_result['old_tasks'][0]['status'], AnnotationTask.INACTIVE_STATUS)

        # now make a second update and make sure they both stack correctly
        for i in xrange(1, 5):
            j1 = AnnotationJob({
                "doc_id": 1,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS,
                "annotation_task_id": task_result['id']
            })
            db_session_users.add(j1)
        db_session_users.commit()
        body_hash["topics"]["foo"] = {'topic_id': 5, 'topic_table': 'topics'}
        request_body = json.dumps(body_hash)
        response = self.client.post("/annotation_tasks/" + str(task_result['id']), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertEqual(len(response.json["annotation_task"]['old_tasks']), 2)

        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 0)

    def test_update_annotation_task_users(self):
        self.before_each()
        new_users = [self.user.id, self.new_user.id, self.admin_user.id]
        request_body = json.dumps({
            'user_ids': new_users
        })
        response = self.client.post("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'foo')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['fintech', 'payments']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        for user_id in new_users:
            self.assertIn(user_id, task_result['user_ids'])
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)
        self.assertNotEqual(task_result['id'], self.tasks[0].id)
        self.assertIsNone(task_result['active_task_id'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 1)
        self.assertEqual(task_result['old_tasks'][0]['active_task_id'], task_result['id'])
        self.assertEqual(task_result['old_tasks'][0]['status'], AnnotationTask.INACTIVE_STATUS)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 0)

    def test_update_annotation_task_term_sampling_groups(self):
        self.before_each()
        new_term_sampling_groups = [1, 2]
        request_body = json.dumps({
            'term_sampling_group_ids': new_term_sampling_groups
        })
        response = self.client.post("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'foo')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['fintech', 'payments']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIsInstance(task_result['id'], int)
        self.assertNotEqual(task_result['id'], self.tasks[0].id)
        self.assertIsNone(task_result['active_task_id'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 1)
        self.assertEqual(task_result['old_tasks'][0]['active_task_id'], task_result['id'])
        self.assertEqual(task_result['old_tasks'][0]['status'], AnnotationTask.INACTIVE_STATUS)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 2)

    def test_update_annotation_task_config(self):
        self.before_each()
        new_config = {
            'doc_filters': {
                'agency_id': [100, 200]
            }
        }
        request_body = json.dumps({
            'config': new_config
        })
        response = self.client.post("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'foo')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['fintech', 'payments']:
            self.assertIn(key, task_result['topics'])
        self.assertIsInstance(task_result['user_ids'], list)
        for user_id in self.tasks[1].user_ids:
            self.assertIn(user_id, task_result['user_ids'])
        self.assertIsInstance(task_result['updated_at'], unicode)
        self.assertIsInstance(task_result['created_at'], unicode)
        self.assertIsInstance(task_result['config'], dict)
        self.assertIn('doc_filters', task_result['config'])
        self.assertDictEqual(task_result['config']['doc_filters'], new_config['doc_filters'])
        self.assertIn('dummy-value', task_result['config'])
        self.assertIsInstance(task_result['id'], int)
        self.assertNotEqual(task_result['id'], self.tasks[0].id)
        self.assertIsNone(task_result['active_task_id'])
        self.assertIsInstance(task_result['old_tasks'], list)
        self.assertEqual(len(task_result['old_tasks']), 1)
        self.assertEqual(task_result['old_tasks'][0]['active_task_id'], task_result['id'])
        self.assertEqual(task_result['old_tasks'][0]['status'], AnnotationTask.INACTIVE_STATUS)
        self.assertIsInstance(task_result['term_sampling_group_ids'], list)
        self.assertEqual(len(task_result['term_sampling_group_ids']), 0)

    # n.b. updates to topics/such before any annotation jobs are added should not generate a new annotation task
    def test_update_annotation_task_is_training_task_include_gold_annotations_but_no_jobs(self):
        self.before_each()
        db_session_users.query(AnnotationJob).delete()


        # make an AnnotationTaskTopicGroup that contains the first annotation task in self.tasks
        task_group = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'first task group',
            'annotation_task_ids': [self.tasks[0].id],
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1,
            'gold_annotator_user_ids': [1, 2]
        })
        self.task_groups = [task_group]
        db_session_users.add_all(self.task_groups)
        db_session_users.commit()
        for group in self.task_groups:
            db_session_users.refresh(group)


        ## test update to is_training_task ##

        # check original annotation task value for is_training_task
        self.assertFalse(self.tasks[0].is_training_task)

        # make update when annotation_task_topic_group_id is NOT set (so is_training_task cannot be True)
        request_body = json.dumps({
            'is_training_task': True
        })
        response = self.client.post('/annotation_tasks/' + str(self.tasks[0].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response - update should NOT happen because task not in an annotation_task_topic_group
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']
        self.assertIsNone(task_result['annotation_task_topic_group_id'])
        self.assertFalse(task_result['is_training_task'])  # because task does not have annotation_task_topic_group_id
        self.assertEqual(task_result['id'], self.tasks[0].id)  # check that no new annotation_task was created


        # make update when annotation_task_topic_group_id is IS set (update should now go through)
        # NOTE: the annotation_task_topic_group_id here does not link to an actual annotation_task_topic_group
        self.tasks[0].annotation_task_topic_group_id = self.task_groups[0].id
        db_session_users.commit()

        request_body = json.dumps({
            'is_training_task': True
        })
        response = self.client.post('/annotation_tasks/' + str(self.tasks[0].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response - update should NOT happen because task not in an annotation_task_topic_group
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']
        self.assertEqual(task_result['annotation_task_topic_group_id'], self.task_groups[0].id)
        self.assertTrue(task_result['is_training_task'])  # because task DOES have annotation_task_topic_group_id
        self.assertEqual(task_result['id'], self.tasks[0].id)  # check that no new annotation_task was created


        ## test update to include_gold_annotations ##

        # check original annotation task value for include_gold_annotations
        self.assertTrue(self.tasks[0].include_gold_annotations)

        # make update
        request_body = json.dumps({
            'include_gold_annotations': False
        })
        response = self.client.post('/annotation_tasks/' + str(self.tasks[0].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)

        # check response
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']
        self.assertFalse(task_result['include_gold_annotations'])
        self.assertEqual(task_result['id'], self.tasks[0].id)  # check that no new annotation_task was created

    def test_update_annotation_task_is_training_task(self):
        # TODO: this behavior creates new task even in case when illegal is_training_task update occurs;
        # need to either make this impossible in API side or enforce that this does not happen on frontend
        self.before_each()


        ## test update to is_training_task ##

        # check original annotation task value for is_training_task
        self.assertFalse(self.tasks[0].is_training_task)

        # make update when annotation_task_topic_group_id is NOT set (so is_training_task cannot be True)
        request_body = json.dumps({
            'is_training_task': True
        })
        response = self.client.post('/annotation_tasks/' + str(self.tasks[0].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']
        self.assertFalse(task_result['is_training_task'])  # since annotation_task_topic_group_id is NOT set
        self.assertNotEqual(task_result['id'], self.tasks[0].id)  # check that new annotation_task was created
        db_session_users.refresh(self.tasks[0])
        self.assertEqual(self.tasks[0].status, 'inactive')  # check that old task is no longer active
        self.assertEqual(self.tasks[0].active_task_id, task_result['id'])  # check that old task points to new task


        # update task to have an annotation_task_topic_group_id and do update again

        # make an AnnotationTaskTopicGroup that contains the second annotation task in self.tasks
        task_group = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'first task group',
            'annotation_task_ids': [self.tasks[1].id],
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1,
            'gold_annotator_user_ids': [1, 2]
        })
        self.task_groups = [task_group]
        db_session_users.add_all(self.task_groups)
        db_session_users.commit()
        for group in self.task_groups:
            db_session_users.refresh(group)

        # make second task point to this annotation_task_topic_group
        self.tasks[1].annotation_task_topic_group_id = self.task_groups[0].id
        db_session_users.commit()

        # make update when annotation_task_topic_group_id IS set (so is_training_task can be True)
        request_body = json.dumps({
            'is_training_task': True
        })
        response = self.client.post('/annotation_tasks/' + str(self.tasks[1].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']
        self.assertTrue(task_result['is_training_task'])  # since annotation_task_topic_group_id IS set
        self.assertNotEqual(task_result['id'], self.tasks[1].id)  # check that new annotation_task was created
        db_session_users.refresh(self.tasks[1])
        self.assertEqual(self.tasks[1].status, 'inactive')  # check that old task is no longer active
        self.assertEqual(self.tasks[1].active_task_id, task_result['id'])  # check that old task points to new task

    def test_update_annotation_task_include_gold_annotations(self):
        self.before_each()

        ## test update to is_training_task ##

        # check original annotation task value for include_gold_annotations
        self.assertTrue(self.tasks[0].include_gold_annotations)

        # make update
        request_body = json.dumps({
            'include_gold_annotations': False
        })
        response = self.client.post('/annotation_tasks/' + str(self.tasks[0].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']
        self.assertFalse(task_result['include_gold_annotations'])
        self.assertNotEqual(task_result['id'], self.tasks[0].id)  # check that new annotation_task was created
        db_session_users.refresh(self.tasks[0])
        self.assertEqual(self.tasks[0].status, 'inactive')  # check that old task is no longer active
        self.assertEqual(self.tasks[0].active_task_id, task_result['id'])  # check that old task points to new task

    def test_update_annotation_task_is_onboarding_task(self):
        self.before_each()
        db_session_users.query(AnnotationJob).delete()

        # make annotation task group to contain the onboarding task
        task_group = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'onboarding task group',
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1,
            'gold_annotator_user_ids': [1, 2]
        })
        self.task_groups = [task_group]
        db_session_users.add_all(self.task_groups)
        db_session_users.commit()
        for group in self.task_groups:
            db_session_users.refresh(group)

        # create onboarding annotation task
        onboarding_task = AnnotationTask({
            'name': 'onboarding task',
            'topics': {
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            },
            'type': AnnotationTask.TOPIC_ANNOTATION_TYPE,
            'is_training_task': True,
            'annotation_task_topic_group_id': self.task_groups[0].id,
            'user_ids': [[self.user.id, self.new_user.id, self.qa_user.id]]
        })
        db_session_users.add(onboarding_task)
        db_session_users.commit()
        db_session_users.refresh(onboarding_task)

        # create job for this onboarding task (so that if this is not an onboarding task, new task will be created)
        onboarding_job = AnnotationJob({
            "doc_id": 1,
            "priority": 1.0,
            "status": AnnotationJob.QUEUED_STATUS,
            "is_gold_evaluation": True
        })
        onboarding_job.annotation_task = onboarding_task
        db_session_users.add(onboarding_job)
        db_session_users.commit()
        db_session_users.refresh(onboarding_job)

        # make update to users
        request_body = json.dumps({
            'user_ids': [self.user.id]
        })
        response = self.client.post('/annotation_tasks/' + str(onboarding_task.id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)

        # check result - no new task should be created, because this is an onboarding task
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']

        self.assertEqual(task_result['user_ids'], [self.user.id])
        self.assertEqual(task_result['id'], onboarding_task.id)  # check that no new annotation_task was created

        # update task to be not-onboarding
        onboarding_task.is_training_task = False
        db_session_users.add(onboarding_task)
        db_session_users.commit()
        db_session_users.refresh(onboarding_task)

        # make another user_ids update
        request_body = json.dumps({
            'user_ids': [self.user.id, self.new_user.id]
        })
        response = self.client.post('/annotation_tasks/' + str(onboarding_task.id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)

        # confirm that new task was created this time
        self.assert200(response)
        self.assertIn('annotation_task', response.json)
        self.assertIsInstance(response.json['annotation_task'], dict)
        task_result = response.json['annotation_task']

        self.assertEqual(task_result['user_ids'], [self.user.id, self.new_user.id])
        self.assertNotEqual(task_result['id'], onboarding_task.id)  # check that new annotation_task was created

    def test_delete_annotation_task_no_topic_annotations(self):
        self.before_each()
        request_body = json.dumps({})
        response = self.client.delete("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json["success"])
        self.assertIsNone(db_session_users.query(AnnotationTask).filter_by(id=self.tasks[1].id).first())

    def test_delete_annotation_task_with_topic_annotations(self):
        self.before_each(with_annotations=True)
        request_body = json.dumps({})
        response = self.client.delete("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert400(response)
        self.assertIn("errors", response.json)
        self.assertEqual(response.json["errors"], "Annotations exist for this task")
        self.assertIsNotNone(db_session_users.query(AnnotationTask).filter_by(id=self.tasks[1].id).first())

        request_body = json.dumps({"delete_with_annotations": True})
        response = self.client.delete("/annotation_tasks/"+str(self.tasks[1].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json["success"])
        self.assertIsNone(db_session_users.query(AnnotationTask).filter_by(id=self.tasks[1].id).first())

    # Test that contributor user can view both contributor tasks and annotation tasks.
    def test_get_annotation_tasks_by_contributor_type(self):
        self.before_each()
        first_task = self.tasks[0]
        first_task.type = "contributor"
        first_task.is_contributor_task = True
        db_session_users.add(first_task)
        db_session_users.commit()

        response = self.client.get("/annotation_tasks", headers={'Authorization': self.contributor_user_token})
        self.assert200(response)
        self.assertIn("annotation_tasks", response.json)
        result_tasks = response.json["annotation_tasks"]
        self.assertIsInstance(result_tasks, list)
        self.assertEqual(len(result_tasks), 1)
        self.assertEqual(result_tasks[0]['id'], first_task.id)

    # Test that contributor user can view both contributor tasks and annotation tasks.
    # Send type=annotation to get annotation tasks.
    def test_get_annotation_tasks_by_annotation_type(self):
        self.before_each()
        first_task = self.tasks[0]
        first_task.type = "contributor"
        first_task.is_contributor_task = True
        db_session_users.add(first_task)
        second_task = self.tasks[1]
        second_task.type = AnnotationTask.TOPIC_ANNOTATION_TYPE
        second_task.is_contributor_task = True
        second_task.user_ids = [self.contributor_user.id]
        db_session_users.add(second_task)
        new_task_no_flag = AnnotationTask({
            'name': 'watman',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            },
            'type': AnnotationTask.TOPIC_ANNOTATION_TYPE,
            'is_contributor_task': False,
            'user_ids': [self.contributor_user.id]
        })
        db_session_users.add(new_task_no_flag)
        db_session_users.commit()
        db_session_users.refresh(new_task_no_flag)

        response = self.client.get("/annotation_tasks?type=topic_annotation", headers={'Authorization': self.contributor_user_token})
        self.assert200(response)
        self.assertIn("annotation_tasks", response.json)
        result_tasks = response.json["annotation_tasks"]
        self.assertIsInstance(result_tasks, list)
        self.assertEqual(len(result_tasks), 2)
        self.assertEqual(result_tasks[0]['id'], second_task.id)
        self.assertEqual(result_tasks[1]['id'], new_task_no_flag.id)