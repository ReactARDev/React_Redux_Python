import json
import test_app
from schemas.base_users import AggregatedAnnotations, AnnotationTaskTermSamplingGroup, TopicAnnotation,\
                               AnnotationJob, AnnotationTask, AnnotationTaskTopicGroup, User
from test_app import db_session_users
import urllib


# NB: using urllib to encode queries as url strings


class AggregatedAnnotationsTest(test_app.AppTest):


    def before_each(self):
        # must delete tables in correct order to avoid key constraint error

        # see necessary ordering in test_annotation_tasks.py and test_annotation_jobs.py
        db_session_users.query(AggregatedAnnotations).delete()
        db_session_users.query(AnnotationTaskTermSamplingGroup).delete()
        db_session_users.query(TopicAnnotation).delete()
        db_session_users.query(AnnotationJob).delete()
        db_session_users.query(AnnotationTask).delete()
        db_session_users.query(AnnotationTaskTopicGroup).delete()


        self.valid_doc_ids = [3, 8, 12, 13, 14]  # valid doc_ids in ES index as of Nov 2017
                                                 # (update if any of these become invalid)
                                                 # more ids: [18, 21, 22, 160, 161]

        ###########################################
        # create AnnotationTask objects (3 total)
        ###########################################
        t1 = AnnotationTask({
            'name': 'bar',
            'topics': {
                'BSA/AML': {'topic_id': 2, 'topic_table': 'topics'},
                'Lending': {'topic_id': 1, 'topic_table': 'topics'},
            }
        })
        t2 = AnnotationTask({
            'name': 'foo',
            'topics': {
                'BSA/AML': {'topic_id': 2, 'topic_table': 'topics'},
                'Lending': {'topic_id': 1, 'topic_table': 'topics'},
            }
        })
        t3 = AnnotationTask({
            'name': 'fubar',
            'topics': {
                'BSA/AML': {'topic_id': 2, 'topic_table': 'topics'},
                'Lending': {'topic_id': 1, 'topic_table': 'topics'},
            }
        })

        self.tasks = [t1, t2, t3]

        db_session_users.add_all(self.tasks)
        db_session_users.commit()
        # do refresh to get current primary key ids of tasks
        for t in self.tasks:
            db_session_users.refresh(t)

        ##########################################
        # create AnnotationJob objects (10 total)
        ##########################################
        self.jobs = []
        for i in xrange(10):
            j1 = AnnotationJob({
                "doc_id": self.valid_doc_ids[i % len(self.valid_doc_ids)],  # round robin
                "priority": 1.0,
                "arbitrary_tags": ["tag_{}".format(str(i))] if i <= 2 else [],
                "status": AnnotationJob.QUEUED_STATUS
            })
            j1.annotation_task = self.tasks[i % len(self.tasks)]  # round robin
            self.jobs.append(j1)

        db_session_users.add_all(self.jobs)
        db_session_users.commit()
        # refresh to get current primary key ids of jobs
        for j in self.jobs:
            db_session_users.refresh(j)

        ###############################################
        # create AnnotationTaskGroups object (1 total)
        ###############################################
        task_group = AnnotationTaskTopicGroup({
            'name': 'task_group_1',
            'description': 'first task group',
            'annotation_task_ids': [self.tasks[0].id, self.tasks[1].id],
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1
        })

        self.task_groups = [task_group]
        db_session_users.add_all(self.task_groups)
        db_session_users.commit()
        for tg in self.task_groups:
            db_session_users.refresh(tg)

        ###################################
        # create User objects (3 total)
        ###################################
        # for testing retrieval of user names as judges
        # only creates users if they don't already exist
        # N.B. in future use a factory for creating users for testing

        if db_session_users.query(User)\
                           .filter_by(email='alice@googoo.com')\
                           .first() is not None:
            self.users = [
                          db_session_users.query(User)\
                                          .filter_by(email='alice@googoo.com')\
                                          .first(),
                          db_session_users.query(User) \
                                          .filter_by(email='bob@googoo.com') \
                                          .first(),
                          db_session_users.query(User)\
                                          .filter_by(email='cindy@googoo.com')\
                                          .first()
                          ]

        else:

            self.users = []

            user_1 = User({
                'first_name': 'Alice',
                'last_name': 'Smith',
                'email': 'alice@googoo.com',
                'password': 'badpassword'
            })
            self.users.append(user_1)

            user_2 = User({
                'first_name': 'Bob',
                'last_name': 'Doe',
                'email': 'bob@googoo.com',
                'password': 'badpassword'
            })
            self.users.append(user_2)

            user_3 = User({
                'first_name': 'Cindy',
                'last_name': 'Zeta',
                'email': 'cindy@googoo.com',
                'password': 'badpassword'
            })
            self.users.append(user_3)

            db_session_users.add_all(self.users)
            db_session_users.commit()
            for us in self.users:
                db_session_users.refresh(us)

        ########################################################################
        # create TopicAnnotation objects (10 total, one for each AnnotationJob)
        ########################################################################

        # here there is a 1-to-1 correspondence between TopicAnnotations and AnnotationJobs
        self.topic_annotations = []

        # connect TopicAnnotation values with AnnotationJob values
        for i, job in enumerate(self.jobs):
            ta = TopicAnnotation({
                 "doc_id": job.doc_id,
                 "is_positive": True if i % 2 == 0 else False,
                 "user_id": self.users[i % 3].id,
                 "topic_name": "Lending",
                 "annotation_task_id": self.tasks[i % len(self.tasks)].id
            })
            ta.annotation_job = job
            self.topic_annotations.append(ta)
        db_session_users.add_all(self.topic_annotations)
        db_session_users.commit()
        for ta in self.topic_annotations:
            db_session_users.refresh(ta)


        ##################################################
        # create AggregatedAnnotations objects (3 total)
        ##################################################
        # NB: AggregatedAnnotations object has foreign keys for annotation_task_group and topic_annotation
        # NB: this table is populated by a daemon job in actual database

        # all have same topic_id (1 for "Lending")
        self.aggregated_annotations = []

        # self.valid_doc_ids[0] includes jobs 1 and 6
        agg_annotation_1 = AggregatedAnnotations({
                           'annotation_task_group_id': self.task_groups[0].id,
                           'doc_id': self.valid_doc_ids[0],
                           'topic_id': 1,
                           'is_gold_standard': True,
                           'gold_topic_annotation_id': self.topic_annotations[0].id,
                           'is_in_agreement': True,
                           'is_active_for_gold_annotation': True,
                           'gold_difficulty': "easy",
                           'arbitrary_tags': ["tag_1", "tag_2"],
                           'notes': "text_1"
        })

        # self.valid_doc_ids[0] includes jobs 2 and 7
        agg_annotation_2 = AggregatedAnnotations({
                           'annotation_task_group_id': self.task_groups[0].id,
                           'doc_id': self.valid_doc_ids[1],
                           'topic_id': 1,
                           'is_gold_standard': True,
                           'gold_topic_annotation_id': self.topic_annotations[1].id,
                           'is_in_agreement': False,
                           'is_active_for_gold_annotation': True,
                           'gold_difficulty': "medium",
                           'arbitrary_tags': ["tag_1", "tag_3"],
                           'notes': "text_1"
        })

        # self.valid_doc_ids[1] includes jobs 3 and 8
        agg_annotation_3 = AggregatedAnnotations({
                           'annotation_task_group_id': self.task_groups[0].id,
                           'doc_id': self.valid_doc_ids[2],
                           'topic_id': 1,
                           'is_gold_standard': True,
                           'gold_topic_annotation_id': self.topic_annotations[2].id,
                           'is_active_for_gold_annotation': True,
                           'gold_difficulty': "hard",
                           'arbitrary_tags': ["tag_1", "tag_2"],
                           'notes': "text_1"
        })

        self.aggregated_annotations = [agg_annotation_1, agg_annotation_2, agg_annotation_3]
        db_session_users.add_all(self.aggregated_annotations)
        db_session_users.commit()
        # do refresh to get current primary key ids of aggregated annotations
        for agt in self.aggregated_annotations:
            db_session_users.refresh(agt)

    def test_before_each(self):
        # sanity check that before_each operating as expected
        self.before_each()

        # check number of each object in database
        # NB: User table not cleared before this test, so number of entries not necessarily 3
        self.assertEqual(db_session_users.query(AnnotationTask).count(), 3)
        self.assertEqual(db_session_users.query(AnnotationJob).count(), 10)
        self.assertEqual(db_session_users.query(AnnotationTaskTopicGroup).count(), 1)
        self.assertEqual(db_session_users.query(TopicAnnotation).count(), 10)
        self.assertEqual(db_session_users.query(AggregatedAnnotations).count(), 3)

        # check annotation_job doc_ids
        self.assertEqual(db_session_users.query(AnnotationJob)
                                         .filter_by(id=self.jobs[0].id)
                                         .first().doc_id, self.valid_doc_ids[0])
        self.assertEqual(db_session_users.query(AnnotationJob)
                                         .filter_by(id=self.jobs[7].id)
                                         .first().doc_id, self.valid_doc_ids[2])

        # check TopicAnnotation objects
        self.assertEqual(db_session_users.query(TopicAnnotation)
                                         .filter_by(id=self.topic_annotations[7].id)
                                         .first().doc_id, self.valid_doc_ids[2])
        self.assertEqual(db_session_users.query(TopicAnnotation)
                                         .filter_by(id=self.topic_annotations[7].id)
                                         .first().is_positive, False)
        self.assertEqual(db_session_users.query(TopicAnnotation)
                                         .filter_by(id=self.topic_annotations[7].id)
                                         .first().doc_id, self.jobs[7].doc_id)

        # check AggregatedAnnotation objects
        self.assertEqual(db_session_users.query(AggregatedAnnotations)
                                         .filter_by(id=self.aggregated_annotations[1].id)
                                         .first().doc_id, self.valid_doc_ids[1])
        self.assertEqual(db_session_users.query(AggregatedAnnotations)
                                         .filter_by(id=self.aggregated_annotations[1].id)
                                         .first().gold_topic_annotation_id, self.topic_annotations[1].id)

    # ---------- tests for get_aggregated_annotations ------------------ #

    def test_get_aggregated_annotations_no_topic_id(self):
        self.before_each()

        # make request that is missing topic_id - check that this is unreachable url
        response = self.client.get('/aggregated_annotations/',
                                   headers={'Authorization': self.admin_user_token})

        # check that response is 404
        self.assert404(response)

    def test_get_aggregated_annotations_sorting(self):
        # TODO: add tests for remaining sorting parameters

        self.before_each()


        ## sorting on doc_id ##
        query_dict = {'sorting_doc_id': 'ascending'}
        query_string = urllib.urlencode(query_dict)

        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 3)  # returned all aggregated annotations
        self.assertEqual(response_list[0]["doc_id"], self.valid_doc_ids[0])
        self.assertEqual(response_list[1]["doc_id"], self.valid_doc_ids[1])
        self.assertEqual(response_list[2]["doc_id"], self.valid_doc_ids[2])


        ## sorting on gold_difficulty ##
        query_dict = {'sorting_gold_difficulty': 'ascending'}
        query_string = urllib.urlencode(query_dict)

        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 3)  # returned all aggregated annotations
        self.assertEqual(response_list[0]["gold_difficulty"], "easy")
        self.assertEqual(response_list[1]["gold_difficulty"], "hard")
        self.assertEqual(response_list[2]["gold_difficulty"], "medium")

    def test_get_aggregated_annotations_filtering(self):
        self.before_each()


        ## filtering on doc_id ##
        query_dict = {"filter_doc_id": self.valid_doc_ids[0]}
        query_string = urllib.urlencode(query_dict)

        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 1)  # one aggregated_annotation has "doc_id" = self.valid_doc_ids[0]
        self.assertEqual(response_list[0]["doc_id"], self.valid_doc_ids[0])


        # filtering on is_in_agreement ##
        query_dict = {'filter_is_in_agreement': True}
        query_string = urllib.urlencode(query_dict)

        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 1)  # one aggregated_annotation has "is_in_agreement" = True
        self.assertEqual(response_list[0]["is_in_agreement"], True)

    def test_get_aggregated_annotations_pagination(self):
        self.before_each()


        # create pagination request with 1 entry per page
        query_dict = {
            'sorting_doc_id': 'ascending',
            'limit': 1,
            'offset': 0
        }
        query_string = urllib.urlencode(query_dict)

        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 3)  # three aggregated annotations match query BEFORE pagination
        self.assertEqual(len(response_list), 1)  # only 1 returned due to pagination limit
        self.assertEqual(response_list[0]["doc_id"], self.valid_doc_ids[0])  # first agg annotation in doc_id-sorted return


        # make second paginated request
        query_dict = {
            'sorting_doc_id': 'ascending',
            'limit': 1,
            'offset': 1
        }
        query_string = urllib.urlencode(query_dict)

        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 3)  # three aggregated annotations match query BEFORE pagination
        self.assertEqual(len(response_list), 1)  # only 1 returned due to pagination limit
        self.assertEqual(response_list[0]["doc_id"], self.valid_doc_ids[1])  # second agg annotation in doc_id-sorted return

    def test_get_aggregated_annotations_count_only(self):
        self.before_each()


        # do count-only request (all aggregated annotations)
        query_dict = {
            'count_only': None
        }
        query_string = urllib.urlencode(query_dict)
        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_length = response.json["total"]
        self.assertEqual(response_length, 3)


        # do count-only request (filter should return one document)
        query_dict = {
            'filter_doc_id': self.valid_doc_ids[0],
            'count_only': None
        }
        query_string = urllib.urlencode(query_dict)
        response = self.client.get('/aggregated_annotations/' + str(1) + '?' + query_string,
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_length = response.json["total"]
        self.assertEqual(response_length, 1)  # should return one document after the filter

    def test_get_aggregated_annotations_all(self):
        self.before_each()

        # make request that returns all aggregated annotations
        # check topic_annotations, annotations jobs and judges list
        response = self.client.get('/aggregated_annotations/' + str(1),
                                    headers={'Authorization': self.admin_user_token})
        # check response
        self.assert200(response)
        response_list = response.json["aggregated_annotations"]
        response_length = response.json["total"]
        self.assertEqual(response_length, 3)
        self.assertIsInstance(response_list, list)
        self.assertEqual(response_list[0]["topic_id"], 1)

        first_agg = response_list[0]
        self.assertIn("doc_title", first_agg)
        self.assertIn("topic_annotations", first_agg)
        self.assertIn("judges", first_agg)
        self.assertIn("annotation_job", first_agg["topic_annotations"][0])

        self.assertEqual(len(first_agg["topic_annotations"]), 2)
        self.assertEqual(len(first_agg["judges"]), 2)

    # ---------- test for update_aggregated_annotation ----------------- #

    def test_update_aggregated_annotation(self):
        self.before_each()

        ## create request with valid update
        request_body = json.dumps({
            'is_gold_standard': False,
            'is_in_agreement': False
        })
        response = self.client.post("/aggregated_annotations/" + str(self.aggregated_annotations[0].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        agg_result = response.json["aggregated_annotation"]
        self.assertFalse(agg_result["is_gold_standard"])
        self.assertFalse(agg_result["is_in_agreement"])
        self.assertTrue(agg_result["is_active_for_gold_annotation"])

        # check that update occurred
        updated_agg = db_session_users.query(AggregatedAnnotations)\
                                      .filter_by(id=self.aggregated_annotations[0].id)\
                                      .first()
        self.assertFalse(updated_agg.is_gold_standard)
        self.assertFalse(updated_agg.is_in_agreement)
        self.assertTrue(updated_agg.is_active_for_gold_annotation)


        ## create request with valid update
        request_body = json.dumps({
            'topic_id': 7
        })
        response = self.client.post("/aggregated_annotations/" + str(self.aggregated_annotations[1].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        agg_result = response.json["aggregated_annotation"]
        self.assertEqual(agg_result["topic_id"], 7)

        # check that topic_id was changed
        updated_agg = db_session_users.query(AggregatedAnnotations)\
                                      .filter_by(id=self.aggregated_annotations[1].id)\
                                      .first()
        self.assertEqual(updated_agg.topic_id, 7)


        ## create request with invalid update
        request_body = json.dumps({
            'topic_id': 100
        })
        response = self.client.post("/aggregated_annotations/" + str(self.aggregated_annotations[2].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        agg_result = response.json["aggregated_annotation"]
        self.assertEqual(agg_result["topic_id"], 1)

        # check that topic_id was not changed (topic_id was invalid)
        updated_agg = db_session_users.query(AggregatedAnnotations)\
                                      .filter_by(id=self.aggregated_annotations[2].id)\
                                      .first()
        self.assertEqual(updated_agg.topic_id, 1)


        ## create request to update notes
        request_body = json.dumps({
            'notes': "new and improved text"
        })
        response = self.client.post("/aggregated_annotations/" + str(self.aggregated_annotations[2].id),
                                    headers={'Authorization': self.admin_user_token}, data=request_body)
        # check response
        self.assert200(response)
        agg_result = response.json["aggregated_annotation"]
        self.assertEqual(agg_result["notes"], "new and improved text")

        # check that notes were changed
        updated_agg = db_session_users.query(AggregatedAnnotations)\
                                      .filter_by(id=self.aggregated_annotations[2].id)\
                                      .first()
        self.assertEqual(updated_agg.notes, "new and improved text")

    # ---------- test for update_research_mode_expanded_view ----------- #

    def test_update_research_mode_expanded_view(self):
        self.before_each()


        # check initial topic annotation
        initial_topic_ant = db_session_users.query(TopicAnnotation)\
                                            .filter_by(id=self.topic_annotations[0].id)\
                                            .first()
        self.assertTrue(initial_topic_ant.is_positive)
        self.assertIsNone(initial_topic_ant.admin_notes)
        self.assertEqual(initial_topic_ant.user_id, self.users[0].id)
        self.assertEqual(initial_topic_ant.details, {})

        # make update to topic_annotation
        request_body = json.dumps({
            'topic_annotation_id': self.topic_annotations[0].id,
            'topic_annotation_updates':
                {
                    "is_positive": False,
                    "user_id": self.users[1].id,
                    "admin_notes": 'this tation was SUPER hard bruh'
                }

        })
        response = self.client.post('/aggregated_annotations/research/' + str(self.aggregated_annotations[0].id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)

        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_topic_ant = db_session_users.query(TopicAnnotation)\
                                            .filter_by(id=self.topic_annotations[0].id)\
                                            .first()
        updated_ant_job = db_session_users.query(AnnotationJob)\
                                          .filter_by(id=self.jobs[0].id)\
                                          .first()

        self.assertFalse(updated_topic_ant.is_positive)
        self.assertEqual(updated_topic_ant.admin_notes, 'this tation was SUPER hard bruh')
        self.assertEqual(updated_topic_ant.user_id, self.users[1].id)
        self.assertEqual(updated_ant_job.user_id, self.users[1].id)

        self.assertNotEqual(updated_topic_ant.details, {})
        self.assertEqual(updated_topic_ant.details['previous_annotators'][0]['is_positive'], True)
        self.assertEqual(updated_topic_ant.details['previous_annotators'][0]['user_id'], self.users[0].id)


        # check initial annotation job (gold standard annotation_job) and initial agg_annotation containing this job
        initial_ant_job = db_session_users.query(AnnotationJob)\
                                          .filter_by(id=self.jobs[0].id)\
                                          .first()
        self.assertEqual(initial_ant_job.arbitrary_tags, ['tag_0'])
        self.assertIsNone(initial_ant_job.user_difficulty)
        self.assertEqual(initial_ant_job.annotation_task_id, self.tasks[0].id)
        self.assertEqual(self.aggregated_annotations[0].arbitrary_tags, ["tag_1", "tag_2"])
        self.assertEqual(self.aggregated_annotations[0].gold_difficulty, 'easy')


        # make update to annotation job for arbitrary_tags
        request_body = json.dumps({
            'topic_annotation_id': self.topic_annotations[0].id,
            'annotation_job_updates':
                {
                    'arbitrary_tags': ['tag2', 'NOT ALLOWED TAG']
                }
        })
        response = self.client.post('/aggregated_annotations/research/' + str(self.aggregated_annotations[0].id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_ant_job = db_session_users.query(AnnotationJob)\
                                          .filter_by(id=self.jobs[0].id)\
                                          .first()
        self.assertEqual(updated_ant_job.arbitrary_tags, ['tag2'])  # since other tag not in AnnotationTaskTopicGroup
        self.assertIsNone(updated_ant_job.user_difficulty)
        # check that aggregated_annotation[0] had arbitrary_tags updated as well
        db_session_users.refresh(self.aggregated_annotations[0])
        self.assertEqual(self.aggregated_annotations[0].arbitrary_tags, ['tag2'])

        # make second update to same annotation job for user_difficulty
        request_body = json.dumps({
            'topic_annotation_id': self.topic_annotations[0].id,
            'annotation_job_updates':
                {
                    'user_difficulty': 'medium'
                }
        })
        response = self.client.post('/aggregated_annotations/research/' + str(self.aggregated_annotations[0].id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_ant_job = db_session_users.query(AnnotationJob)\
                                          .filter_by(id=self.jobs[0].id)\
                                          .first()
        self.assertEqual(updated_ant_job.arbitrary_tags, ['tag2'])  # same as before
        self.assertEqual(updated_ant_job.user_difficulty, 'medium')  # update that occurred here
        # check that aggregated_annotation[0] had gold_difficulty updated as well
        db_session_users.refresh(self.aggregated_annotations[0])
        self.assertEqual(self.aggregated_annotations[0].gold_difficulty, 'medium')

        # make task that contains this job point to new task as its active task (which is in same task group)
        self.tasks[0].active_task_id = self.tasks[1].id
        db_session_users.add(self.tasks[0])
        db_session_users.commit()
        db_session_users.refresh(self.tasks[0])
        # update task group to no longer contain task that contains initial_ant_job (but does contain its active task)
        self.task_groups[0].annotation_task_ids = [self.tasks[1].id]
        db_session_users.add(self.task_groups[0])
        db_session_users.commit()
        db_session_users.refresh(self.task_groups[0])

        # do update to tags for job whose parent task no longer in task group (but whose active task is)
        request_body = json.dumps({
            'topic_annotation_id': self.topic_annotations[0].id,
            'annotation_job_updates':
                {
                    'arbitrary_tags': ['tag1', 'NOT ALLOWED TAG']
                }
        })
        response = self.client.post('/aggregated_annotations/research/' + str(self.aggregated_annotations[0].id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_ant_job = db_session_users.query(AnnotationJob)\
                                          .filter_by(id=self.jobs[0].id)\
                                          .first()
        self.assertEqual(updated_ant_job.arbitrary_tags, ['tag1'])  # since other tag not in AnnotationTaskTopicGroup

    # ---------- test for update_research_mode_gold_standard ----------- #

    def test_update_research_mode_gold_standard(self):
        self.before_each()


        agg_ant_id = self.aggregated_annotations[0].id  # id of aggregated_annotation used in test

        # confirm agg_ant with this id has correct initial arbitrary tags and gold_difficulty (set in agg_ant itself)
        self.assertEqual(self.aggregated_annotations[0].arbitrary_tags, ["tag_1", "tag_2"])
        self.assertEqual(self.aggregated_annotations[0].gold_difficulty, "easy")

        # give annotation job for next request a user_difficulty value
        self.jobs[1].user_difficulty = 'hard'

        # make gold standard update that points to new topic_annotation
        # (this aggregated_annotation originally pointed to self.topic_annotations[0] as gold standard)
        request_body = json.dumps({
            'topic_annotation_id': self.topic_annotations[1].id
        })
        response = self.client.post('/aggregated_annotations/gold/' + str(agg_ant_id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)

        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_agg_ant = db_session_users.query(AggregatedAnnotations)\
                                          .filter_by(id=agg_ant_id)\
                                          .first()
        self.assertEqual(updated_agg_ant.gold_topic_annotation_id, self.topic_annotations[1].id)
        self.assertTrue(updated_agg_ant.is_gold_standard)
        # check that aggregated_annotation now has tags and difficulty from new gold standard job
        self.assertEqual(updated_agg_ant.arbitrary_tags, ['tag_1'])
        self.assertEqual(updated_agg_ant.gold_difficulty, 'hard')


        # make second update that points to None (so now aggregated_annotation is no longer a gold standard)
        request_body = json.dumps({
            'topic_annotation_id': None
        })
        response = self.client.post('/aggregated_annotations/gold/' + str(agg_ant_id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_agg_ant = db_session_users.query(AggregatedAnnotations)\
                                          .filter_by(id=agg_ant_id)\
                                          .first()
        self.assertIsNone(updated_agg_ant.gold_topic_annotation_id)
        self.assertFalse(updated_agg_ant.is_gold_standard)
        # check that agg_annotation now has no arbitrary_tags or gold_difficulty
        self.assertEqual(updated_agg_ant.arbitrary_tags, [])
        self.assertIsNone(updated_agg_ant.gold_difficulty)

        # make third update that points to new topic_annotation_id (so aggregated_annotation is again a gold standard)
        request_body = json.dumps({
            'topic_annotation_id': self.topic_annotations[2].id
        })
        response = self.client.post('/aggregated_annotations/gold/' + str(agg_ant_id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)
        # check response
        self.assert200(response)
        self.assertTrue(response.json['success'])
        # check that update occurred
        updated_agg_ant = db_session_users.query(AggregatedAnnotations)\
                                          .filter_by(id=agg_ant_id)\
                                          .first()
        self.assertEqual(updated_agg_ant.gold_topic_annotation_id, self.topic_annotations[2].id)
        self.assertTrue(updated_agg_ant.is_gold_standard)
        # check that the arbitrary_tags and gold_difficulty are from the third annotation_job
        self.assertEqual(updated_agg_ant.arbitrary_tags, ['tag_2'])
        self.assertIsNone(updated_agg_ant.gold_difficulty)  # self.jobs[2] had user_difficulty=None
