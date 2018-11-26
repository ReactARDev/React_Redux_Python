import os
import sys
import json
import csv
import re
import requests
from sqlalchemy.orm import sessionmaker
import datetime

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')
from schemas import base_users as jorm_users
from settings import API_ENV
from add_default_user_tags import add_default_user_tags
from helpers.contributor_points_helper import seed_contributor_point_types

if API_ENV == 'production' or API_ENV == 'integration':
    print("Incorrect env setup, this script cannot be run on " + API_ENV)
    exit()

user = {
    'first_name': 'Jurispect',
    'last_name': 'Demo',
    'enabled': True,
    'email': 'demo@jurispect.com',
    'password': 'january13',
    'roles': ['admin']
}

word_cloud = json.loads(open('./test/fixtures/dodd_frank_word_cloud.json').read())

plans = [
    {
        'stripe_id': 'free_trial',
        'name': 'Free Trial - 1 month',
        'category': 'free_trial',
        'price': 0,
        'stripe_price': 000,
        'price_period': 1
    },
    {
        'stripe_id': 'free_trial_2months',
        'name': 'Free Trial - 2 months',
        'category': 'free_trial',
        'price': 0,
        'stripe_price': 000,
        'price_period': 2
    },
    {
        'stripe_id': 'free_trial_120months',
        'name': 'Free Trial - 120 months',
        'category': 'free_trial',
        'price': 0,
        'stripe_price': 000,
        'price_period': 120
    },
    {
        'stripe_id': 'pro_monthly_recur',
        'name': 'Professional Monthly Recurring',
        'category': 'paid',
        'price': 99,
        'stripe_price': 9900,
        'price_period': 1,
        'recurring': True
    },
    {
        'stripe_id': 'pro_annual_recur',
        'name': 'Professional Annual Recurring',
        'category': 'paid',
        'price': 1068,
        'stripe_price': 106800,
        'price_period': 12,
        'recurring': True
    },
    {
        'stripe_id': 'pro_annual_recur_preexisting',
        'name': 'Professional Annual Recurring - preexisiting paying users',
        'category': 'paid',
        'price_period': 12,
        'recurring': True
    },
    {
        'stripe_id': 'free_trial_extension',
        'name': 'Free Trial Extension - 1 month',
        'category': 'free_trial',
        'price': 0,
        'stripe_price': 000,
        'price_period': 1
    },
    {
        'stripe_id': 'free_trial_2months_extension',
        'name': 'Free Trial Extension - 2 months',
        'category': 'free_trial',
        'price': 0,
        'stripe_price': 000,
        'price_period': 2
    },
    {
        'stripe_id': 'contributor_monthly_recur',
        'name': 'Contributor - 1 month',
        'category': 'contributor',
        'price': 0,
        'stripe_price': 000,
        'price_period': 1,
        'recurring': True
    },
    {
        'stripe_id': 'team_annual_recur',
        'name': 'Team - 12 month',
        'category': 'team',
        'price': 0,
        'stripe_price': 000,
        'price_period': 12,
        'recurring': True
    },
    {
        'stripe_id': 'team_monthly_recur',
        'name': 'Team - 1 month',
        'category': 'team',
        'price': 0,
        'stripe_price': 000,
        'price_period': 1,
        'recurring': True
    },
    {
        'stripe_id': 'pro_monthly_oct_2017',
        'name': 'Professional Monthly Recurring Oct 2017',
        'category': 'paid',
        'price': 249,
        'stripe_price': 24900,
        'price_period': 1,
        'recurring': True
    },
    {
        'stripe_id': 'pro_annual_new_oct_2017',
        'name': 'Professional Annual Recurring Oct 2017',
        'category': 'paid',
        'price': 2388,
        'stripe_price': 238800,
        'price_period': 12,
        'recurring': True
    }
]

coupons = [
    {
        'name': '10%',
        'discount': .1
    },
    {
        'name': '10%',
        'discount': .15
    },
    {
        'name': '10%',
        'discount': .2
    },
    {
        'name': '10%',
        'discount': .25
    },
    {
        'name': '10%',
        'discount': .5
    },
    {
        'name': '10%',
        'discount': 1
    }
]

