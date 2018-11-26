import os
import sys
import datetime
this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')
from helpers.subscription_helper import deactivate_subscriptions, get_subscription_period_count
from models import *

# this script runs through all the subscriptions in the database and udpates fields
allSubscriptions = db_session_users.query(Subscription).all()
today = datetime.datetime.utcnow()

for subscription in allSubscriptions:
    # the case where admin gave user a pending subscription that starts in the future.
    if subscription.status == 'pending' and not subscription.latest and subscription.start_date and subscription.start_date.strftime("%m/%d/%Y") == today.strftime("%m/%d/%Y"):
        deactivate_subscriptions(subscription.user_id)
        subscription.latest = True
        subscription.status = 'active'
        db_session_users.add(subscription)
        db_session_users.commit()

    # expire expired subscriptions
    if subscription.latest and subscription.expiration_date and subscription.expiration_date <= today and (subscription.status_reason != 'expired' or subscription.status != 'inactive'):
        subscription.status_reason = 'expired'
        subscription.status = 'inactive'
        db_session_users.add(subscription)
        db_session_users.commit()

    # update the period_count of a RECURRING subscription
    plan = db_session_users().query(Plan).filter_by(id=subscription.plan_id).first()
    if subscription.latest and plan.recurring:
        new_period_count = get_subscription_period_count(subscription)
        if new_period_count != subscription.period_count:
            subscription.period_count = new_period_count
            db_session_users.add(subscription)
            db_session_users.commit()
