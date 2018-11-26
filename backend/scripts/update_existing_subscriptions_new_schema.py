import os
import sys
import datetime
from dateutil.relativedelta import relativedelta
this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')
from helpers.subscription_helper import deactivate_subscriptions, get_subscription_period_count
from models import *

# this script runs through all the subscriptions in the database and populates fields that were added in the recent schema migration
allSubscriptions = db_session_users.query(Subscription).all()
today = datetime.datetime.utcnow()

for subscription in allSubscriptions:
    subscription.start_date = subscription.created_at
    if subscription.latest:
        plan = db_session_users().query(Plan).filter_by(id=subscription.plan_id).first()
        if not plan.recurring:
            # currently, only free trials are not recurring
            base_days = 30 #free trials are in blocks of 30 days while other plans (strioe, etc.) are on a calendar month.
            days = plan.price_period * base_days
            expiration_date = subscription.created_at + relativedelta(days=int(days))
            subscription.expiration_date = expiration_date
            if expiration_date <= today:
                subscription.status = 'inactive'
                subscription.status_reason = 'expired'
            else:
                subscription.status = 'active'
        else:
            subscription.status = 'active'

        db_session_users.add(subscription)
        db_session_users.commit()
