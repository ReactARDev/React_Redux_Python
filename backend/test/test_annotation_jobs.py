import json
import datetime as dt
import test_app
from schemas.base_users import AnnotationTask, AnnotationJob, TopicAnnotation, UserFlaggedDocument, Subscription,\
                               AggregatedAnnotations, AnnotationTaskTopicGroup, SelectedSentence, TopicAnnotationExcerpt
from test_app import db_session_users
import factories


class AnnotationJobsTest(test_app.AppTest):
    def before_each(self):
        db_session_users.query(AggregatedAnnotations).delete()
        db_session_users.query(TopicAnnotationExcerpt).delete()
        db_session_users.query(TopicAnnotation).delete()
        db_session_users.query(SelectedSentence).delete()
        db_session_users.query(AnnotationJob).delete()
        db_session_users.query(AnnotationTask).delete()
        db_session_users.query(AnnotationTaskTopicGroup).delete()
        t1 = AnnotationTask({
            'name': 'foo',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            },
            'type': AnnotationTask.TOPIC_ANNOTATION_TYPE
        })
        t2 = AnnotationTask({
            'name': 'bar',
            'config': {
                'slot_type': 'violation'
            },
            'type': AnnotationTask.SLOT_FILL_TYPE
        })
        self.tasks = [t1, t2]
        self.topic_jobs = []
        self.slot_jobs = []
        for i in xrange(1, 31):
            job_params = {
                "doc_id": 1,
                "priority": 1.0 if i % 2 == 0 else 0.5,
                "status": AnnotationJob.QUEUED_STATUS
            }

            # assign 5 an explicit user id
            if 20 <= i <= 25:
                job_params['user_id'] = self.user.id
                job_params['was_preassigned'] = True

            # make the last 5 a different status
            if i >= 26:
                job_params['status'] = AnnotationJob.ASSIGNED_STATUS

            j1 = AnnotationJob(job_params)
            j2 = AnnotationJob(job_params)
            j1.annotation_task = t1
            j2.annotation_task = t2
            self.topic_jobs.append(j1)
            self.slot_jobs.append(j2)
        db_session_users.add_all(self.tasks)
        db_session_users.add_all(self.topic_jobs)
        db_session_users.add_all(self.slot_jobs)
        db_session_users.commit()
        for t in self.tasks:
            db_session_users.refresh(t)
        for j in self.topic_jobs:
            db_session_users.refresh(j)
        for j in self.slot_jobs:
            db_session_users.refresh(j)

    def test_pop_annotation_job_from_queue(self):
        self.before_each()

        # the first 5 are pre-assigned
        for _ in range(0, 6):
            response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/pop",
                                       headers={'Authorization': self.token})
            self.assert200(response)
            self.assertIn("annotation_job", response.json)
            self.assertIsInstance(response.json["annotation_job"], dict)
            job = response.json["annotation_job"]
            self.assertIsInstance(job['id'], int)
            self.assertIsInstance(job['doc_id'], int)
            self.assertEqual(job['user_id'], self.user.id)
            self.assertTrue(job['was_preassigned'])
            self.assertEqual(job['status'], AnnotationJob.ASSIGNED_STATUS)
            self.assertIsInstance(job['assigned_at'], unicode)
            self.assertIsInstance(job['priority'], float)
            self.assertIn("document", response.json)
            self.assertIsInstance(response.json["document"], dict)

        # test the ordering of nulls last so that the pre-assigned annotation jobs are drained before it gets to
        # a unassigned one (this one) and the primary ordering mechanism is now priority (1.0)
        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/pop",
                                   headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("annotation_job", response.json)
        self.assertIsInstance(response.json["annotation_job"], dict)
        job = response.json["annotation_job"]
        self.assertIsInstance(job['id'], int)
        self.assertIsInstance(job['doc_id'], int)
        self.assertEqual(job['user_id'], self.user.id)
        self.assertIsNone(job['was_preassigned'])
        self.assertEqual(job['status'], AnnotationJob.ASSIGNED_STATUS)
        self.assertIsInstance(job['assigned_at'], unicode)
        self.assertIsInstance(job['created_at'], unicode)
        self.assertIsInstance(job['priority'], float)
        self.assertEqual(job['priority'], 1.0)
        self.assertIn("document", response.json)
        self.assertIsInstance(response.json["document"], dict)

        # update the task - so that we can test the scenario where a task has been updated - and there is a new
        # active task, but the queuer has not yet run to refresh the queue to reflect this change
        new_config = {
            'doc_filters': {
                'agency_id': [100, 200]
            }
        }
        request_body = json.dumps({
            'config': new_config
        })
        response = self.client.post("/annotation_tasks/"+str(self.tasks[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        new_task_id = response.json['annotation_task']['id']

        # now for this new task, pop a job from the queue to make sure previous jobs are still available
        response = self.client.get("/annotation_tasks/" + str(new_task_id) + "/annotation_jobs/pop", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("annotation_job", response.json)
        self.assertIsInstance(response.json["annotation_job"], dict)
        job = response.json["annotation_job"]
        self.assertIsInstance(job['id'], int)
        self.assertIsInstance(job['doc_id'], int)
        self.assertEqual(job['user_id'], self.user.id)
        self.assertIsNone(job['was_preassigned'])
        self.assertEqual(job['status'], AnnotationJob.ASSIGNED_STATUS)
        self.assertIsInstance(job['assigned_at'], unicode)
        self.assertIsInstance(job['created_at'], unicode)
        self.assertIsInstance(job['priority'], float)
        self.assertEqual(job['priority'], 1.0)
        self.assertIn("document", response.json)
        self.assertIsInstance(response.json["document"], dict)

        # finally, clear the queue so we can test the scenario where we have a completely empty queue
        db_session_users.query(TopicAnnotation).delete()
        db_session_users.query(AnnotationJob).delete()

        response = self.client.get("/annotation_tasks/" + str(new_task_id) + "/annotation_jobs/pop",
                                   headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("annotation_job", response.json)
        self.assertIsNone(response.json["annotation_job"])

        # error message is returned if document is not found in index
        new_job = AnnotationJob({
                "doc_id": 1000000,
                "priority": 1,
                "status": AnnotationJob.QUEUED_STATUS,
                "annotation_task_id": new_task_id,
                })
        new_job.user_id = self.user.id
        new_job.was_preassigned = True

        db_session_users.add(new_job)
        db_session_users.commit()

        response = self.client.get("/annotation_tasks/" + str(new_task_id) + "/annotation_jobs/pop",
                                   headers={'Authorization': self.token})
        self.assertIn("errors", response.json)
        job = db_session_users.query(AnnotationJob).filter_by(annotation_task_id=new_task_id).first()
        self.assertEqual(job.status, 'error')
        self.assertEqual(job.notes, 'Document is not found')

    def test_pop_annotation_job_from_queue__training_job(self):

        self.before_each()

        # make new user to do gold topic annotation
        new_gold_annotator = factories.UserFactory.build()
        db_session_users.add(new_gold_annotator)
        db_session_users.commit()
        db_session_users.refresh(new_gold_annotator)

        # create annotation task topic group to contain training job
        # (not really used, but necessary for foreign key in aggregated_annotations)
        gold_task_group_lending = AnnotationTaskTopicGroup({
            'name': 'gold_task_group',
            'description': 'gold task group',
            'topic_id': 1,
            'annotation_task_ids': [None, None],  # this field will no longer be used (as of Jan 2018)
            'arbitrary_tags': ["gold_tag_1", "gold_tag_2"],
            'gold_annotator_user_ids': [new_gold_annotator.id]  # first user is gold annotator
        })
        db_session_users.add(gold_task_group_lending)
        db_session_users.commit()
        db_session_users.refresh(gold_task_group_lending)

        # create gold annotation
        gold_doc_id = 1
        gold_annotation = TopicAnnotation({
            'user_id': new_gold_annotator.id,
            'doc_id': gold_doc_id,
            'topic_id': 1,
            'topic_name': 'Lending',
            'is_positive': True,
            'is_gold_evaluation': False,
            'admin_notes': "this was a SOOPER hard tation bruh"
        })
        db_session_users.add(gold_annotation)
        db_session_users.commit()
        db_session_users.refresh(gold_annotation)

        # create aggregated_annotation entry for this gold annotation
        gold_agg_annotation = AggregatedAnnotations({
            'annotation_task_group_id': gold_task_group_lending.id,
            'doc_id': gold_doc_id,
            'topic_id': gold_annotation.topic_id,
            'is_gold_standard': True,
            'gold_topic_annotation_id': gold_annotation.id,
            'is_in_agreement': True,
            'is_active_for_gold_annotation': True,
            'gold_difficulty': "easy",
            'arbitrary_tags': ["tag_1", "tag_2"],
            'notes': "text_1"
        })
        db_session_users.add(gold_agg_annotation)
        db_session_users.commit()
        db_session_users.refresh(gold_agg_annotation)

        # create AnnotationTask in this group with is_training_task=True
        training_task = AnnotationTask({
            'name': 'training task',
            'topics': {
                'Lending': {'topic_id': 1, 'topic_table': 'topics'}
                      },
            'annotation_task_topic_group_id': gold_task_group_lending.id,
            'is_training_task': True
        })
        db_session_users.add(training_task)
        db_session_users.commit()
        db_session_users.refresh(training_task)

        # make AnnotationJob for this training task
        job_train = AnnotationJob({
                "doc_id": gold_doc_id,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS,
                "is_gold_evaluation": True
            })
        job_train.annotation_task = training_task  # don't forget this step to link AnnotationJob to its task!
        db_session_users.add(job_train)
        db_session_users.commit()
        db_session_users.refresh(job_train)

        # make request that will pop off this AnnotationJob
        response = self.client.get("/annotation_tasks/" + str(training_task.id) + "/annotation_jobs/pop",
                                   headers={'Authorization': self.token})
        # check that response includes info from corresponding gold annotation
        self.assert200(response)
        self.assertIn("annotation_job", response.json)
        self.assertIn("document", response.json)
        self.assertIn("correct_judgment", response.json)
        self.assertIn("correct_judgment_notes", response.json)

        self.assertTrue(response.json["correct_judgment"])
        self.assertEqual(response.json["correct_judgment_notes"], "this was a SOOPER hard tation bruh")

    def test_get_annotation_job_by_id(self):
        self.before_each()
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.COMPLETE_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        first_job.completed_at = dt.datetime.now()
        # create a couple of topic annotations
        for _ in range(0, 3):
            ta = TopicAnnotation({
                'annotation_job_id': first_job.id,
                'doc_id': first_job.doc_id,
                'user_id': self.user.id,
                'is_positive': True,
                'annotation_task_id': first_job.annotation_task_id,
                'topic_name': 'banking'
            })
            db_session_users.add(ta)
        db_session_users.add(first_job)
        db_session_users.commit()

        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/"+str(first_job.id),
                                   headers={'Authorization': self.token})

        self.assert200(response)
        self.assertIn("annotation_job", response.json)
        self.assertIsInstance(response.json["annotation_job"], dict)
        job = response.json["annotation_job"]
        self.assertIsInstance(job['id'], int)
        self.assertIsInstance(job['doc_id'], int)
        self.assertEqual(job['user_id'], self.user.id)
        self.assertIsNone(job['was_preassigned'])
        self.assertEqual(job['status'], AnnotationJob.COMPLETE_STATUS)
        self.assertIsInstance(job['assigned_at'], unicode)
        self.assertIsInstance(job['completed_at'], unicode)
        self.assertIsInstance(job['priority'], float)

        # new test for was_skipped
        self.assertIsNone(job["was_skipped"])
        # new test for difficulty
        self.assertIsNone(job["user_difficulty"])
        # new test for arbitrary labels
        self.assertIsNone(job["notes"])
        # new test for is_gold_evaluation
        self.assertFalse(job["is_gold_evaluation"])

        # topic annotations tests
        self.assertIsInstance(job['topic_annotations'], list)
        self.assertEqual(len(job['topic_annotations']), 3)
        for ta in job['topic_annotations']:
            self.assertTrue(ta['is_positive'])
            self.assertEqual(ta['topic_name'], 'banking')

        # document tests
        self.assertIn("document", response.json)
        self.assertIsInstance(response.json["document"], dict)

    def test_get_annotation_jobs_for_task(self):
        self.before_each()
        response = self.client.get("/annotation_tasks/"+str(self.tasks[0].id)+"/annotation_jobs", headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("annotation_jobs", response.json)
        self.assertIn("total", response.json)
        self.assertIsInstance(response.json["annotation_jobs"], list)
        self.assertEqual(len(response.json["annotation_jobs"]), 20)
        self.assertEqual(response.json["total"], 30)

        for i, job_result in enumerate(response.json["annotation_jobs"]):
            self.assertIsInstance(job_result['doc_id'], int)
            self.assertIsInstance(job_result['priority'], float)
            self.assertIsInstance(job_result['status'], unicode)
            self.assertIsInstance(job_result['created_at'], unicode)


        # n.b. second batch paginated request
        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs?offset=20",
                                   headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("annotation_jobs", response.json)
        self.assertIn("total", response.json)
        self.assertIsInstance(response.json["annotation_jobs"], list)
        self.assertEqual(len(response.json["annotation_jobs"]), 10)
        self.assertEqual(response.json["total"], 30)

        for i, job_result in enumerate(response.json["annotation_jobs"]):
            self.assertIsInstance(job_result['doc_id'], int)
            self.assertIsInstance(job_result['priority'], float)
            self.assertIsInstance(job_result['status'], unicode)
            self.assertIsInstance(job_result['created_at'], unicode)

        # n.b. filtering by status
        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs?status=assigned",
                                   headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("annotation_jobs", response.json)
        self.assertIn("total", response.json)
        self.assertIsInstance(response.json["annotation_jobs"], list)
        self.assertEqual(len(response.json["annotation_jobs"]), 5)
        self.assertEqual(response.json["total"], 5)

        # n.b. the last 5 have this status
        for i, job_result in enumerate(response.json["annotation_jobs"]):
            self.assertEqual(job_result['doc_id'], self.topic_jobs[25 + i].doc_id)
            self.assertEqual(job_result['priority'], self.topic_jobs[25 + i].priority)
            self.assertEqual(job_result['status'], self.topic_jobs[25 + i].status)
            self.assertIsInstance(job_result['created_at'], unicode)

    def test_post_topic_annotations_to_annotation_job(self):
        self.before_each()
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        # create topic annotations request
        request_body = json.dumps({
            'topic_annotations': [
                {
                    "is_positive": True,
                    "topic_name": "banking"
                },
                {
                    "is_positive": False,
                    "topic_name": "lending",
                    "admin_notes": "admin_notes_test_1"
                },
            ]
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response
        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        # check that topic_annotations were created in database
        topic_annotations = db_session_users.query(TopicAnnotation)\
                                            .filter_by(annotation_job_id=first_job.id)\
                                            .order_by(TopicAnnotation.topic_name.asc())\
                                            .all()
        self.assertEqual(len(topic_annotations), 2)
        self.assertTrue(topic_annotations[0].is_positive)
        self.assertEqual(topic_annotations[0].topic_name, 'banking')
        self.assertFalse(topic_annotations[1].is_positive)
        self.assertEqual(topic_annotations[1].topic_name, 'lending')
        self.assertEqual(topic_annotations[1].admin_notes, "admin_notes_test_1")

        db_session_users.refresh(first_job)
        self.assertEqual(first_job.status, AnnotationJob.COMPLETE_STATUS)

        # check original topic annotation state and
        # create request to update topic annotation admin notes
        topic_annotation_1 = db_session_users.query(TopicAnnotation)\
                                             .filter_by(annotation_job_id=first_job.id)\
                                             .filter_by(topic_name="lending").first()
        self.assertIsInstance(topic_annotation_1, TopicAnnotation)
        self.assertFalse(topic_annotation_1.is_positive)

        request_body_update = json.dumps({
            'topic_annotations': [
                {
                    "topic_annotation_id": topic_annotation_1.id,
                    "is_positive": True,
                    "admin_notes": "updated_admin_notes"
                }
            ]
        })
        # check that admin_notes and is_positive updated correctly
        update_response = self.client.post(
            "/annotation_tasks/" + str(topic_annotation_1.annotation_task_id) + "/annotation_jobs/" + str(topic_annotation_1.annotation_job_id),
            headers={'Authorization': self.token}, data=request_body_update)

        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        # check that values updated correctly in topics_annotation_1
        topic_annotation_1 = db_session_users.query(TopicAnnotation)\
                                             .filter_by(annotation_job_id=first_job.id)\
                                             .filter_by(topic_name="lending").first()
        self.assertIsInstance(topic_annotation_1, TopicAnnotation)
        self.assertTrue(topic_annotation_1.is_positive)
        self.assertEqual(topic_annotation_1.admin_notes, "updated_admin_notes")

    def test_post_topic_annotation_with_excerpts_to_annotation_job(self):

        self.before_each()

        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)

        second_job = self.topic_jobs[1]
        second_job.status = AnnotationJob.ASSIGNED_STATUS
        second_job.user_id = self.user.id
        second_job.assigned_at = dt.datetime.now()
        db_session_users.add(second_job)

        db_session_users.commit()

        # create topic annotations request with one excerpt
        request_body = json.dumps({
            'topic_annotations': [
                                    {
                                        "is_positive": True,
                                        "topic_name": "banking",
                                        "topic_annotation_excerpts": [{'length': 12,
                                                                      'offset': 140,
                                                                      'text': "example text"}]
                                    }
                                 ]
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response
        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        # check that topic_annotation was created in database
        topic_annotations = db_session_users.query(TopicAnnotation)\
                                            .filter_by(annotation_job_id=first_job.id)\
                                            .order_by(TopicAnnotation.topic_name.asc())\
                                            .all()
        self.assertEqual(len(topic_annotations), 1)
        self.assertTrue(topic_annotations[0].is_positive)
        self.assertEqual(topic_annotations[0].topic_name, 'banking')

        # check that topic_annotation_excerpt was created
        topic_annotation_excerpt = db_session_users.query(TopicAnnotationExcerpt)\
                                                   .filter_by(topic_annotation_id=topic_annotations[0].id)\
                                                   .one()
        self.assertEqual(topic_annotation_excerpt.length, 12)
        self.assertEqual(topic_annotation_excerpt.offset, 140)
        self.assertEqual(topic_annotation_excerpt.text, "example text")

        # create topic annotation request with two excerpts
        request_body = json.dumps({
            'topic_annotations': [
                                    {
                                        "is_positive": False,
                                        "topic_name": "banking",
                                        "topic_annotation_excerpts": [{'length': 12,
                                                                       'offset': 140,
                                                                       'text': "example text"},
                                                                      {'length': 19,
                                                                       'offset': 41560,
                                                                       'text': "second example bruh"}
                                                                      ]
                                    }
                                 ]
        })
        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(second_job.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response
        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        # check that topic_annotation was created in database
        topic_annotations = db_session_users.query(TopicAnnotation)\
                                            .filter_by(annotation_job_id=second_job.id)\
                                            .order_by(TopicAnnotation.topic_name.asc())\
                                            .all()
        self.assertEqual(len(topic_annotations), 1)
        self.assertFalse(topic_annotations[0].is_positive)
        self.assertEqual(topic_annotations[0].topic_name, 'banking')

        # check that both topic_annotation_excerpts were created
        topic_annotation_excerpts = db_session_users.query(TopicAnnotationExcerpt)\
                                                    .filter_by(topic_annotation_id=topic_annotations[0].id)\
                                                    .order_by(TopicAnnotationExcerpt.length.asc())\
                                                    .all()
        self.assertEqual(len(topic_annotation_excerpts), 2)

        self.assertEqual(topic_annotation_excerpts[0].length, 12)
        self.assertEqual(topic_annotation_excerpts[0].offset, 140)
        self.assertEqual(topic_annotation_excerpts[0].text, "example text")

        self.assertEqual(topic_annotation_excerpts[1].length, 19)
        self.assertEqual(topic_annotation_excerpts[1].offset, 41560)
        self.assertEqual(topic_annotation_excerpts[1].text, "second example bruh")

    def test_post_selected_sentences_to_annotation_job(self):
        self.before_each()
        first_job = self.slot_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        task_data = {
            'selected': [
                {
                    'sent_id': "sentence_0", 'spans': {},
                    'text': "The Consumer Financial Protection Bureau took two ...illegal debt sales and debt collection practices.",
                    'score': "0.5332486287895011", 'offset': "0"
                }
            ]
        }

        # create topic annotations request
        request_body = json.dumps({
            'selected_sentences': [
                {
                    'task_data': task_data
                }
            ],
            "notes": "foobar"
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[1].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        selected_sentences = db_session_users.query(SelectedSentence)\
                                            .filter_by(annotation_job_id=first_job.id)\
                                            .all()
        self.assertEqual(len(selected_sentences), 1)
        self.assertDictEqual(selected_sentences[0].task_data, task_data)

        db_session_users.refresh(first_job)
        self.assertEqual(first_job.status, AnnotationJob.COMPLETE_STATUS)
        self.assertEqual(first_job.notes, 'foobar')

        # TODO annotation updates

    def test_post_error_case_for_annotation_job(self):
        self.before_each()
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        request_body = json.dumps({
            'error': True,
            'notes': "The document is blank"
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        topic_annotations = db_session_users.query(TopicAnnotation).filter_by(annotation_job_id=first_job.id).order_by(TopicAnnotation.topic_name.asc()).all()
        self.assertEqual(len(topic_annotations), 0)

        db_session_users.refresh(first_job)
        self.assertEqual(first_job.status, AnnotationJob.ERROR_STATUS)
        self.assertEqual(first_job.notes, "The document is blank")

    def test_post_user_difficulty_and_tags_to_annotation_job(self):
        self.before_each()

        # alter first annotation job's assignment status
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        request_body = json.dumps({
            'user_difficulty': 'Easy',
            'arbitrary_tags': ['CRA', 'Mortgage']
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response
        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        # check that no topic annotation was created
        topic_annotations = db_session_users.query(TopicAnnotation)\
                                            .filter_by(annotation_job_id=first_job.id)\
                                            .order_by(TopicAnnotation.topic_name.asc()).all()
        self.assertEqual(len(topic_annotations), 0)

        # check that notes and difficulty fields in annotation_job were updated
        db_session_users.refresh(first_job)
        self.assertEqual(first_job.user_difficulty, 'Easy')
        self.assertEqual(first_job.arbitrary_tags, ['CRA', 'Mortgage'])

    def test_post_complete_later_case_for_annotation_job(self):
        self.before_each()
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        request_body = json.dumps({
            'complete_later': True
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        topic_annotations = db_session_users.query(TopicAnnotation).filter_by(annotation_job_id=first_job.id).order_by(TopicAnnotation.topic_name.asc()).all()
        self.assertEqual(len(topic_annotations), 0)

        db_session_users.refresh(first_job)
        self.assertEqual(first_job.status, AnnotationJob.QUEUED_STATUS)

    def test_post_topic_annotation__training_job(self):
        # useful for onboarding mode

        self.before_each()

        # create AnnotationTaskTopicGroup to contain new AnnotationTask
        task_group = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'first task group',
            'annotation_task_ids': [None, None],  # this field will no longer be used (as of Jan 2018)
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1
        })
        db_session_users.add(task_group)
        db_session_users.commit()
        db_session_users.refresh(task_group)

        # make AnnotationTask that has is_training_task=True
        t3 = AnnotationTask({
            'name': 'training task',
            'topics': {
                'Lending': {'topic_id': 1, 'topic_table': 'topics'}
                      },
            'annotation_task_topic_group_id': task_group.id,
            'is_training_task': True,
            'type': AnnotationTask.TOPIC_ANNOTATION_TYPE
        })
        self.tasks.append(t3)
        db_session_users.add(t3)
        db_session_users.commit()
        db_session_users.refresh(t3)

        # make annotation_job for this training task
        job_train = AnnotationJob({
                "doc_id": 100,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS,
                "is_gold_evaluation": True
            })
        job_train.annotation_task = t3
        db_session_users.add(job_train)
        db_session_users.commit()
        db_session_users.refresh(job_train)

        # make request that will create new topic_annotation that should be marked as is_gold_evaluation=True
        request_body = json.dumps({
            'topic_annotations': [
                {
                    "is_positive": False,
                    "topic_name": "Lending",
                    "admin_notes": "admin_notes_test_1"
                }
            ],
            'notes': 'that tation was EASY bruh'
        })

        response = self.client.post(
            "/annotation_tasks/" + str(t3.id) + "/annotation_jobs/" + str(job_train.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response
        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        # check that new TopicAnnotation was created with is_gold_evaluation=True
        topic_annotations = db_session_users.query(TopicAnnotation)\
                                            .filter_by(annotation_job_id=job_train.id)\
                                            .order_by(TopicAnnotation.topic_name.asc())\
                                            .all()
        self.assertEqual(len(topic_annotations), 1)
        self.assertFalse(topic_annotations[0].is_positive)
        self.assertEqual(topic_annotations[0].topic_name, 'Lending')
        self.assertTrue(topic_annotations[0].is_gold_evaluation)

        # make second annotation_job for this training task
        job_train_2 = AnnotationJob({
                "doc_id": 100,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS,
                "is_gold_evaluation": True
            })
        job_train_2.annotation_task = t3
        db_session_users.add(job_train_2)
        db_session_users.commit()
        db_session_users.refresh(job_train_2)

        # make request with this job that does not have notes
        request_body = json.dumps({
            'topic_annotations': [
                {
                    "is_positive": True,
                    "topic_name": "Lending",
                    "admin_notes": "admin_notes_test_2"
                }
            ]
        })
        response = self.client.post(
            "/annotation_tasks/" + str(t3.id) + "/annotation_jobs/" + str(job_train_2.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response (should be 400 error for bad request)
        self.assert400(response)
        self.assertIn("Error", response.json)
        self.assertEqual(response.json["Error"], 'Notes are required for onboarding jobs')

        # make third annotation_job for this training task
        job_train_3 = AnnotationJob({
                "doc_id": 100,
                "priority": 1.0,
                "status": AnnotationJob.QUEUED_STATUS,
                "is_gold_evaluation": True
            })
        job_train_3.annotation_task = t3
        db_session_users.add(job_train_3)
        db_session_users.commit()
        db_session_users.refresh(job_train_3)

        # make request with this job that has notes but tries to skip
        request_body = json.dumps({
            'topic_annotations': [
                {
                    "is_positive": True,
                    "topic_name": "Lending",
                    "admin_notes": "admin_notes_test_3"
                }
            ],
            'notes': 'that tation was EASY bruh',
            'skip': True
        })
        response = self.client.post(
            "/annotation_tasks/" + str(t3.id) + "/annotation_jobs/" + str(job_train_3.id),
            headers={'Authorization': self.token}, data=request_body)

        # check response (should be 400 error for bad request)
        self.assert400(response)
        self.assertIn("Error", response.json)
        self.assertEqual(response.json["Error"], 'Onboarding jobs cannot be skipped')

    def test_update_topic_annotation(self):
        self.before_each()
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        request_body = json.dumps({
            'topic_annotations': [
                {
                    "is_positive": True,
                    "topic_name": "banking"
                },
            ]
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        topic_annotations = db_session_users.query(TopicAnnotation).filter_by(annotation_job_id=first_job.id).all()
        created_annotation_id = topic_annotations[0].id
        request_body = json.dumps({
            'topic_annotations': [
                {
                    "is_positive": False,
                    "topic_annotation_id": created_annotation_id
                },
            ]
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])
        topic_annotations = db_session_users.query(TopicAnnotation).filter_by(annotation_job_id=first_job.id).all()
        self.assertEqual(len(topic_annotations), 1)

        updated_annotation = db_session_users.query(TopicAnnotation).filter_by(id=created_annotation_id).first()

        self.assertFalse(updated_annotation.is_positive)

        db_session_users.refresh(first_job)
        self.assertEqual(first_job.status, AnnotationJob.COMPLETE_STATUS)

    def test_post_contributor_review_with_flagged_fields_to_annotation_job(self):

        self.before_each()
        first_task = self.tasks[0]
        first_task.type = 'contributor'
        db_session_users.add(first_task)
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.contributor_user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        request_body = json.dumps({
            "multiple_field": {
                "title": "should be updated",
                "publication_date": "publication_date is empty",
            }
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.contributor_user_token}, data=request_body)

        self.assert200(response)
        self.assertIn('annotation_job', response.json)
        self.assertEquals(response.json['annotation_job']['status'], AnnotationJob.COMPLETE_STATUS)
        updated_annotation = db_session_users.query(AnnotationJob).filter_by(id=first_job.id).first()
        self.assertEquals(updated_annotation.status, AnnotationJob.COMPLETE_STATUS)

        self.assertIn('flagged_doc', response.json)
        self.assertEquals(response.json['flagged_doc']['multiple_field'],  {
                "title": "should be updated",
                "publication_date": "publication_date is empty",
            })
        self.assertEquals(response.json['flagged_doc']['issue_type'], UserFlaggedDocument.CONTRIBUTOR_ISSUE_TYPE)
        self.assertEquals(response.json['flagged_doc']['user_id'], response.json['annotation_job']['user_id'])
        self.assertEquals(response.json['flagged_doc']['doc_id'], response.json['annotation_job']['doc_id'])
        flagged_doc = db_session_users.query(UserFlaggedDocument).filter_by(user_id=first_job.user_id, doc_id=updated_annotation.doc_id).first()
        self.assertEquals(flagged_doc.issue_type, UserFlaggedDocument.CONTRIBUTOR_ISSUE_TYPE)

    def test_post_contributor_review_with_approval_to_annotation_job(self):
        self.before_each()
        first_task = self.tasks[0]
        first_task.type = 'contributor'
        db_session_users.add(first_task)
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()

        request_body = json.dumps({})

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.contributor_user_token}, data=request_body)

        self.assert200(response)
        self.assertIn('annotation_job', response.json)
        self.assertEquals(response.json['annotation_job']['status'], AnnotationJob.COMPLETE_STATUS)
        self.assertFalse(response.json['flagged_doc'])

    def test_contributor_reviews_count(self):
        self.before_each()
        job1 = self.topic_jobs[0]
        job2 = self.topic_jobs[1]
        job3 = self.topic_jobs[2]
        job4 = self.topic_jobs[3]

        subscription = Subscription({
            'user_id': self.contributor_user.id,
            'latest': True
        })
        db_session_users.add(subscription)
        db_session_users.commit()
        db_session_users.refresh(subscription)

        date = dt.datetime.now() - dt.timedelta(days=75)
        subscription.created_at = date
        db_session_users.add(subscription)
        db_session_users.commit()

        job1.status = AnnotationJob.COMPLETE_STATUS
        job1.user_id = self.contributor_user.id
        job1.completed_at = dt.datetime.now()
        db_session_users.add(job1)
        db_session_users.commit()

        job2.status = AnnotationJob.COMPLETE_STATUS
        job2.user_id = self.contributor_user.id
        job2.completed_at = dt.datetime.now() - dt.timedelta(days=5)
        db_session_users.add(job2)
        db_session_users.commit()

        job3.status = AnnotationJob.COMPLETE_STATUS
        job3.user_id = self.user.id
        job3.completed_at = dt.datetime.now()
        db_session_users.add(job3)
        db_session_users.commit()

        job4.status = AnnotationJob.COMPLETE_STATUS
        job4.user_id = self.contributor_user.id
        job4.completed_at = dt.datetime.now() - dt.timedelta(days=30)
        db_session_users.add(job4)
        db_session_users.commit()

        response = self.client.get("/annotation_tasks/" + str(self.tasks[0].id) + "/contributor_reviews",
                                       headers={'Authorization': self.contributor_user_token})

        self.assert200(response)
        self.assertIn("today_total", response.json)
        self.assertIn("current_month_total", response.json)
        self.assertEqual(response.json["today_total"], 1)
        self.assertEqual(response.json["current_month_total"], 2)

    def test_get_skipped_annotation_jobs(self):
        self.before_each()

        topic = {'banking': {}}
        notes = "test notes"
        doc_id = 123
        task_name = 'test task'
        new_task = AnnotationTask({
            'name': task_name,
            'topics': topic
        })

        new_job = AnnotationJob({
                "doc_id": doc_id,
                "priority": 1.0,
                "status": AnnotationJob.SKIPPED_STATUS,
                "user_id": self.qa_user.id,
                "was_preassigned": True,
                "notes": notes
            })
        new_job.annotation_task = new_task
        db_session_users.add(new_task)
        db_session_users.add(new_job)
        db_session_users.commit()

        response = self.client.get("/annotation_jobs/skipped", headers={'Authorization': self.admin_user_token})
        self.assert200(response)

        self.assertIn("annotation_jobs", response.json)
        receved_jobs = response.json["annotation_jobs"]
        self.assertEquals(len(receved_jobs), 1)
        self.assertEquals(receved_jobs[0]['topics'], topic)
        self.assertEquals(receved_jobs[0]['notes'], notes)
        self.assertEquals(receved_jobs[0]['email'], self.qa_user.email)
        self.assertEquals(receved_jobs[0]['doc_id'], doc_id)
        self.assertEquals(receved_jobs[0]['task_name'], task_name)

        job = db_session_users.query(AnnotationJob).filter_by(status=AnnotationJob.SKIPPED_STATUS).first()
        self.assertEquals(receved_jobs[0]['job_id'], job.id)
        self.assertEquals(receved_jobs[0]['task_id'], job.annotation_task_id)

        # add two more skipped annotation jobs
        job1 = self.topic_jobs[0]
        job1.status = AnnotationJob.SKIPPED_STATUS
        job1.user_id = self.user.id
        job1.notes = "Margin-backed Securities?"
        db_session_users.add(job1)
        db_session_users.commit()

        job2 = self.topic_jobs[1]
        job2.status = AnnotationJob.SKIPPED_STATUS
        job2.user_id = self.contributor_user.id
        job2.notes = "Not sure."
        db_session_users.add(job2)
        db_session_users.commit()
        response = self.client.get("/annotation_jobs/skipped", headers={'Authorization': self.admin_user_token})

        self.assert200(response)
        self.assertIn("annotation_jobs", response.json)
        self.assertEquals(len(response.json["annotation_jobs"]), 3)

    def test_skip_annotation_job(self):
        self.before_each()
        first_job = self.topic_jobs[0]
        first_job.status = AnnotationJob.ASSIGNED_STATUS
        first_job.user_id = self.user.id
        first_job.assigned_at = dt.datetime.now()
        db_session_users.add(first_job)
        db_session_users.commit()
        test_notes = "test notes"

        request_body = json.dumps({
            'skip': True,
            'notes': test_notes
        })

        response = self.client.post(
            "/annotation_tasks/" + str(self.tasks[0].id) + "/annotation_jobs/" + str(first_job.id),
            headers={'Authorization': self.token}, data=request_body)

        self.assert200(response)
        self.assertIn("success", response.json)
        self.assertTrue(response.json["success"])

        topic_annotations = db_session_users.query(TopicAnnotation).filter_by(annotation_job_id=first_job.id).order_by(TopicAnnotation.topic_name.asc()).all()
        self.assertEqual(len(topic_annotations), 0)

        db_session_users.refresh(first_job)
        self.assertEqual(first_job.status, AnnotationJob.SKIPPED_STATUS)
        self.assertTrue(first_job.was_skipped)
        self.assertEqual(first_job.notes, test_notes)

    def test_get_total_number_of_annotation_jobs_(self):
        self.before_each()
        response = self.client.get("/annotation_tasks/"+str(self.tasks[0].id)+"/annotation_jobs?count_only=true", headers={'Authorization': self.contributor_user_token})
        self.assert200(response)
        self.assertIn("total", response.json)
        self.assertEqual(response.json["total"], 30)
        jobs = response.json.get("annotation_jobs", None)
        self.assertIsNone(jobs)
