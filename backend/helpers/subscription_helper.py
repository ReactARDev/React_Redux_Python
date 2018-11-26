import json
import stripe
from flask import jsonify
import datetime
from dateutil.relativedelta import relativedelta
from settings import STRIPE_SECRET_KEY
from models import db_session_users, Customer, Plan, Subscription, User, Invoice, Payment_Event
from helpers.emailhelper import EmailHelper
from smtplib import SMTPException
from flask import g

email_helper = EmailHelper()
stripe.api_key = STRIPE_SECRET_KEY

def serializeClass(obj):
    new_json = json.dumps(obj, sort_keys=True, indent=2)
    return json.loads(new_json)

# for sending email errors
def error_response(msg, code=400):
    response = jsonify({
        'error': msg,
    })
    response.status_code = code
    return response

def deactivate_subscriptions(user_id):
    # a user should have only 1 current subscription at a time
    latest_subscriptions = db_session_users.query(Subscription).filter_by(user_id=user_id, latest=True).all()
    if latest_subscriptions is not None:
        for latest_subscription in latest_subscriptions:
            latest_subscription.latest = False
            latest_subscription.status = Subscription.INACTIVE_STATUS
            latest_subscription.end_date = datetime.datetime.utcnow()
            db_session_users.add(latest_subscription)
            db_session_users.commit()
            db_session_users.refresh(latest_subscription)

def start_free_trial(user_id):
    stripe_id = 'free_trial'
    free_trial = db_session_users.query(Plan).filter_by(stripe_id=stripe_id).first()

    subscription_for_db = {
        'user_id': user_id,
        'stripe_id': free_trial.stripe_id,
        'plan_id': free_trial.id,
        'latest': True,
        'start_date': datetime.datetime.utcnow(),
        'expiration_date': get_default_expiration_date(free_trial),
        'status': 'active'
    }
    subscription_for_db = Subscription(subscription_for_db)
    deactivate_subscriptions(user_id)
    db_session_users.add(subscription_for_db)
    db_session_users.commit()
    db_session_users.refresh(subscription_for_db)

