import os
import sys
from collections import defaultdict
from sqlalchemy.sql.functions import coalesce
this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')
from models import *

topic_id_name_mapping = {
    "1": 'Lending',
    "2": 'BSA/AML',
    "3": 'Mortgage Lending',
    "4": 'Crowdfunding',
    "5": 'FCPA',
    "6": 'Credit',
    "7": 'Deposits',
    "8": 'Bank Operations',
    "9": 'Insurance',
    "10": 'Privacy',
    "11": 'Securities',
    "12": 'Trust',
    "13": 'Payments',
    "14": 'Cybersecurity',
    "15": 'Leasing',
    "16": 'Debt Collection',
    "17": 'Commercial Lending',
    "18": 'Consumer Lending',
    "19": 'Payday Loans',
}

all_followed_topic_ids = [t[0] for t in db_session_users.query(UserTopic.topic_id).distinct().all()]

topic_id_user_emails = defaultdict(list)

for topic_id in all_followed_topic_ids:
    user_ids = [u[0] for u in db_session_users.query(UserTopic.user_id).filter_by(topic_id=topic_id).distinct().all()]
    user_emails = [u[0] for u in db_session_users.query(User.email).filter(User.id.in_(user_ids))
        .filter(coalesce(User.is_internal_user, False) != True).distinct().all()]
    topic_id_user_emails[str(topic_id)] = user_emails

for topic_id, user_emails in topic_id_user_emails.items():
    print(topic_id_name_mapping[topic_id])
    print(", ".join(user_emails))