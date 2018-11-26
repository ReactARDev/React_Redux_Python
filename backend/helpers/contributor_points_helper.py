import datetime as dt
from dateutil import tz
from sqlalchemy.sql.functions import coalesce
from sqlalchemy import func, text
from sqlalchemy.orm import subqueryload

from models import *
import schemas.jurasticsearch as jsearch
from utilities import merge_two_dicts

# in these two cases, we want to retrieve all of the entries
FREQUENCIES_TO_GET_ALL_FOR = [ContributorPointType.ONBOARDING_FREQUENCY, ContributorPointType.ANYTIME_FREQUENCY]

def get_contributor_points(user_id):
    contributor_point_types = get_contributor_point_types()
    contributor_point_type_id_frequency_map = {c['id']: c['frequency'] for c in contributor_point_types}

    frequencies_for_contributor_type_subquery = db_session_users.query(ContributorPointType.id)\
        .filter(ContributorPointType.frequency.in_(FREQUENCIES_TO_GET_ALL_FOR)).subquery()
    all_points = db_session_users.query(UserContributorPoint).filter_by(user_id=user_id)\
        .filter(UserContributorPoint.contributor_point_type_id.in_(frequencies_for_contributor_type_subquery)).all()

    # get the first day of this month so we can restrict the results to just this month
    now = dt.datetime.now()
    first_day_of_month = str(now.month) + "/01/" + str(now.year)

    weekly_contributor_type_subquery = db_session_users.query(ContributorPointType.id)\
        .filter_by(frequency=ContributorPointType.WEEKLY_FREQUENCY).subquery()
    weekly_points = db_session_users.query(UserContributorPoint).filter_by(user_id=user_id)\
        .filter(UserContributorPoint.created_at > first_day_of_month)\
        .filter(UserContributorPoint.contributor_point_type_id.in_(weekly_contributor_type_subquery)).all()

    onboarding_points = [
        u.to_dict() for u in all_points if contributor_point_type_id_frequency_map[u.contributor_point_type_id] ==
        ContributorPointType.ONBOARDING_FREQUENCY
    ]

    anytime_points = [
        u.to_dict() for u in all_points if contributor_point_type_id_frequency_map[u.contributor_point_type_id] ==
        ContributorPointType.ANYTIME_FREQUENCY
    ]

    return {
        "contributor_points": {
            "onboarding": onboarding_points,
            "anytime": anytime_points,
            "weekly": [u.to_dict() for u in weekly_points],
        },
        "contributor_point_types": contributor_point_types
    }

def track_contributor_point(user_id, params):
    point_type_short_name = params['short_name']

    contributor_point_type = db_session_users.query(ContributorPointType).filter_by(short_name=point_type_short_name).first()

    if contributor_point_type.frequency == ContributorPointType.ONBOARDING_FREQUENCY:
        existing_count = db_session_users.query(UserContributorPoint)\
            .filter_by(contributor_point_type_id=contributor_point_type.id, user_id=user_id).count()
        if existing_count > 0:
            return False

    elif contributor_point_type.frequency == ContributorPointType.WEEKLY_FREQUENCY:
        # get the first day of this week so we can limit the number of entries written for any particular week
        today = dt.datetime.utcnow().date()
        beginning_of_today = dt.datetime(today.year, today.month, today.day, tzinfo=tz.tzutc())
        week_start = beginning_of_today - dt.timedelta(days=beginning_of_today.weekday())
        existing_count = db_session_users.query(UserContributorPoint)\
            .filter_by(contributor_point_type_id=contributor_point_type.id, user_id=user_id)\
            .filter(UserContributorPoint.created_at > week_start).count()
        if existing_count >= contributor_point_type.actions_per_week:
            return False

    # if it passes the onboarding/weekly constraints, or is of the anytime frequency, go ahead and create a new entry
    ucp = UserContributorPoint(contributor_point_type_id=contributor_point_type.id, user_id=user_id,
                               num_points=contributor_point_type.points_per_action)

    db_session_users.add(ucp)
    db_session_users.commit()
    return True



# class to memoize the contributor point types currently in our system
# note: the set of possible contributor point types changes very infrequently, so lets make the update interval every day
class ContributorPointMemoizer:
    def __init__(self):
        self.memoized_contributor_points = None
        self.last_memoized_time = None

    def get_contributor_point_types(self):
        if self.memoized_contributor_points is not None and self.last_memoized_time > dt.datetime.now() - dt.timedelta(days=1):
            return self.memoized_contributor_points
        else:
            self.last_memoized_time = dt.datetime.now()
            contributor_points_all = db_session_users.query(ContributorPointType).all()
            self.memoized_contributor_points = [c.to_dict() for c in contributor_points_all]
            return self.memoized_contributor_points

contributor_point_memoizer = ContributorPointMemoizer()
def get_contributor_point_types():
    return contributor_point_memoizer.get_contributor_point_types()