def post_subscribe_customer(user_id, user_email, params):
    stripe_response = params.get('stripe_response', None)
    charge_token = stripe_response['id']
    plan = params.get('plan', None)
    plan_from_db = db_session_users.query(Plan).filter_by(stripe_id=plan).first()
    payment_type = params.get('payment_type', None)
    mild_error = 'Your subscription purchase was not successful and your card was not charged. Please refresh the page and enter your payment details again or contact your bank. You can also reach out to us for help at billing@compliance.ai.'
    severe_error = "Congrats! Your subscription has been paid and is in process. Please refresh the page, continue to use the app, and we'll update your subscription details soon."
    existing_subscription_error = 'You already have a subscription. Please reach out to us for help at billing@compliance.ai.'
    if not plan_from_db:
        # invalid plan
        return jsonify({'errors': mild_error}), 409
    # check for stripe customer and that user not subscribed to stripe.
    existing_stripe_customer = db_session_users.query(Customer).filter_by(user_id=user_id).first()
    existing_stripe_subscription = db_session_users.query(Subscription).filter_by(user_id=user_id, payment_type='stripe', latest=True).first()

    if existing_stripe_subscription is not None:
        if existing_stripe_customer is None:
            # This user already has a stripe subscription but is not a Stripe customer.
            return jsonify({'errors': existing_subscription_error}), 409
        else:
            # This user already is a stripe customer and has a stripe subscription.
            return jsonify({'errors': existing_subscription_error}), 409

    if existing_stripe_customer is None:
        # create stripe customer
        try:
            customer = stripe.Customer.create(
                description='compliance.ai customer',
                source=charge_token
            )
            stripe_customer_id = customer['id'] #customer_id (stripe_id) should be unique
            customer_for_db = {
                'user_id': user_id,
                'stripe_id': stripe_customer_id,
                'properties': serializeClass(customer)
            }
        except stripe.error.CardError as e:
            # Since it's a decline, stripe.error.CardError will be caught
            body = e.json_body
            err  = body['error']

            print "Status is: %s" % e.http_status
            print "Type is: %s" % err['type']
            print "Code is: %s" % err['code']
            # param is '' in this case
            print "Param is: %s" % err['param']
            print "Message is: %s" % err['message']
            return jsonify({'errors': "There is an error with your card: %s" % err['message']}), 409
        except Exception as e:
            print 'error creating stripe customer', e
            return jsonify({'errors': mild_error}), 409

        # add customer to db
        try:
            class_for_db = Customer(customer_for_db)
            db_session_users.add(class_for_db)
            db_session_users.commit()
        except:
            # delete stripe customer - this also deletes any latest stripe subscriptions a customer may have
            try:
                cu = stripe.Customer.retrieve(stripe_customer_id)
                cu.delete()
            except Exception as e:
                print 'unable to delete stripe customer', e
            return jsonify({'errors': mild_error}), 409

    else:
        stripe_customer_id = existing_stripe_customer.stripe_id

    # create stripe subscription
    try:
        subscription = stripe.Subscription.create(
            customer=stripe_customer_id,
            plan=plan
        )
    except stripe.error.CardError as e:
        # Since it's a decline, stripe.error.CardError will be caught
        body = e.json_body
        err  = body['error']

        print "Status is: %s" % e.http_status
        print "Type is: %s" % err['type']
        print "Code is: %s" % err['code']
        # param is '' in this case
        print "Param is: %s" % err['param']
        print "Message is: %s" % err['message']
        return jsonify({'errors': "There is an error with your card: %s" % err['message']}), 409

    except Exception as e:
        print 'error creating stripe subscription', e
        return jsonify({'errors': mild_error}), 409

    try:
        # a user should have only 1 latest subscription at a time
        deactivate_subscriptions(user_id) # TODO add this to subscription write to db to avoid edge case problems

        plan_id = plan_from_db.id
        subscription_for_db = {
            'user_id': user_id,
            'stripe_id': subscription['id'],
            'plan_id': plan_id,
            'latest': True,
            'status': 'active',
            'start_date': datetime.datetime.utcnow(),
            'payment_type': payment_type,
            'properties': serializeClass(subscription),
            'period_count': 1
        }
        db_session_users.add(Subscription(subscription_for_db))
        db_session_users.commit()
        return jsonify({'subscription': 'Customer is subscribed'})
    except Exception as e:
        print 'error writing subscriber to db. The following stripe subscription was made and should be dealt with manually on stripe:', subscription
        # is there a stripe method to immediately cancel subscription without charging customer. if so, put it here. stripe docs don't indicate this is possible????
        try:
            email_helper.send_email(
                'billing@compliance.ai',
                'billing@compliance.ai',
                'Urgent: Subscription Error',
                template='feedback-inline',
                vars={'feedback': 'A subscription was created for this user (user_id='+str(user_id)+') but the subscription failed to write to the database. Handle the subscription in the stripe dashboard. Here is the subscription from stripe:'+str(json.dumps(subscription, sort_keys=True, indent=2))+'.  Here is the error writing to the db: '+str(e),
                      'User_first_name': 'complaibot',
                      'User_last_name': 'complaibot', },
            )
        except SMTPException as e:
            return error_response('Could not send error email.', code=500)
        return jsonify({'errors': severe_error}), 409

def get_subscriptions(user_id):
    subscriptions = db_session_users.query(Subscription).filter_by(user_id=user_id).join(Plan, Subscription.plan_id==Plan.id).values(
            Subscription.created_at,
            Subscription.latest,
            Subscription.user_id,
            Subscription.payment_type,
            Subscription.start_date,
            Subscription.end_date,
            Subscription.status,
            Subscription.period_count,
            Subscription.expiration_date,
            Plan.name,
            Plan.category,
            Plan.stripe_id,
            Plan.price,
            Plan.price_period)

    stripe_subscription = db_session_users.query(Subscription).filter_by(user_id=user_id, payment_type='stripe', latest=True).first()
    if stripe_subscription:
        stripe_sub = stripe.Subscription.retrieve(stripe_subscription.stripe_id)
        next_bill_date = stripe_sub['current_period_end']

    else: next_bill_date = ''
    results = []
    for created_at, latest, user_id, payment_type,  start_date, end_date, status, period_count, expiration_date, name, category, stripe_id, price, price_period in subscriptions:
        results.append({
            'created_at': created_at,
            'latest': latest,
            'user_id': user_id,
            'payment_type': payment_type,
            'start_date': start_date,
            'end_date': end_date,
            'status': status,
            'period_count': period_count,
            'expiration_date': expiration_date,
            'name': name,
            'category': category,
            'stripe_id': stripe_id,
            'price': price,
            'price_period': price_period,
            'next_bill_date': next_bill_date

        })

    return {
        'subscriptions': results
    }

