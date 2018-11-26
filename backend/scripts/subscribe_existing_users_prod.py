from models import *
import schemas.jurasticsearch as jsearch

# # directions for running this:
# 1)in the api folder in terminal run: PYTHONSTARTUP=juriterm.py python
# 2)copy and paste the code into the python instance in terminal
# 3)run each function
# Note, after runnning, check to make sure that every user in the production database has a subscription.
    # I created the arrays below from this spreadsheet of users in the production db:  https://docs.google.com/spreadsheets/d/15jhc1KMuE98y0xXm1ctTHMvjtt6MRQJnN6X66upWwt0/edit?ts=596e8e45#gid=1451455781
    # cooridinate with product before running anything.

#if you want to run this on integration, change out the 3 user id arrays below.
two_month_trial_users = [ 309, 310, 481, 494, 135, 231, 242, 301, 234, 209, 115, 265, 266, 136, 267, 268, 269, 270, 271, 272, 172, 206, 273, 274, 275, 83, 139, 204, 133, 171, 138, 137, 101, 142, 237, 240, 241, 144, 245, 173, 203, 236, 244, 525, 211, 212, 286, 233, 260, 278, 249, 507, 559, 565 ]
onehundredtwenty_month_trial_users = [200, 143, 110]
paid_users = [ 190, 192, 191, 107, 108 ]

def start_free_trial_subscription(user_id, plan_stripe_id):
    plan = db_session_users.query(Plan).filter_by(stripe_id=plan_stripe_id).first()
    subscription_for_db = {
        'user_id': user_id,
        'stripe_id': plan.stripe_id,
        'plan_id': plan.id,
        'active': True
    }
    subscription_for_db = Subscription(subscription_for_db)
    db_session_users.add(subscription_for_db)
    db_session_users.commit()
    db_session_users.refresh(subscription_for_db)


def add_1month_trials():
    all_users = db_session_users.query(User).all()
    for user in  all_users:
        user_id = user.id
        if user_id not in two_month_trial_users and user_id not in onehundredtwenty_month_trial_users and user_id not in paid_users:
            start_free_trial_subscription(user_id, 'free_trial')

def add_2month_trials():
    for user_id in two_month_trial_users:
        user = db_session_users.query(User).filter_by(id=user_id).first()
        if user is not None:
            start_free_trial_subscription(user.id, 'free_trial_2months')

def add_120month_trials():
    for user_id in onehundredtwenty_month_trial_users:
        user = db_session_users.query(User).filter_by(id=user_id).first()
        if user is not None:
            start_free_trial_subscription(user.id, 'free_trial_120months')

def add_paid_subscriptions():
    for user_id in paid_users:
        user = db_session_users.query(User).filter_by(id=user_id).first()
        if user is not None:
            plan = db_session_users.query(Plan).filter_by(stripe_id='pro_annual_recur_preexisting').first()
            subscription_for_db = {
                'user_id': user_id,
                'stripe_id': plan.stripe_id,
                'plan_id': plan.id,
                'active': True,
                'payment_type': 'invoice'
            }
            subscription_for_db = Subscription(subscription_for_db)
            db_session_users.add(subscription_for_db)
            db_session_users.commit()
            db_session_users.refresh(subscription_for_db)

add_2month_trials()
add_120month_trials()
add_paid_subscriptions()
add_1month_trials()  # n.b. run this one last since it adds something to every other user
