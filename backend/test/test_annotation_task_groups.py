import json
import test_app
from schemas.base_users import AnnotationTask, AnnotationTaskTopicGroup, AnnotationJob,\
                               AnnotationTaskTermSamplingGroup, TopicAnnotation,\
                               AggregatedAnnotations
from test_app import db_session_users
import factories
import urllib


# NB: using urllib to encode queries as url strings


# NB: When an error of this form pops up:

# AssertionError: Popped wrong request context.
# (<RequestContext 'http://localhost/annotation_task_groups/50' [GET] of app> instead of
# <RequestContext 'http://localhost/' [GET] of app>)

# It is likely a known issue in flask and not a real error:
# https://stackoverflow.com/questions/26647032/py-test-to-test-flask-register-assertionerror-popped-wrong-request-context

# In such cases, ignore the "Popped wrong request context" error and fix other errors.


class AnnotationTaskGroupsTest(test_app.AppTest):

    # --------- setup and tests of setup functions ------------------------------------ #

    def before_each(self, with_annotations=False):
        # must delete tables in correct order to avoid key constraint error
        # see necessary ordering in test_annotation_tasks.py and test_annotation_jobs.py
        db_session_users.query(AggregatedAnnotations).delete()
        db_session_users.query(AnnotationTaskTermSamplingGroup).delete()
        db_session_users.query(TopicAnnotation).delete()
        db_session_users.query(AnnotationJob).delete()
        db_session_users.query(AnnotationTask).delete()
        db_session_users.query(AnnotationTaskTopicGroup).delete()

        # create AnnotationTask objects
        t1 = AnnotationTask({
            'name': 'bar',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            }
        })
        t2 = AnnotationTask({
            'name': 'foo',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            }
        })
        t3 = AnnotationTask({
            'name': 'fubar',
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
            }
        })

        self.tasks = [t1, t2, t3]

        # create annotation job objects
        self.jobs = []
        for i in xrange(1, 5):
            j1 = AnnotationJob({
                "user_id": 1,
                "doc_id": 1,
                "priority": 1.0,
                "user_difficulty": "easy",
                "is_gold_evaluation": True,
                "status": AnnotationJob.QUEUED_STATUS
            })
            j1.annotation_task = t1

            j2 = AnnotationJob({
                "user_id": 2,
                "doc_id": 2,
                "priority": 1.0,
                "user_difficulty": "medium",
                "is_gold_evaluation": False,
                "status": AnnotationJob.QUEUED_STATUS
            })
            j2.annotation_task = t2

            self.jobs.append(j1)
            self.jobs.append(j2)

        db_session_users.add_all(self.tasks)
        db_session_users.add_all(self.jobs)
        db_session_users.commit()
        # do refresh to get current ids of tasks
        for t in self.tasks:
            db_session_users.refresh(t)
        # do refresh to get current ids of jobs
        for j in self.jobs:
            db_session_users.refresh(j)

        # TODO: add a second AnnotationTaskGroup to test listing all groups functionality
        # create AnnotationTaskGroups object (first two tasks belong to group, third task does not)
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
        for tg in self.task_groups:
            db_session_users.refresh(tg)

        # refresh the AnnotationTasks in task_group above to point to that task group
        self.tasks[0].annotation_task_topic_group_id = self.task_groups[0].id
        self.tasks[1].annotation_task_topic_group_id = self.task_groups[0].id
        db_session_users.add_all(self.tasks[0:2])
        db_session_users.commit()
        for task in self.tasks[0:2]:
            db_session_users.refresh(task)

    def before_each_create_topic_annotations(self):

        # create topic annotations - linked to existing annotation_jobs in self.jobs
        self.topic_annotations = []
        for i, job in enumerate(self.jobs):
            ta = TopicAnnotation({
                'annotation_job_id': job.id,
                'doc_id': job.doc_id,
                'user_id': job.user_id,
                'is_positive': True if i < 4 else False,
                'annotation_task_id': job.annotation_task_id,
                'topic_name': 'Lending',
                'topic_id': 1,
                'is_gold_evaluation': job.is_gold_evaluation
            })
            ta.annotation_job = job
            ta.annotation_task = job.annotation_task
            self.topic_annotations.append(ta)
        db_session_users.add_all(self.topic_annotations)
        db_session_users.commit()
        for topic_annotation in self.topic_annotations:
            db_session_users.refresh(topic_annotation)

        # create gold annotations and their corresponding annotation jobs
        gold_job_1 = AnnotationJob({
            "user_id": 1,
            "doc_id": 1,
            "priority": 1.0,
            "user_difficulty": "hard",
            "status": AnnotationJob.QUEUED_STATUS
        })
        gold_job_2 = AnnotationJob({
            "user_id": 1,
            "doc_id": 3,
            "priority": 1.0,
            "user_difficulty": "hard",
            "status": AnnotationJob.QUEUED_STATUS
        })
        self.jobs.append(gold_job_1)
        self.jobs.append(gold_job_2)
        db_session_users.add_all([gold_job_1, gold_job_2])
        db_session_users.commit()
        for job in [gold_job_1, gold_job_2]:
            db_session_users.refresh(job)

        self.gold_annotations = []
        gold_1 = TopicAnnotation({
            'annotation_job_id': self.jobs[-2].id,
            'doc_id': self.jobs[-2].doc_id,
            'user_id': self.jobs[-2].user_id,
            'is_positive': True,
            'annotation_task_id': self.tasks[0].id,  # part of first task group
            'topic_name': 'Lending',
            'topic_id': 1,
            'is_gold_evaluation': True
        })
        gold_1.annotation_job = self.jobs[-2]

        gold_2 = TopicAnnotation({
            'annotation_job_id': self.jobs[-1].id,
            'doc_id': self.jobs[-1].doc_id,
            'user_id': self.jobs[-1].user_id,
            'is_positive': False,
            'annotation_task_id': self.tasks[0].id,  # part of first task group
            'topic_name': 'Lending',
            'topic_id': 1,
            'is_gold_evaluation': True
        })
        gold_2.annotation_job = self.jobs[-1]

        self.gold_annotations.append(gold_1)
        self.gold_annotations.append(gold_2)
        db_session_users.add_all(self.gold_annotations)
        db_session_users.commit()
        for gold_annotation in self.gold_annotations:
            db_session_users.refresh(gold_annotation)

        # create aggregated annotations
        # NB: AggregatedAnnotations object has foreign keys for annotation_task_group and topic_annotation
        self.aggregated_annotations = []
        agg_annotation_1 = AggregatedAnnotations({
                           'annotation_task_group_id': self.task_groups[0].id,
                           'doc_id': 1,
                           'topic_id': 1,
                           'is_gold_standard': True,
                           'gold_topic_annotation_id': self.gold_annotations[0].id,
                           'is_in_agreement': False,
                           'is_active_for_gold_annotation': True,
                           'gold_difficulty': "easy",
                           'arbitrary_tags': ["tag_1", "tag_2"],
                           'notes': "text_1"
        })
        agg_annotation_2 = AggregatedAnnotations({
                           'annotation_task_group_id': self.task_groups[0].id,
                           'doc_id': 2,
                           'topic_id': 1,
                           'is_gold_standard': True,
                           'gold_topic_annotation_id': self.gold_annotations[1].id,
                           'is_in_agreement': True,
                           'is_active_for_gold_annotation': True,
                           'gold_difficulty': "easy",
                           'arbitrary_tags': ["tag_1", "tag_2"],
                           'notes': "text_1"
        })
        self.aggregated_annotations.append(agg_annotation_1)
        self.aggregated_annotations.append(agg_annotation_2)
        db_session_users.add_all(self.aggregated_annotations)
        db_session_users.commit()
        for aggregated_annotation in self.aggregated_annotations:
            db_session_users.refresh(aggregated_annotation)

    def before_each_create_users_for_accuracy_testing(self):
        # create users and corresponding topic_annotations for different annotation accuracies
        #
        # New objects created here:
        #       0) self.new_gold_task_groups
        #       1) self.new_users
        #       2) self.gold_accuracy_annotations
        #       3) self.new_gold_aggregations
        #       4) self.rater_X_annotations (X keeps track of which user)
        #

        # create users - first one is "gold" user, rest are being evaluated
        self.new_users = []
        for i in xrange(4):
            new_user = factories.UserFactory.build()
            self.new_users.append(new_user)
        db_session_users.add_all(self.new_users)
        db_session_users.commit()
        for user in self.new_users:
            db_session_users.refresh(user)

        # create new annotation task topic groups
        # (not really used, but necessary for foreign key in aggregated_annotations)
        gold_task_group_lending = AnnotationTaskTopicGroup({
            'name': 'gold_task_group',
            'description': 'gold task group',
            'topic_id': 1,
            'annotation_task_ids': None,
            'arbitrary_tags': ["gold_tag_1", "gold_tag_2"],
            'gold_annotator_user_ids': [self.new_users[0].id]  # first user is gold annotator
        })
        gold_task_group_bsa_aml = AnnotationTaskTopicGroup({
            'name': 'gold_task_group',
            'description': 'gold task group',
            'topic_id': 2,
            'annotation_task_ids': None,
            'arbitrary_tags': ["gold_tag_", "gold_tag_2"],
            'gold_annotator_user_ids': [self.new_users[0].id]  # first user is gold annotator
        })
        gold_task_group_payday_lending = AnnotationTaskTopicGroup({
            'name': 'gold_task_group',
            'description': 'gold task group',
            'topic_id': 19,
            'annotation_task_ids': None,
            'arbitrary_tags': ["gold_tag_1", "gold_tag_2"],
            'gold_annotator_user_ids': [self.new_users[0].id]  # first user is gold annotator
        })
        self.new_gold_task_groups = [gold_task_group_lending, gold_task_group_bsa_aml, gold_task_group_payday_lending]
        db_session_users.add_all(self.new_gold_task_groups)
        db_session_users.commit()
        for group in self.new_gold_task_groups:
            db_session_users.refresh(group)

        # create gold annotations (all created by first new user made above)
        self.doc_ids = [500, 501, 502, 503]
        gold_acc_1 = TopicAnnotation({
            'user_id': self.new_users[0].id,
            'doc_id': self.doc_ids[0],
            'topic_id': 1,
            'topic_name': 'Lending',
            'is_positive': True,
            'is_gold_evaluation': False
        })
        gold_acc_2 = TopicAnnotation({
            'user_id': self.new_users[0].id,
            'doc_id': self.doc_ids[1],
            'topic_id': 1,
            'topic_name': 'Lending',
            'is_positive': False,
            'is_gold_evaluation': False
        })
        gold_acc_3 = TopicAnnotation({
            'user_id': self.new_users[0].id,
            'doc_id': self.doc_ids[2],
            'topic_id': 2,
            'topic_name': 'BSA/AML',
            'is_positive': True,
            'is_gold_evaluation': False
        })
        gold_acc_4 = TopicAnnotation({
            'user_id': self.new_users[0].id,
            'doc_id': self.doc_ids[3],
            'topic_id': 19,
            'topic_name': 'Payday Lending',
            'is_positive': True,
            'is_gold_evaluation': False
        })
        self.gold_accuracy_annotations = [gold_acc_1, gold_acc_2, gold_acc_3, gold_acc_4]
        db_session_users.add_all(self.gold_accuracy_annotations)
        db_session_users.commit()
        for item in self.gold_accuracy_annotations:
            db_session_users.refresh(item)

        # create aggregated_annotation entries for these gold annotations
        gold_acc_agg_annotation_1 = AggregatedAnnotations({
            'annotation_task_group_id': self.new_gold_task_groups[0].id,
            'doc_id': self.gold_accuracy_annotations[0].doc_id,
            'topic_id': self.gold_accuracy_annotations[0].topic_id,
            'is_gold_standard': True,
            'gold_topic_annotation_id': self.gold_accuracy_annotations[0].id,
            'is_in_agreement': True,
            'is_active_for_gold_annotation': True,
            'gold_difficulty': "easy",
            'arbitrary_tags': ["tag_1", "tag_2"],
            'notes': "text_1"
        })
        gold_acc_agg_annotation_2 = AggregatedAnnotations({
            'annotation_task_group_id': self.new_gold_task_groups[0].id,
            'doc_id': self.gold_accuracy_annotations[1].doc_id,
            'topic_id': self.gold_accuracy_annotations[1].topic_id,
            'is_gold_standard': True,
            'gold_topic_annotation_id': self.gold_accuracy_annotations[1].id,
            'is_in_agreement': True,
            'is_active_for_gold_annotation': True,
            'gold_difficulty': "medium",
            'arbitrary_tags': ["tag_3", "tag_4"],
            'notes': "text_2"
        })
        gold_acc_agg_annotation_3 = AggregatedAnnotations({
            'annotation_task_group_id': self.new_gold_task_groups[1].id,
            'doc_id': self.gold_accuracy_annotations[2].doc_id,
            'topic_id': self.gold_accuracy_annotations[2].topic_id,
            'is_gold_standard': True,
            'gold_topic_annotation_id': self.gold_accuracy_annotations[2].id,
            'is_in_agreement': True,
            'is_active_for_gold_annotation': True,
            'gold_difficulty': "hard",
            'arbitrary_tags': ["tag_5", "tag_6"],
            'notes': "text_3"
        })
        gold_acc_agg_annotation_4 = AggregatedAnnotations({
            'annotation_task_group_id': self.new_gold_task_groups[2].id,
            'doc_id': self.gold_accuracy_annotations[3].doc_id,
            'topic_id': self.gold_accuracy_annotations[3].topic_id,
            'is_gold_standard': True,
            'gold_topic_annotation_id': self.gold_accuracy_annotations[3].id,
            'is_in_agreement': True,
            'is_active_for_gold_annotation': True,
            'gold_difficulty': "hard",
            'arbitrary_tags': ["tag_7", "tag_8"],
            'notes': "text_4"
        })
        self.new_gold_aggregations = [gold_acc_agg_annotation_1, gold_acc_agg_annotation_2,
                                      gold_acc_agg_annotation_3, gold_acc_agg_annotation_4]
        db_session_users.add_all(self.new_gold_aggregations)
        db_session_users.commit()
        for agg in self.new_gold_aggregations:
            db_session_users.refresh(agg)

        # ---------------- create topic_annotations for each user ----------------------- #

        # correct annotations (in order) are True, False, True, True
        # (self.new_users[0] is the gold annotator)

        # For each user, just need to change 'user_id' and the rule for 'is_positive',
        # as well as name of list containing their annotations.
        # Can also change total number of annotations per topic at for-loop level.

        # ------------- self.new_users[1] - 40 annotations total ----------------------- #
        self.rater_1_annotations = []
        for i in xrange(10):
            ta_lending_1 = TopicAnnotation({
                'user_id': self.new_users[1].id,
                'doc_id': self.doc_ids[0],
                'topic_id': 1,
                'topic_name': 'Lending',
                'is_positive': True,  # 1.0 correct rate
                'is_gold_evaluation': True
            })
            ta_lending_2 = TopicAnnotation({
                'user_id': self.new_users[1].id,
                'doc_id': self.doc_ids[1],
                'topic_id': 1,
                'topic_name': 'Lending',
                'is_positive': True,  # 0.0 correct rate (0.5 rate overall for topic 'Lending')
                'is_gold_evaluation': True
            })
            ta_bsa_aml = TopicAnnotation({
                'user_id': self.new_users[1].id,
                'doc_id': self.doc_ids[2],
                'topic_id': 2,
                'topic_name': 'BSA/AML',
                'is_positive': True if i < 3 else False,  # 0.3 correct rate for bsa/aml
                'is_gold_evaluation': True
            })
            ta_payday_lending = TopicAnnotation({
                'user_id': self.new_users[1].id,
                'doc_id': self.doc_ids[3],
                'topic_id': 19,
                'topic_name': 'Payday Lending',
                'is_positive': False,  # 0.0 correct rate for payday lending
                'is_gold_evaluation': True
            })
            self.rater_1_annotations.append(ta_lending_1)
            self.rater_1_annotations.append(ta_lending_2)
            self.rater_1_annotations.append(ta_bsa_aml)
            self.rater_1_annotations.append(ta_payday_lending)

        db_session_users.add_all(self.rater_1_annotations)
        db_session_users.commit()
        for annotation in self.rater_1_annotations:
            db_session_users.refresh(annotation)

        # ------------- self.new_users[2] - 40 annotations total ----------------------- #
        # correct annotations (in order) are True, False, True, True
        self.rater_2_annotations = []
        for i in xrange(10):
            ta_lending_1 = TopicAnnotation({
                'user_id': self.new_users[2].id,
                'doc_id': self.doc_ids[0],
                'topic_id': 1,
                'topic_name': 'Lending',
                'is_positive': True if i < 5 else False,  # 0.5 correct rate
                'is_gold_evaluation': True
            })
            ta_lending_2 = TopicAnnotation({
                'user_id': self.new_users[2].id,
                'doc_id': self.doc_ids[1],
                'topic_id': 1,
                'topic_name': 'Lending',
                'is_positive': True,  # 0.0 correct rate (0.25 rate overall for topic 'Lending')
                'is_gold_evaluation': True
            })
            ta_bsa_aml = TopicAnnotation({
                'user_id': self.new_users[2].id,
                'doc_id': self.doc_ids[2],
                'topic_id': 2,
                'topic_name': 'BSA/AML',
                'is_positive': True if i < 9 else False,  # 0.9 correct rate for bsa/aml
                'is_gold_evaluation': True
            })
            ta_payday_lending = TopicAnnotation({
                'user_id': self.new_users[2].id,
                'doc_id': self.doc_ids[3],
                'topic_id': 19,
                'topic_name': 'Payday Lending',
                'is_positive': True if i < 2 else False,  # 0.2 correct rate for payday lending
                'is_gold_evaluation': True
            })
            self.rater_2_annotations.append(ta_lending_1)
            self.rater_2_annotations.append(ta_lending_2)
            self.rater_2_annotations.append(ta_bsa_aml)
            self.rater_2_annotations.append(ta_payday_lending)

        db_session_users.add_all(self.rater_2_annotations)
        db_session_users.commit()
        for annotation in self.rater_2_annotations:
            db_session_users.refresh(annotation)

        # ------------- self.new_users[3] - 40 annotations total ----------------------- #
        # correct annotations (in order) are True, False, True, True
        self.rater_3_annotations = []
        for i in xrange(10):
            ta_lending_1 = TopicAnnotation({
                'user_id': self.new_users[3].id,
                'doc_id': self.doc_ids[0],
                'topic_id': 1,
                'topic_name': 'Lending',
                'is_positive': True if i < 7 else False,  # 0.7 correct rate
                'is_gold_evaluation': True
            })
            ta_lending_2 = TopicAnnotation({
                'user_id': self.new_users[3].id,
                'doc_id': self.doc_ids[1],
                'topic_id': 1,
                'topic_name': 'Lending',
                'is_positive': True if i < 1 else False,  # 0.9 correct rate (0.8 rate overall for topic 'Lending')
                'is_gold_evaluation': True
            })
            ta_bsa_aml = TopicAnnotation({
                'user_id': self.new_users[3].id,
                'doc_id': self.doc_ids[2],
                'topic_id': 2,
                'topic_name': 'BSA/AML',
                'is_positive': True if i < 4 else False,  # 0.4 correct rate for bsa/aml
                'is_gold_evaluation': True
            })
            ta_payday_lending = TopicAnnotation({
                'user_id': self.new_users[3].id,
                'doc_id': self.doc_ids[3],
                'topic_id': 19,
                'topic_name': 'Payday Lending',
                'is_positive': True if i < 1 else False,  # 0.1 correct rate for payday lending
                'is_gold_evaluation': True
            })
            self.rater_3_annotations.append(ta_lending_1)
            self.rater_3_annotations.append(ta_lending_2)
            self.rater_3_annotations.append(ta_bsa_aml)
            self.rater_3_annotations.append(ta_payday_lending)

        db_session_users.add_all(self.rater_3_annotations)
        db_session_users.commit()
        for annotation in self.rater_3_annotations:
            db_session_users.refresh(annotation)

    def test_before_each_functions(self):

        # creates annotation tasks, annotation jobs and annotation task group
        self.before_each()

        self.assertEqual(len(self.task_groups), 1)  # one task group
        self.assertEqual(len(self.tasks), 3)  # 3 annotation_tasks
        self.assertEqual(len(self.jobs), 8)  # 8 annotation jobs

        # check that AnnotationTasks point to the task group that contains them
        self.assertEqual(self.tasks[0].annotation_task_topic_group_id, self.task_groups[0].id)
        self.assertEqual(self.tasks[1].annotation_task_topic_group_id, self.task_groups[0].id)
        self.assertEqual(self.tasks[2].annotation_task_topic_group_id, None)

        # creates topic annotations, gold aggregations and more jobs/tasks
        self.before_each_create_topic_annotations()

        self.assertEqual(len(self.task_groups), 1)  # still one task group
        self.assertEqual(len(self.tasks), 3)  # still three annotation tasks
        self.assertEqual(len(self.jobs), 10)  # 10 annotation_jobs (two new gold-related jobs created)
        self.assertEqual(len(self.topic_annotations), 8)  # 8 regular topic_annotations
        self.assertEqual(len(self.gold_annotations), 2),  # 2 gold topic_annotations
        self.assertEqual(len(self.aggregated_annotations), 2)  # 2 aggregated_annotations

        # check difficulty of annotation_jobs
        self.assertEqual(self.jobs[0].user_difficulty, 'easy')
        self.assertEqual(self.jobs[1].user_difficulty, 'medium')
        self.assertEqual(self.jobs[2].user_difficulty, 'easy')
        self.assertEqual(self.jobs[3].user_difficulty, 'medium')
        self.assertEqual(self.jobs[8].user_difficulty, 'hard')
        self.assertEqual(self.jobs[9].user_difficulty, 'hard')

        # check difficulty of topic_annotations through their pointer to annotation_jobs
        self.assertEqual(self.topic_annotations[0].annotation_job.user_difficulty, 'easy')
        self.assertEqual(self.topic_annotations[1].annotation_job.user_difficulty, 'medium')
        self.assertEqual(self.topic_annotations[2].annotation_job.user_difficulty, 'easy')
        self.assertEqual(self.topic_annotations[3].annotation_job.user_difficulty, 'medium')
        self.assertEqual(self.gold_annotations[0].annotation_job.user_difficulty, 'hard')
        self.assertEqual(self.gold_annotations[1].annotation_job.user_difficulty, 'hard')

        # check new gold users and annotations
        self.before_each_create_users_for_accuracy_testing()

        # check total number of annotations
        self.assertEqual(len(self.gold_accuracy_annotations), 4)
        self.assertEqual(len(self.rater_1_annotations), 40)
        self.assertEqual(len(self.rater_2_annotations), 40)
        self.assertEqual(len(self.rater_3_annotations), 40)

    # --------- tests of get_all_topic_annotations_in_group api routes ---------------------------------------- #

    def test_get_all_topic_annotations_in_group_all(self):
        # NB: requests for non-existent AnnotationTaskTopicGroups will return an error

        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations in task_group)
        query_string = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)
        response = self.client.get(query_string, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)

        first_dict = response_list[0]

        # check elements in first dictionary of response (should be topic_annotation dict with extra keys)
        self.assertIsInstance(first_dict, dict)
        self.assertIn('is_positive', first_dict)
        self.assertIn('user_difficulty', first_dict)
        self.assertIn('user_tags', first_dict)
        self.assertNotIn('gold_judgment', first_dict)  # because 'include_aggregated_annotation_info' not included
        self.assertNotIn('is_correct_judgment', first_dict)  # because include_aggregated_annotation_info not included

        # check that all topic_annotations in this task_group are returned
        self.assertEqual(len(response_list), len(self.topic_annotations) + len(self.gold_annotations))

        # create one more annotation_job/topic_annotation that is NOT in task_group
        # (will be 11 annotation_jobs and 9 topic_annotations total in db at this point)
        out_of_group_annotation_job = AnnotationJob({
            "user_id": 1,
            "doc_id": 1,
            "priority": 1.0,
            "status": AnnotationJob.QUEUED_STATUS
        })
        out_of_group_annotation_job.annotation_task = self.tasks[2]  # third task is not in task group
        self.jobs.append(out_of_group_annotation_job)
        db_session_users.add(out_of_group_annotation_job)
        db_session_users.commit()
        db_session_users.refresh(out_of_group_annotation_job)

        out_of_group_topic_annotation = TopicAnnotation({
            'annotation_job_id': self.jobs[-1].id,
            'doc_id': 1,
            'user_id': 1,
            'is_positive': True,
            'annotation_task_id': self.tasks[2].id,
            'topic_name': 'Lending',
            'topic_id': 1,
            'is_gold_evaluation': True
        })
        self.topic_annotations.append(out_of_group_topic_annotation)
        db_session_users.add(out_of_group_topic_annotation)
        db_session_users.commit()
        db_session_users.refresh(out_of_group_topic_annotation)

        # confirm there are now 11 annotation_jobs and 11 total topic annotations
        self.assertEqual(len(self.jobs), 11)
        self.assertEqual(len(self.topic_annotations) + len(self.gold_annotations), 11)

        # create request (return all topic_annotations)
        query_string = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)
        response = self.client.get(query_string, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # confirm response contains one less than total number of topic_annotations
        self.assertEqual(len(response_list), len(self.topic_annotations) + len(self.gold_annotations) - 1)
        self.assertEqual(len(response_list), 10)
        # confirm response topic_annotations all from tasks that are included in annotation_task_group
        for response_dict in response_list:
            self.assertIn(response_dict['annotation_task_id'], [self.tasks[0].id, self.tasks[1].id])
            self.assertNotIn(response_dict['annotation_task_id'], [self.tasks[2].id])

    def test_get_all_topic_annotations_in_group_filter_user_id(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations from user_id=1)
        query_dict = {'user_id': 1}
        query_string = urllib.urlencode(query_dict)

        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)

        first_dict = response_list[0]

        # check elements in first dictionary of response (should be topic_annotation dict with extra keys)
        self.assertIsInstance(first_dict, dict)
        self.assertIn('is_positive', first_dict)
        self.assertIn('user_difficulty', first_dict)
        self.assertIn('user_tags', first_dict)
        self.assertNotIn('gold_judgment', first_dict)  # because 'include_aggregated_annotation_info' not included
        self.assertNotIn('is_correct_judgment', first_dict)  # because include_aggregated_annotation_info not included

        # check that only topic_annotations with user_id=1 are returned
        self.assertEqual(len(response_list), 6)
        for item in response_list:
            self.assertEqual(item['user_id'], 1)

        # create request (return all topic_annotations from user_id=2)
        query_dict = {'user_id': 2}
        query_string = urllib.urlencode(query_dict)

        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check that only topic_annotations with user_id=2 are returned
        self.assertEqual(len(response_list), 4)
        for item in response_list:
            self.assertEqual(item['user_id'], 2)

    def test_get_all_topic_annotations_in_group_filter_difficulty(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations in group with filtering on difficulty=easy)
        query_dict = {'user_difficulty': 'easy'}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - should be 4 topic_annotations with "easy" difficulty
        self.assertEqual(len(response_list), 4)
        for item in response_list:
            self.assertEqual(item['user_difficulty'], 'easy')

        # create request (return all topic_annotations in group with filtering on difficulty=medium)
        query_dict = {'user_difficulty': 'medium'}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - should be 4 topic_annotations with "medium" difficulty
        self.assertEqual(len(response_list), 4)
        for item in response_list:
            self.assertEqual(item['user_difficulty'], 'medium')

        # create request (return all topic_annotations in group with filtering on difficulty=hard)
        query_dict = {'user_difficulty': 'hard'}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - should be 2 topic_annotations with "hard" difficulty
        self.assertEqual(len(response_list), 2)
        for item in response_list:
            self.assertEqual(item['user_difficulty'], 'hard')

    def test_get_all_topic_annotations_in_group_filter_is_gold_evaluation(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations in group with filtering on is_gold_evaluation=True)
        query_dict = {'is_gold_evaluation': True}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - 6 annotation_jobs/topic_annotations have is_gold_evaluation=True
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 6)
        for item in response_list:
            self.assertEqual(item['is_gold_evaluation'], True)

        # create request (return all topic_annotations in group with filtering on is_gold_evaluation=False)
        query_dict = {'is_gold_evaluation': False}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - 4 annotation_jobs/topic_annotations have is_gold_evaluation=True
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 4)
        for item in response_list:
            self.assertEqual(item['is_gold_evaluation'], False)

    def test_get_all_topic_annotations_in_group_sort_difficulty(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations in group with sorting on difficulty)
        query_dict = {'sorting': 'user_difficulty'}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 10)  # 10 total topic_annotations

        # check that topic_annotations are sorted on user_difficulty
        # there are 10 total topic_annotations, with 4 easy, 4 medium, and 2 hard
        # NB: the sorting in postgres queries does not appear to be alphabetical - order may be brittle
        for item in response_list[0:4]:
            self.assertEqual(item['user_difficulty'], 'easy')
        for item in response_list[4:6]:
            self.assertEqual(item['user_difficulty'], 'hard')
        for item in response_list[6:10]:
            self.assertEqual(item['user_difficulty'], 'medium')

    def test_get_all_topic_annotations_in_group_sort_is_correct_judgment(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations in group with sorting on is_correct_judgment)
        query_dict = {'sorting': 'is_correct_judgment',
                      'include_aggregated_annotation_info': True}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 10)  # 10 total topic_annotations

        # check order of response
        for item in response_list[0:4]:
            self.assertEqual(item['is_correct_judgment'], None)
        for item in response_list[4:6]:
            self.assertEqual(item['is_correct_judgment'], False)
        for item in response_list[6:10]:
            self.assertEqual(item['is_correct_judgment'], True)

    def test_get_all_topic_annotations_in_group_include_aggregated_annotation_info(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations, including gold info where available)
        query_dict = {'include_aggregated_annotation_info': True}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 10)  # 10 total topic_annotations

        # check that response dicts contain extra keys for aggregated_annotation info
        for item in response_list:
            self.assertIn('gold_judgment', item)
            self.assertIn('is_correct_judgment', item)

        # check that correct judgments are returned
        for item in response_list:
            # gold annotations available for these doc_ids under "Lending" topic
            if item['doc_id'] == 1:
                self.assertEqual(item['gold_judgment'], True)
                self.assertEqual(item['is_positive'] == True, item['is_correct_judgment'])
            elif item['doc_id'] == 3:
                self.assertEqual(item['gold_judgment'], False)
                self.assertEqual(item['is_positive'] == False, item['is_correct_judgment'])
            else:
                self.assertIsNone(item['gold_judgment'])
                self.assertIsNone(item['is_correct_judgment'])

    def test_get_all_topic_annotations_in_group_include_aggregated_annotation_info_filter_is_correct_judgment(self):
        self.before_each()
        self.before_each_create_topic_annotations()

        # create request (return all topic_annotations in group with filtering on is_correct_judgment=True and
        # with include_aggregated_annotation_info = True)
        query_dict = {'include_aggregated_annotation_info': True,
                      'is_correct_judgment': True}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - should have 4 responses (3 correct for doc_id=1, 1 correct for doc_id=3)
        # NB: the gold_annotation counts as one of the correct topic_annotations
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 4)

        # create request (return all topic_annotations in group with filtering on is_correct_judgment=False and
        # with include_aggregated_annotation_info = True)
        query_dict = {'include_aggregated_annotation_info': True,
                      'is_correct_judgment': False}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - should have 2 responses (2 incorrect for doc_id=1)
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 2)
        for item in response_list:
            self.assertEqual(item['doc_id'], 1)

        # create request (return all topic_annotations in group with filtering on is_correct_judgment=None and
        # with include_aggregated_annotation_info = True)
        query_dict = {'include_aggregated_annotation_info': True,
                      'is_correct_judgment': None}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/topic_annotations/' + str(self.task_groups[0].id)\
                    + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response - should have 4 responses (doc_id=2 has no gold_annotations)
        # NB: the gold_annotation counts as one of the correct topic_annotations
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 4)
        for item in response_list:
            self.assertEqual(item['doc_id'], 2)

    # --------- test of get_user_accuracies_for_topic_group api route ----------------------------------------- #

    def test_get_user_accuracy_for_group(self):
        self.before_each()
        self.before_each_create_users_for_accuracy_testing()

        # ------------------ first user ------------------------------------------------- #

        # create request for first user and lending topic
        query_dict = {'user_id': self.new_users[1].id,
                      'topic_id': 1}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 1)  # one (user, topic) pair

        self.assertEqual(response_list[0]['user_id'], self.new_users[1].id)
        self.assertEqual(response_list[0]['topic_id'], 1)
        self.assertEqual(response_list[0]['topic_name'], 'Lending')
        self.assertEqual(response_list[0]['gold_agreement_rate'], 0.5)  # user accuracy rate

        # create request for first user and bsa/aml topic
        query_dict = {'user_id': self.new_users[1].id,
                      'topic_id': 2}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 1)  # one (user, topic) pair

        self.assertEqual(response_list[0]['user_id'], self.new_users[1].id)
        self.assertEqual(response_list[0]['topic_id'], 2)
        self.assertEqual(response_list[0]['topic_name'], 'BSA/AML')
        self.assertEqual(response_list[0]['gold_agreement_rate'], 0.3)  # user accuracy rate

        # create request for first user and payday lending topic
        query_dict = {'user_id': self.new_users[1].id,
                      'topic_id': 19}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 1)  # one (user, topic) pair

        self.assertEqual(response_list[0]['user_id'], self.new_users[1].id)
        self.assertEqual(response_list[0]['topic_id'], 19)
        self.assertEqual(response_list[0]['topic_name'], 'Payday Lending')
        self.assertEqual(response_list[0]['gold_agreement_rate'], 0.0)  # user accuracy rate

        # create request for first user accuracy across all topics
        query_dict = {'user_id': self.new_users[1].id}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 3)  # three (user, topic) pairs, one for each topic (single user here)

        lending_dict = [d for d in response_list if d['topic_id'] == 1][0]
        bsa_dict = [d for d in response_list if d['topic_id'] == 2][0]
        payday_lending_dict = [d for d in response_list if d['topic_id'] == 19][0]

        # check that results gathered in bulk match those gathered on single topics
        self.assertEqual(lending_dict['gold_agreement_rate'], 0.5)  # 0.5 agreement rate for lending
        self.assertEqual(bsa_dict['gold_agreement_rate'], 0.3)  # 0.3 agreement rate for bsa/aml
        self.assertEqual(payday_lending_dict['gold_agreement_rate'], 0.0)  # 0.0 agreement rate for payday lending

        # ------------------ second user ------------------------------------------------- #

        # create request for second user and lending topic
        query_dict = {'user_id': self.new_users[2].id,
                      'topic_id': 1}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 1)  # one (user, topic) pair

        self.assertEqual(response_list[0]['user_id'], self.new_users[2].id)
        self.assertEqual(response_list[0]['topic_id'], 1)
        self.assertEqual(response_list[0]['topic_name'], 'Lending')
        self.assertEqual(response_list[0]['gold_agreement_rate'], 0.25)  # user accuracy rate

        # create request for second user and bsa/aml topic
        query_dict = {'user_id': self.new_users[2].id,
                      'topic_id': 2}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 1)  # one (user, topic) pair

        self.assertEqual(response_list[0]['user_id'], self.new_users[2].id)
        self.assertEqual(response_list[0]['topic_id'], 2)
        self.assertEqual(response_list[0]['topic_name'], 'BSA/AML')
        self.assertEqual(response_list[0]['gold_agreement_rate'], 0.9)  # user accuracy rate

        # create request for second user accuracy across all topics
        query_dict = {'user_id': self.new_users[2].id}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 3)  # three (user, topic) pairs, one for each topic (single user here)

        lending_dict = [d for d in response_list if d['topic_id'] == 1][0]
        bsa_dict = [d for d in response_list if d['topic_id'] == 2][0]
        payday_lending_dict = [d for d in response_list if d['topic_id'] == 19][0]

        # check that results gathered in bulk match those gathered on single topics
        self.assertEqual(lending_dict['gold_agreement_rate'], 0.25)  # 0.25 agreement rate for lending
        self.assertEqual(bsa_dict['gold_agreement_rate'], 0.9)  # 0.9 agreement rate for bsa/aml
        self.assertEqual(payday_lending_dict['gold_agreement_rate'], 0.2)  # 0.2 agreement rate for payday lending

        # ------------------ third user ------------------------------------------------- #

        # create request for third user and lending topic
        query_dict = {'user_id': self.new_users[3].id,
                      'topic_id': 1}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 1)  # one (user, topic) pair

        self.assertEqual(response_list[0]['user_id'], self.new_users[3].id)
        self.assertEqual(response_list[0]['topic_id'], 1)
        self.assertEqual(response_list[0]['topic_name'], 'Lending')
        self.assertEqual(response_list[0]['gold_agreement_rate'], 0.8)  # user accuracy rate

        # create request for third user accuracy across all topics
        query_dict = {'user_id': self.new_users[3].id}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 3)  # three (user, topic) pairs, one for each topic (single user here)

        lending_dict = [d for d in response_list if d['topic_id'] == 1][0]
        bsa_dict = [d for d in response_list if d['topic_id'] == 2][0]
        payday_lending_dict = [d for d in response_list if d['topic_id'] == 19][0]

        # check that results gathered in bulk match those gathered on single topics
        self.assertEqual(lending_dict['gold_agreement_rate'], 0.8)  # 0.8 agreement rate for lending
        self.assertEqual(bsa_dict['gold_agreement_rate'], 0.4)  # 0.4 agreement rate for bsa/aml
        self.assertEqual(payday_lending_dict['gold_agreement_rate'], 0.1)  # 0.1 agreement rate for payday lending

        # ------------------- all users for single topic ---------------------------------------- #

        # First user (self.new_users[0]) made gold annotations with is_gold_evaluation=False, so
        # their annotations are not pulled in for user statistics (only 3 users pulled in here).

        # create request to get all user accuracies for Lending topic (id=1)
        query_dict = {'topic_id': 1}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 3)  # three (user, topic) pairs, one for each topic

        # check that accuracies are as expected for Lending
        user_1_dict = [d for d in response_list if d['user_id'] == self.new_users[1].id][0]
        user_2_dict = [d for d in response_list if d['user_id'] == self.new_users[2].id][0]
        user_3_dict = [d for d in response_list if d['user_id'] == self.new_users[3].id][0]

        self.assertEqual(user_1_dict['gold_agreement_rate'], 0.5)
        self.assertEqual(user_2_dict['gold_agreement_rate'], 0.25)
        self.assertEqual(user_3_dict['gold_agreement_rate'], 0.8)

        # create request to get all user accuracies for BSA/AML topic (id=2)
        query_dict = {'topic_id': 2}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 3)  # three (user, topic) pairs, one for each topic

        # check that accuracies are as expected for Lending
        user_1_dict = [d for d in response_list if d['user_id'] == self.new_users[1].id][0]
        user_2_dict = [d for d in response_list if d['user_id'] == self.new_users[2].id][0]
        user_3_dict = [d for d in response_list if d['user_id'] == self.new_users[3].id][0]

        self.assertEqual(user_1_dict['gold_agreement_rate'], 0.3)
        self.assertEqual(user_2_dict['gold_agreement_rate'], 0.9)
        self.assertEqual(user_3_dict['gold_agreement_rate'], 0.4)

        # create request to get all user accuracies for Payday Lending topic (id=19)
        query_dict = {'topic_id': 19}
        query_string = urllib.urlencode(query_dict)
        query_url = '/annotation_task_groups/user_statistics' + '?' + query_string
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 3)  # three (user, topic) pairs, one for each topic

        # check that accuracies are as expected for Lending
        user_1_dict = [d for d in response_list if d['user_id'] == self.new_users[1].id][0]
        user_2_dict = [d for d in response_list if d['user_id'] == self.new_users[2].id][0]
        user_3_dict = [d for d in response_list if d['user_id'] == self.new_users[3].id][0]

        self.assertEqual(user_1_dict['gold_agreement_rate'], 0.0)
        self.assertEqual(user_2_dict['gold_agreement_rate'], 0.2)
        self.assertEqual(user_3_dict['gold_agreement_rate'], 0.1)

        # ------------------- all users and all topics ---------------------------------------- #

        # 3 users and 3 topics, should be 9 dictionaries returned total.

        # create request to get all user accuracies for Lending topic (id=1)
        query_url = '/annotation_task_groups/user_statistics'
        response = self.client.get(query_url, headers={'Authorization': self.admin_user_token})
        response_list = response.json

        # check response
        self.assert200(response)
        self.assertIsInstance(response.json, list)
        self.assertEqual(len(response_list), 9)  # 9 (user, topic) pairs, one for each topic and user

        # check that accuracies are as expected for each (user, topic) pair
        user_1_topic_1_dict = [d for d in response_list if d['user_id'] == self.new_users[1].id
                                                        and d['topic_id'] == 1][0]
        user_1_topic_2_dict = [d for d in response_list if d['user_id'] == self.new_users[1].id
                                                        and d['topic_id'] == 2][0]
        user_1_topic_19_dict = [d for d in response_list if d['user_id'] == self.new_users[1].id
                                                        and d['topic_id'] == 19][0]
        user_2_topic_1_dict = [d for d in response_list if d['user_id'] == self.new_users[2].id
                                                        and d['topic_id'] == 1][0]
        user_2_topic_2_dict = [d for d in response_list if d['user_id'] == self.new_users[2].id
                                                        and d['topic_id'] == 2][0]
        user_2_topic_19_dict = [d for d in response_list if d['user_id'] == self.new_users[2].id
                                                        and d['topic_id'] == 19][0]
        user_3_topic_1_dict = [d for d in response_list if d['user_id'] == self.new_users[3].id
                                                        and d['topic_id'] == 1][0]
        user_3_topic_2_dict = [d for d in response_list if d['user_id'] == self.new_users[3].id
                                                        and d['topic_id'] == 2][0]
        user_3_topic_19_dict = [d for d in response_list if d['user_id'] == self.new_users[3].id
                                                        and d['topic_id'] == 19][0]

        self.assertEqual(user_1_topic_1_dict['gold_agreement_rate'], 0.5)
        self.assertEqual(user_1_topic_2_dict['gold_agreement_rate'], 0.3)
        self.assertEqual(user_1_topic_19_dict['gold_agreement_rate'], 0.0)

        self.assertEqual(user_2_topic_1_dict['gold_agreement_rate'], 0.25)
        self.assertEqual(user_2_topic_2_dict['gold_agreement_rate'], 0.9)
        self.assertEqual(user_2_topic_19_dict['gold_agreement_rate'], 0.2)

        self.assertEqual(user_3_topic_1_dict['gold_agreement_rate'], 0.8)
        self.assertEqual(user_3_topic_2_dict['gold_agreement_rate'], 0.4)
        self.assertEqual(user_3_topic_19_dict['gold_agreement_rate'], 0.1)

    # --------- tests of CRUD api routes ----------------------------------------- #

    def test_get_all_annotation_task_groups(self):
        self.before_each()

        # create request
        request_body = json.dumps({})
        response = self.client.get('/annotation_task_groups',
                                   headers={'Authorization': self.admin_user_token},
                                   data=request_body)
        # check response
        self.assert200(response)
        self.assertIn("annotation_task_groups", response.json)
        self.assertIsInstance(response.json["annotation_task_groups"], list)
        self.assertEqual(len(response.json["annotation_task_groups"]), 1)

        # check that all available groups are listed
        annotation_task_group_list = response.json["annotation_task_groups"]
        self.assertEqual(len(annotation_task_group_list), 1)
        first_group = annotation_task_group_list[0]
        self.assertEqual(first_group["name"], "task_group_1")
        self.assertEqual(first_group["description"], "first task group")
        self.assertEqual(first_group["annotation_task_ids"], [self.tasks[0].id, self.tasks[1].id])
        self.assertEqual(first_group["arbitrary_tags"], ["tag1", "tag2"])
        self.assertIsInstance(response.json["annotation_task_groups"][0]['gold_annotator_user_ids'], list)

    def test_get_all_annotation_tasks_in_group(self):
        self.before_each()

        # create request for non-existing group
        # NB: hard-coding an unused annotation_task_group id at 50
        response = self.client.get('/annotation_task_groups/'+str(50),
                                   headers={'Authorization': self.admin_user_token})

        # check response for non-existing group
        self.assert400(response)
        self.assertIn("errors", response.json)
        self.assertEqual(response.json["errors"], 'This annotation task group does not exist')

        # create request for existing group
        response = self.client.get('/annotation_task_groups/' + str(self.task_groups[0].id),
                                    headers={'Authorization': self.admin_user_token})

        # check response for existing group
        self.assert200(response)
        self.assertIn("annotation_tasks_in_group", response.json)
        self.assertIn("total_tasks", response.json)
        self.assertIn("annotation_task_group_dict", response.json)
        self.assertIsInstance(response.json["total_tasks"], int)
        self.assertIsInstance(response.json["annotation_tasks_in_group"], list)
        self.assertIsInstance(response.json["annotation_task_group_dict"], dict)

        group_dict = response.json["annotation_task_group_dict"]
        self.assertIn("name", group_dict)
        self.assertEqual(group_dict["name"], "task_group_1")
        self.assertIn("arbitrary_tags", group_dict)
        self.assertEqual(group_dict["arbitrary_tags"], ["tag1", "tag2"])

        response_list = response.json["annotation_tasks_in_group"]
        self.assertEqual(len(response_list), len(self.task_groups[0].annotation_task_ids))
        self.assertIsInstance(response_list[0], dict)
        # check that correct annotation ids are included
        response_ids = [x["id"] for x in response_list]
        for id_index in self.task_groups[0].annotation_task_ids:
            self.assertIn(id_index, response_ids)

    def test_create_annotation_task_group(self):
        self.before_each()

        # create request
        request_body = json.dumps({
            'name': 'wat',
            'description': 'wat description',
            'annotation_task_ids': [1, 3],  # t1 has id 1 after added to users database, etc.
            'arbitrary_tags': ["tag1", "tag2"],
            'topic_id': 1
        })
        response = self.client.post('/annotation_task_groups',
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)

        # check response dict
        self.assert200(response)
        self.assertIsInstance(response.json, dict)
        self.assertEqual(len(response.json), 1)  # response is dict with 1 entry
        self.assertIn("annotation_task_group", response.json)

        # check annotation_task_groups to_dict method producing dictionary correctly
        task_group_result = response.json["annotation_task_group"]
        self.assertIsInstance(task_group_result, dict)
        for key in ["created_at", "updated_at", "name", "description"]:
            self.assertIsInstance(task_group_result[key], unicode)
        self.assertIsInstance(task_group_result["id"], int)
        self.assertIsInstance(task_group_result["annotation_task_ids"], list)
        self.assertEqual(task_group_result["annotation_task_ids"], [1,3])
        self.assertIsInstance(task_group_result["arbitrary_tags"], list)
        self.assertEqual(task_group_result["arbitrary_tags"], ["tag1", "tag2"])

    def test_update_annotation_task_group(self):
        """
        Check that update on non-existing task group works.
        Check that a generic update on an existing task group works.

        More specific update tests for updating specific fields appear in
        their own separate tests.
        """

        self.before_each()

        # create request for non-existing group
        # NB: hard-coding an unused annotation_task_group id at 50
        request_body = json.dumps(
                                  {'name': "excellent_new_name"}
                                 )
        response = self.client.post('/annotation_task_groups/'+str(50),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)

        # verify response for non-existing group
        self.assert400(response)
        self.assertIn("errors", response.json)
        self.assertEqual(response.json["errors"], 'This annotation task group does not exist')

        # check existing group's current name
        response_check_current_name = self.client.get('/annotation_task_groups/' + str(self.task_groups[0].id),
                                                      headers={'Authorization': self.admin_user_token})
        self.assert200(response_check_current_name)
        current_group_dict = response_check_current_name.json["annotation_task_group_dict"]
        self.assertEqual(current_group_dict["name"], self.task_groups[0].name)

        # create request for existing group
        request_body_existing = json.dumps(
                                  {"name": "excellent_new_name"}
                                 )
        response_existing = self.client.post('/annotation_task_groups/'+str(self.task_groups[0].id),
                                            headers={'Authorization': self.admin_user_token},
                                            data=request_body_existing)

        # check response
        self.assert200(response_existing)
        self.assertIn("annotation_task_group", response_existing.json)
        response_dict = response_existing.json["annotation_task_group"]
        self.assertIn("name", response_dict)
        self.assertIn("description", response_dict)
        self.assertIn("annotation_task_ids", response_dict)
        self.assertIn("arbitrary_tags", response_dict)
        self.assertIn("gold_annotator_user_ids", response_dict)
        self.assertIn("active_topic_annotation_model_id", response_dict)
        self.assertIsInstance(response_dict["annotation_task_ids"], list)
        self.assertIsInstance(response_dict["arbitrary_tags"], list)
        self.assertEqual("excellent_new_name", response_dict["name"])

        # verify update
        response_check_new_name = self.client.get('/annotation_task_groups/' + str(self.task_groups[0].id),
                                                  headers={'Authorization': self.admin_user_token})
        self.assert200(response_check_new_name)
        new_group_dict = response_check_new_name.json["annotation_task_group_dict"]
        self.assertEqual(new_group_dict["name"], "excellent_new_name")

    def test_delete_annotation_task_group(self):
        self.before_each()

        # create request for non-existing annotation_task_group
        # N.B: hardcoded non-existing index for now
        request_body = json.dumps({})
        response = self.client.delete('/annotation_task_groups/'+str(150),
                                      headers={'Authorization': self.admin_user_token},
                                      data=request_body)
        # check response for existing annotation_task_group
        self.assert400(response)
        self.assertIn("errors", response.json)
        self.assertEqual(response.json["errors"], 'This annotation task group does not exist')
        # make sure existing annotation_task_group is still there
        self.assertIsNotNone(db_session_users.query(AnnotationTaskTopicGroup).filter_by(id=self.task_groups[0].id).first())


        # create request for existing annotation_task_group
        request_body=json.dumps({})
        response = self.client.delete('/annotation_task_groups/'+str(self.task_groups[0].id),
                                      headers={'Authorization': self.admin_user_token},
                                      data=request_body)
        # check response for existing annotation_task_group
        self.assert200(response)
        self.assertTrue(response.json["success"])
        # make sure relevant annotation_task_group is deleted
        self.assertIsNone(db_session_users.query(AnnotationTaskTopicGroup).filter_by(id=self.task_groups[0].id).first())

    def test_annotation_task_update_active_task(self):
        self.before_each()

        old_task_id = self.tasks[0].id  # task to be updated
        old_ids = self.task_groups[0].annotation_task_ids

        # update self.tasks[0] in way that triggers new task pointer
        new_topics_dict = {
            'topics': {
                'banking': {'topic_id': 1, 'topic_table': 'topics'},
                'lending': {'topic_id': 2, 'topic_table': 'topics'},
                'fintech': {'topic_id': 3, 'topic_table': 'topics'},
                'payments': {'topic_id': 4, 'topic_table': 'topics'},
            }
        }
        request_body = json.dumps(new_topics_dict)
        response = self.client.post("/annotation_tasks/"+str(self.tasks[0].id),
                                    headers={'Authorization': self.admin_user_token},
                                    data=request_body)

        # check response from update (response should be dict from new task)
        self.assert200(response)
        self.assertIn("annotation_task", response.json)
        self.assertIsInstance(response.json["annotation_task"], dict)
        task_result = response.json["annotation_task"]
        self.assertEqual(task_result['name'], 'bar')
        self.assertEqual(task_result['status'], AnnotationTask.ACTIVE_STATUS)
        self.assertIsInstance(task_result['topics'], dict)
        for key in ['banking', 'lending', 'fintech', 'payments']:
            self.assertIn(key, task_result['topics'])
        self.assertNotEqual(self.tasks[0].id, task_result['id'])
        # for comparing new and old versions of this task
        new_task_id = task_result['id']

        # Check that annotation task group changes pointer to self.tasks[0].id
        # Should update ids from [self.tasks[0].id, self.tasks[1].id] to
        #                        [new_task_id, self.tasks[1]]
        new_group_response = self.client.get('/annotation_task_groups/' + str(self.task_groups[0].id),
                                             headers={'Authorization': self.admin_user_token})
        # sanity checks
        self.assert200(new_group_response)
        new_group_tasks = new_group_response.json["annotation_tasks_in_group"]
        self.assertEqual(len(new_group_tasks), len(self.task_groups[0].annotation_task_ids))
        # check ids - ids should be the same except for old_task_id switched to new_task_id
        new_ids = [x['id'] for x in new_group_tasks]
        self.assertIn(new_task_id, new_ids)
        self.assertIn(old_task_id, old_ids)
        self.assertNotIn(new_task_id, old_ids)
        self.assertNotIn(old_task_id, new_ids)

        # check that lists are otherwise the same
        new_ids_same = [id for id in new_ids if id != new_task_id]
        old_ids_same = [id for id in old_ids if id != old_task_id]
        self.assertEqual(sorted(new_ids_same), sorted(old_ids_same))