def handle_payment_event(event):
    payment_event_for_db = Payment_Event({
        'stripe_id': event.id,
        'properties': serializeClass(event)
    })
    db_session_users.add(payment_event_for_db)
    db_session_users.commit()
    db_session_users.refresh(payment_event_for_db)
    return {'event': 'event received'}


def handle_request_invoice(user_id, params):
    plan = params.get('plan', None)
    plan_from_db = db_session_users.query(Plan).filter_by(stripe_id=plan).first()
    if not plan_from_db:
        return 'Invalid plan'
    plan_name = plan_from_db.name
    plan_id = plan_from_db.id
    current_user = db_session_users.query(User).filter_by(id=user_id).first()
    message = current_user.first_name + ' '+current_user.last_name+' is requesting to pay by invoice for the '+ plan_name + ' subscription. '+current_user.first_name +', the team at Compliance.ai will respond to your request soon!'
    try:
        email_helper.send_email(
            'billing@compliance.ai',
            current_user.email,
            'Invoice request from ' + current_user.first_name,
            template='feedback-inline',
            vars={'feedback': message,
                  'User_first_name': current_user.first_name,
                  'User_last_name': current_user.last_name, },
        )
    except SMTPException as e:
        return error_response('Could not send invoice email.', code=500)

    invoice_for_db = {
        'user_id': user_id,
        'plan_id': plan_id,
        'status': 'requested'
    }
    invoice_for_db = Invoice(invoice_for_db)
    db_session_users.add(invoice_for_db)
    db_session_users.commit()
    db_session_users.refresh(invoice_for_db)
    return {'invoice':'invoice request sent'}

def subscribe_users_to_plan(user_ids, plan_stripe_id, payment_type=None, modified_by_user_id=None):
    if not (payment_type == 'invoice' or payment_type == 'stripe' or payment_type == None):
        return 'please use a valid payment_type'
    for user_id in user_ids:
        user = db_session_users.query(User).filter_by(id=user_id).first()
        if user is None:
            return "user doesn't exist"
        plan = db_session_users.query(Plan).filter_by(stripe_id=plan_stripe_id).first()
        if plan is None:
            return 'please use a valid plan'
        subscription_for_db = {
                'user_id': user_id,
                'stripe_id': plan.stripe_id,
                'plan_id': plan.id,
                'latest': True,
                'start_date': datetime.datetime.utcnow(),
                'status': 'active'
            }
        if modified_by_user_id is not None:
            subscription_for_db['modified_by_user_id'] = modified_by_user_id
        if payment_type == 'invoice' or payment_type == 'invoice':
            subscription_for_db['payment_type'] = payment_type
        else:
            # currently only free_trials have exiration dates.  all other plans are recurring
            subscription_for_db['expiration_date'] =  get_default_expiration_date(plan)

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

def get_all_subscriptions():
    all_subscriptions = db_session_users.query(Subscription).filter_by(latest=True) \
    .join(User, Subscription.user_id==User.id) \
    .join(Plan, Subscription.plan_id==Plan.id) \
    .values(
        Subscription.id,
        User.id,
        Plan.id,
        User.first_name,
        User.last_name,
        User.email,
        User.roles,
        Plan.name,
        Subscription.created_at,
        Subscription.payment_type,
        Subscription.expiration_date,
        Subscription.status,
        Subscription.status_reason,
        Subscription.notes,
        Subscription.end_date,
        Subscription.suspension_date
        )

    results = []
    for subscription_id, user_id, plan_id, first_name, last_name, email, roles, plan_name, start_date, payment_type,\
    expiration_date, status, status_reason, notes, end_date, suspension_date in all_subscriptions:
        results.append({
            'subscription_id': subscription_id,
            'user_id': user_id,
            'plan_id': plan_id,
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'roles': roles,
            'plan_name': plan_name,
            'start_date': start_date,
            'payment_type': payment_type,
            'expiration_date': expiration_date,
            'status': status,
            'status_reason': status_reason,
            'notes': notes,
            'end_date': end_date,
            'suspension_date': suspension_date
        })

    return {
        'all_subscriptions': results
    }