subscription = {
    'stripe_id': 'free_trial',
    'user_id': 1,
    'plan_id': 1,
    'latest': True,
    'start_date': datetime.datetime.utcnow(),
    'status': 'active'
}

insight_data = [
    {
        'slug': 'enforcement-action-12months',
        'name': 'enforcements_pie',
        'raw_data': {"table": [["agency", "count"], ["TREAS", 219], ["OCC", 109], ["NYSE", 63], ["CFPB", 394], ["FRS", 89], ["FDIC", 270], ["FTC", 208], ["SEC", 1885], ["FINRA", 1236]], "tuples": [["TREAS", 219], ["OCC", 109], ["NYSE", 63], ["CFPB", 394], ["FRS", 89], ["FDIC", 270], ["FTC", 208], ["SEC", 1885], ["FINRA", 1236]]},
        'csv_table': "agency,count\nTREAS,219\nOCC,109\nNYSE,63\nCFPB,394\nFRS,89\nFDIC,270\nFTC,208\nSEC,1885\nFINRA,1236"
    },
    {
        'slug': 'presidential-action-tracker',
        'name': 'executive_orders_by_potus',
        'raw_data': {"table": [["president", "count"], ["Donald Trump", 45], ["George Bush", 22], ["Lyndon B. Johnson", 36], ["William J. Clinton", 28], ["Harry S. Truman", 129], ["John F. Kennedy", 51], ["Gerald Ford", 49], ["Dwight D. Eisenhower", 56], ["Jimmy Carter", 42], ["George W. Bush", 25], ["Barack Obama", 22], ["Richard M. Nixon", 27], ["Ronald Reagan", 32]], "tuples": [["Donald Trump", 45], ["George Bush", 22], ["Lyndon B. Johnson", 36], ["William J. Clinton", 28], ["Harry S. Truman", 129], ["John F. Kennedy", 51], ["Gerald Ford", 49], ["Dwight D. Eisenhower", 56], ["Jimmy Carter", 42], ["George W. Bush", 25], ["Barack Obama", 22], ["Richard M. Nixon", 27], ["Ronald Reagan", 32]]},
        'csv_table': "president,count\nDonald Trump,45\nGeorge Bush,22\nLyndon B. Johnson,36\nWilliam J. Clinton,28\nHarry S. Truman,129\nJohn F. Kennedy,51\nGerald Ford,49\nDwight D. Eisenhower,56\nJimmy Carter,42\nGeorge W. Bush,25\nBarack Obama,22\nRichard M. Nixon,27\nRonald Reagan,32"
    },
    {
        'slug': 'final-and-proposed-rules',
        'name': 'rules_stacked_cols',
        'raw_data': {"table": [["agency", "Final Rule", "Proposed Rule"], ["FRS", 24, 8], ["CFPB", 18, 11], ["OCC", 10, 8], ["SEC", 25, 1198], ["FDIC", 9, 8]], "tuples": [["SEC", "Final Rule", 25], ["CFPB", "Proposed Rule", 11], ["FDIC", "Final Rule", 9], ["SEC", "Proposed Rule", 1198], ["CFPB", "Final Rule", 18], ["FDIC", "Proposed Rule", 8], ["OCC", "Proposed Rule", 8], ["FRS", "Proposed Rule", 8], ["OCC", "Final Rule", 10], ["FRS", "Final Rule", 24]]},
        'csv_table': "blahblah"
    },
    {
        'slug': 'busy-agencies',
        'name': 'agencies_stacked_cols',
        'raw_data': {"table": [["agency", "Agency Update", "Notice", "Enforcement", "Final Rule", "Enforcement Document", "SRO Update", "Proposed Rule", "News", "Enforcement Action", "Regulatory Agenda Item", "Enforcement Metadata"], ["FDIC", 0, 92, 116, 1, 0, 0, 3, 84, 0, 15, 0], ["FINRA", 5, 0, 558, 0, 0, 2, 0, 42, 0, 0, 0], ["OCC", 0, 23, 34, 0, 0, 0, 3, 92, 0, 13, 2], ["FTC", 16, 35, 49, 5, 0, 0, 5, 284, 0, 14, 0], ["FRS", 5, 183, 19, 6, 0, 0, 5, 213, 0, 22, 9], ["CFPB", 9, 20, 0, 9, 26, 0, 9, 125, 13, 19, 0], ["TREAS", 1, 156, 0, 17, 0, 0, 11, 131, 0, 322, 0], ["SEC", 219, 254, 684, 10, 0, 0, 815, 127, 0, 33, 0], ["NYSE", 678, 3, 39, 0, 0, 0, 110, 0, 0, 0, 0]], "tuples": [["FINRA", "Agency Update", 5], ["TREAS", "Final Rule", 17], ["FDIC", "News", 84], ["FRS", "Notice", 183], ["SEC", "Final Rule", 10], ["NYSE", "Notice", 3], ["FTC", "Notice", 35], ["CFPB", "Agency Update", 9], ["SEC", "News", 127], ["TREAS", "News", 131], ["OCC", "Notice", 23], ["CFPB", "Proposed Rule", 9], ["FDIC", "Final Rule", 1], ["FINRA", "Enforcement", 558], ["OCC", "Regulatory Agenda Item", 13], ["CFPB", "News", 125], ["SEC", "Agency Update", 219], ["TREAS", "Proposed Rule", 11], ["FTC", "Regulatory Agenda Item", 14], ["FDIC", "Enforcement", 116], ["SEC", "Proposed Rule", 815], ["TREAS", "Agency Update", 1], ["FINRA", "News", 42], ["FINRA", "SRO Update", 2], ["CFPB", "Final Rule", 9], ["SEC", "Enforcement", 684], ["FRS", "Regulatory Agenda Item", 22], ["FDIC", "Proposed Rule", 3], ["TREAS", "Regulatory Agenda Item", 322], ["CFPB", "Notice", 20], ["FTC", "Agency Update", 16], ["OCC", "Proposed Rule", 3], ["NYSE", "Enforcement", 39], ["CFPB", "Enforcement Document", 26], ["SEC", "Regulatory Agenda Item", 33], ["FRS", "Enforcement", 19], ["FTC", "Proposed Rule", 5], ["OCC", "Enforcement", 34], ["FRS", "Agency Update", 5], ["NYSE", "Proposed Rule", 110], ["NYSE", "Agency Update", 678], ["FDIC", "Regulatory Agenda Item", 15], ["FTC", "Enforcement", 49], ["CFPB", "Enforcement Action", 13], ["FRS", "Proposed Rule", 5], ["OCC", "Enforcement Metadata", 2], ["FDIC", "Notice", 92], ["FRS", "News", 213], ["FTC", "Final Rule", 5], ["FTC", "News", 284], ["SEC", "Notice", 254], ["CFPB", "Regulatory Agenda Item", 19], ["OCC", "News", 92], ["TREAS", "Notice", 156], ["FRS", "Enforcement Metadata", 9], ["FRS", "Final Rule", 6]]},
        'csv_table': "blahblah"
    },
]