CONTRIBUTOR_TYPE_TEMPLATES = [
        {
            'short_name': 'loginpass',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Profile Set Up",
            'description': "Create login & password",
            'points_per_action': 5
        },
        {
            'short_name': 'fedsources',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Profile Set Up",
            'description': "Select Federal Sources",
            'points_per_action': 5,
        },
        {
            'short_name': 'statesources',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Profile Set Up",
            'description': "Select State Sources",
            'points_per_action': 5,
        },
        {
            'short_name': 'addtofolder',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Doc Actions",
            'description': "Add to folder",
            'points_per_action': 5,
        },
        {
            'short_name': 'emaildoc',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Doc Actions",
            'description': "Email",
            'points_per_action': 5,
        },
        {
            'short_name': 'printdoc',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Doc Actions",
            'description': "Print",
            'points_per_action': 5,
        },
        {
            'short_name': 'downloaddoc',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Doc Actions",
            'description': "Download",
            'points_per_action': 5,
        },
        {
            'short_name': 'exportcsv',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Doc Actions",
            'description': "Export to CSV",
            'points_per_action': 5,
        },
        {
            'short_name': 'bookmarkdoc',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Doc Actions",
            'description': "Bookmark",
            'points_per_action': 5,
        },
        {
            'short_name': 'createfolder',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "My Stuff",
            'description': "Create a folder",
            'points_per_action': 10,
        },
        {
            'short_name': 'saveasearch',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "My Stuff",
            'description': "Save a search",
            'points_per_action': 10,
        },
        {
            'short_name': 'firstsearch',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Search",
            'description': "First use of Search bar",
            'points_per_action': 10,
        },
        {
            'short_name': 'firststatecode',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Navigation",
            'description': "First use of State Code Navigator",
            'points_per_action': 5,
        },
        {
            'short_name': 'firstnewstab',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Navigation",
            'description': "First view of News tab",
            'points_per_action': 5,
        },
        {
            'short_name': 'firsttimeline',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Navigation",
            'description': "First view of Timeline",
            'points_per_action': 5,
        },
        {
            'short_name': 'updatefollowed',
            'frequency': ContributorPointType.ONBOARDING_FREQUENCY,
            'point_group_name': "Source Selection",
            'description': "First update of followed Sources",
            'points_per_action': 10,
        },
        {
            'short_name': 'reportprob',
            'frequency': ContributorPointType.ANYTIME_FREQUENCY,
            'point_group_name': "Feedback",
            'description': "Report a problem",
            'points_per_action': 5,
        },
        {
            'short_name': 'confirmedprob',
            'frequency': ContributorPointType.ANYTIME_FREQUENCY,
            'point_group_name': "Feedback",
            'description': "Confirmed a problem report",
            'points_per_action': 10,
        },
        {
            'short_name': 'submitfeedback',
            'frequency': ContributorPointType.ANYTIME_FREQUENCY,
            'point_group_name': "Feedback",
            'description': "Submit feedback",
            'points_per_action': 10,
        },
        {
            'short_name': 'actionablefeedback',
            'frequency': ContributorPointType.ANYTIME_FREQUENCY,
            'point_group_name': "Feedback",
            'description': "Actionable feedback",
            'points_per_action': 20,
        },
        {
            'short_name': 'sessionfreq',
            'frequency': ContributorPointType.WEEKLY_FREQUENCY,
            'point_group_name': "Engagement",
            'description': "Session frequency",
            'points_per_action': 15,
            'actions_per_week': 2,
            'points_per_month': 120
        },
        {
            'short_name': 'longsession',
            'frequency': ContributorPointType.WEEKLY_FREQUENCY,
            'point_group_name': "Engagement",
            'description': "Long session",
            'points_per_action': 20,
            'actions_per_week': 1,
            'points_per_month': 80
        },
        {
            'short_name': 'totalapptime',
            'frequency': ContributorPointType.WEEKLY_FREQUENCY,
            'point_group_name': "Engagement",
            'description': "Total time in app",
            'points_per_action': 25,
            'actions_per_week': 2,
            'points_per_month': 200
        },
        {
            'short_name': 'rateresult',
            'frequency': ContributorPointType.WEEKLY_FREQUENCY,
            'point_group_name': "Feedback",
            'description': "Rate a result",
            'points_per_action': 10,
            'actions_per_week': 15,
            'points_per_month': 600
        },
    ]


# helper method to create the current set of contributor point types
def seed_contributor_point_types():
    all_contributor_types = CONTRIBUTOR_TYPE_TEMPLATES

    for contributor_type in all_contributor_types:
        existing_entry = db_session_users.query(ContributorPointType).filter_by(short_name=contributor_type['short_name']).first()
        if existing_entry is None:
            db_session_users.add(ContributorPointType(contributor_type))

        # TODO add support for updates
    db_session_users.commit()
