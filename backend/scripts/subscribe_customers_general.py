from models import *
import schemas.jurasticsearch as jsearch
from helpers.subscription_helper import deactivate_subscriptions

# this function is to be run manually
def subscribe_to_plan(user_ids, plan_stripe_id, payment_type=None):
    if not (payment_type == 'invoice' or payment_type == 'stripe' or payment_type == None):
        return 'please use a valid payment_type'
    for user_id in user_ids:
        user = db_session_users.query(User).filter_by(id=user_id).first()
        if user is None:
            return "user doesn't exist"
        plan = db_session_users.query(Plan).filter_by(stripe_id=plan_stripe_id).first()
        if plan is None:
            return 'please use a valid plan'
        if payment_type != 'free':
            subscription_for_db = {
                    'user_id': user_id,
                    'stripe_id': plan.stripe_id,
                    'plan_id': plan.id,
                    'active': True,
                    'payment_type': payment_type
                }
        else:
            subscription_for_db = {
                    'user_id': user_id,
                    'stripe_id': plan.stripe_id,
                    'plan_id': plan.id,
                    'active': True,
                }
        try:
            deactivate_subscriptions(user_id)
        except:
            return 'unable to deactivate existing subscriptions'
        try:
            subscription_for_db = Subscription(subscription_for_db)
            db_session_users.add(subscription_for_db)
            db_session_users.commit()
        except:
            return 'unable to post subscription to database'

# example code to be run:
# subscribe_to_plan([1, 2], 'pro_annual_recur', 'invoice')
