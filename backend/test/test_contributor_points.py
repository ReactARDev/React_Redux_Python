import datetime as dt
from dateutil import tz
import json
import test_app
from schemas.base_users import UserContributorPoint, ContributorPointType
from helpers.contributor_points_helper import CONTRIBUTOR_TYPE_TEMPLATES
from test_app import db_session_users

class ContributorPointTypeTest(test_app.AppTest):
    def before_each(self, skip_user_entries=False):
        db_session_users.query(UserContributorPoint).delete()
        db_session_users.query(ContributorPointType).delete()
        self.contributor_point_types = []
        for contributor_type in CONTRIBUTOR_TYPE_TEMPLATES:
            self.contributor_point_types.append(ContributorPointType(contributor_type))

        if not skip_user_entries:
            # add one event for each type
            for s in self.contributor_point_types:
                s.user_contributor_points.append(UserContributorPoint({"user_id": self.user.id, 'num_points': s.points_per_action}))

                # for weekly/anytime frequencies, add another basic option
                if s.frequency != 'onboarding':
                    # add another recent option
                    s.user_contributor_points.append(
                        UserContributorPoint({"user_id": self.user.id, 'num_points': s.points_per_action}))

        db_session_users.add_all(self.contributor_point_types)
        db_session_users.commit()

        if not skip_user_entries:
            # add another option from a year ago for anytime/weekly types that will get ignored for weekly but returned for anytime
            for s in self.contributor_point_types:
                if s.frequency != 'onboarding':
                    one_year_ago = dt.datetime.now() - dt.timedelta(weeks=52)
                    ucp = UserContributorPoint({"user_id": self.user.id, 'num_points': s.points_per_action, 'contributor_point_type_id': s.id})
                    db_session_users.add(ucp)
                    db_session_users.commit()
                    ucp.created_at = one_year_ago  # n.b. need to do it like this to fudge the date
                    db_session_users.add(ucp)
                    db_session_users.commit()
                    db_session_users.refresh(ucp)

    def test_get_contributor_points(self):
        self.before_each()
        response = self.client.get("/contributor_points", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("contributor_points", response.json)
        self.assertIsInstance(response.json["contributor_points"], dict)
        frequency_multiplier_map = {'onboarding': 1, 'anytime': 3, 'weekly': 2}
        for frequency in ['onboarding', 'weekly', 'anytime']:
            base_number_for_this_frequency = len([c for c in self.contributor_point_types if c.frequency == frequency])
            self.assertIn(frequency, response.json["contributor_points"])
            self.assertIsInstance(response.json["contributor_points"][frequency], list)
            self.assertEqual(len(response.json["contributor_points"][frequency]), base_number_for_this_frequency * frequency_multiplier_map[frequency])

        self.assertIn("contributor_point_types", response.json)
        self.assertIsInstance(response.json["contributor_point_types"], list)
        self.assertEqual(len(response.json["contributor_point_types"]), len(self.contributor_point_types))

    def test_create_contributor_point_onboarding(self):
        self.before_each(skip_user_entries=True)
        short_name = 'loginpass'
        request_body = json.dumps({"short_name": short_name})
        response = self.client.post("/contributor_points", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['added'])

        cp = db_session_users.query(ContributorPointType).filter_by(short_name=short_name).first()
        ucp = db_session_users.query(UserContributorPoint).filter_by(user_id=self.user.id, contributor_point_type_id=cp.id).first()
        self.assertIsNotNone(ucp)

        # now try to add it a second time and verify there were no new entries written
        response = self.client.post("/contributor_points", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertFalse(response.json['added'])

        num_entries = db_session_users.query(UserContributorPoint).filter_by(user_id=self.user.id, contributor_point_type_id=cp.id).count()
        self.assertEqual(num_entries, 1)

        # now try and add it a third time for another user - it should work
        response = self.client.post("/contributor_points", headers={'Authorization': self.new_user_token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['added'])

        num_entries = db_session_users.query(UserContributorPoint).filter_by(user_id=self.new_user.id, contributor_point_type_id=cp.id).count()
        self.assertEqual(num_entries, 1)

    def test_create_contributor_point_weekly(self):
        self.before_each()
        short_name = 'rateresult'
        request_body = json.dumps({"short_name": short_name})
        cp = db_session_users.query(ContributorPointType).filter_by(short_name=short_name).first()
        today = dt.datetime.utcnow().date()
        beginning_of_today = dt.datetime(today.year, today.month, today.day, tzinfo=tz.tzutc())
        week_start = beginning_of_today - dt.timedelta(days=beginning_of_today.weekday())

        for x in range(3, 16):
            response = self.client.post("/contributor_points", headers={'Authorization': self.token}, data=request_body)
            self.assert200(response)
            self.assertTrue(response.json['added'])

            num_entries = db_session_users.query(UserContributorPoint) \
                .filter_by(user_id=self.user.id, contributor_point_type_id=cp.id) \
                .filter(UserContributorPoint.created_at > week_start).count()
            self.assertEqual(num_entries, x)

        # now try to add it a 16th time and verify there were no new entries written
        response = self.client.post("/contributor_points", headers={'Authorization': self.token}, data=request_body)
        self.assert200(response)
        self.assertFalse(response.json['added'])

        num_entries = db_session_users.query(UserContributorPoint)\
            .filter_by(user_id=self.user.id, contributor_point_type_id=cp.id)\
            .filter(UserContributorPoint.created_at > week_start).count()
        self.assertEqual(num_entries, 15)

        # now try and add it once again for another user
        response = self.client.post("/contributor_points", headers={'Authorization': self.new_user_token}, data=request_body)
        self.assert200(response)
        self.assertTrue(response.json['added'])

        num_entries = db_session_users.query(UserContributorPoint)\
            .filter_by(user_id=self.new_user.id, contributor_point_type_id=cp.id)\
            .filter(UserContributorPoint.created_at > week_start).count()
        self.assertEqual(num_entries, 1)

    def test_create_contributor_point_anytime(self):
        self.before_each()
        short_name = 'reportprob'
        request_body = json.dumps({"short_name": short_name})
        cp = db_session_users.query(ContributorPointType).filter_by(short_name=short_name).first()
        # add up to 25 as a shallow confirmation that there is no limit on this one
        for x in range(4, 25):
            response = self.client.post("/contributor_points", headers={'Authorization': self.token}, data=request_body)
            self.assert200(response)
            self.assertTrue(response.json['added'])

            num_entries = db_session_users.query(UserContributorPoint) \
                .filter_by(user_id=self.user.id, contributor_point_type_id=cp.id).count()
            self.assertEqual(num_entries, x)