folders = [
    {'name': 'Bookmarked', 'user_id': 1},
    {'name': 'Read', 'user_id': 1}
]


def add_users():
    session = jorm_users.UsersSession()
    session.add(jorm_users.User(user))
    session.commit()
    session.close()

def add_word_cloud():
    session = jorm_users.UsersSession()
    session.add(jorm_users.ActWordCount(word_cloud))
    session.commit()
    session.close()

def add_plans():
    session = jorm_users.UsersSession()
    for plan in plans:
        session.add(jorm_users.Plan(plan))
    session.commit()
    session.close()

def add_coupons():
    session = jorm_users.UsersSession()
    for coupon in coupons:
        session.add(jorm_users.Coupon(coupon))
    session.commit()
    session.close()

def add_subscription():
    session = jorm_users.UsersSession()
    session.add(jorm_users.Subscription(subscription))
    session.commit()
    session.close()

def add_insight_data():
    session = jorm_users.UsersSession()
    for datum in insight_data:
        session.add(jorm_users.InsightsTable(datum))
    session.commit()
    session.close()

def add_default_folders():
    session = jorm_users.UsersSession()
    for folder in folders:
        session.add(jorm_users.UserFolder(folder))
    session.commit()
    session.close()

if __name__ == "__main__":
    add_users()
    add_word_cloud()
    add_default_user_tags()
    add_plans()
    add_coupons()
    seed_contributor_point_types()
    add_subscription()
    add_insight_data()
    add_default_folders()