def get_subscription_period_count(subscription):
    plan = db_session_users().query(Plan).filter_by(id=subscription.plan_id).first()
    if not plan.recurring:
        return
    period_count = 1
    # the period is in terms of months
    period = plan.price_period
    today = datetime.datetime.utcnow()
    prev_start = subscription.start_date
    next_start = prev_start + relativedelta(months=int(period))
    while( prev_start <= today) :
        if today >= prev_start and today < next_start:
            return period_count
        else:
            period_count += 1
            prev_start = next_start
            next_start = next_start + relativedelta(months=int(period))

def get_default_expiration_date(free_trial_plan):
    # curently, only free trials have a default expiration date.  every other plan is recurring.
    today = datetime.datetime.utcnow()
    base_days = 30 #free trials are in blocks of 30 days while other plans (strioe, etc.) are on a calendar month.
    days = free_trial_plan.price_period * base_days
    expiration_date = today + relativedelta(days=int(days))
    return expiration_date

def update_subscription(subscription_id, params):
    original_subscription = db_session_users.query(Subscription).filter_by(id=subscription_id).first()
    new_subscription_dict = original_subscription.__dict__
    today = datetime.datetime.utcnow()
    new_subscription_dict['latest'] = True
    new_subscription_dict['notes'] = None

    if 'expiration_date' in params:
        new_exiration_date = params['expiration_date']
        new_exiration_date_obj = datetime.datetime.strptime(new_exiration_date, "%Y-%m-%d")
        new_subscription_dict['expiration_date'] = new_exiration_date_obj
        # update status of subscription depending on new expiration date
        if new_exiration_date_obj < today or new_exiration_date_obj.date() == today.date():
            new_subscription_dict['status_reason'] = Subscription.EXPIRED_STATUS_REASON
            new_subscription_dict['status'] = Subscription.INACTIVE_STATUS
        elif new_subscription_dict['status'] != Subscription.ACTIVE_STATUS:
            new_subscription_dict['status_reason'] = Subscription.REACTIVATED_STATUS_REASON
            new_subscription_dict['status'] = Subscription.ACTIVE_STATUS

    if 'plan_id' in params:
        new_plan_id = params['plan_id']
        plan = db_session_users().query(Plan).filter_by(id=new_plan_id).first()
        if plan:
            new_subscription_dict['plan_id'] = new_plan_id
            new_subscription_dict['stripe_id'] = plan.stripe_id
            new_subscription_dict['start_date'] = datetime.datetime.utcnow()
            new_subscription_dict['status_reason'] = Subscription.REACTIVATED_STATUS_REASON
            new_subscription_dict['status'] = Subscription.ACTIVE_STATUS
            if plan.recurring:
                new_subscription_dict['expiration_date'] = None
            else:
                new_subscription_dict['expiration_date'] = get_default_expiration_date(plan)
        else:
            return {'errors': "Plan is not found"}

    if 'payment_type' in params:
        new_subscription_dict['payment_type'] = params['payment_type']
    if 'notes' in params:
        new_subscription_dict['notes'] = params['notes']

    new_subscription_dict['modified_by_user_id'] = g.user_id

    new_subscription = Subscription(new_subscription_dict)
    db_session_users.add(new_subscription)

    # deactivate old subscription
    deactivate_subscriptions(new_subscription_dict['user_id'])

    db_session_users.commit()
    db_session_users.refresh(new_subscription)

    return {'new_subscription': new_subscription.to_dict()}

def get_all_plans():
    plans = db_session_users.query(Plan).values(Plan.id, Plan.name)

    results = []
    for plan_id, plan_name in plans:
        results.append({
            'id': plan_id,
            'name': plan_name
        })

    return {
        'all_plans': results
    }
