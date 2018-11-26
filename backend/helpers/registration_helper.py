import urllib
from flask import jsonify, g
import datetime
import jwt
from settings import SECRET_JWT
from elasticsearch import NotFoundError
from smtplib import SMTPException
from sqlalchemy.exc import IntegrityError

from models import *
import schemas.jurasticsearch as jsearch
from settings import API_BOUND_HOST, API_PORT, BASE_URL_FOR_EMAIL
from helpers.emailhelper import EmailHelper
from helpers.utilities import merge_two_dicts
from helpers.followed_entity_helper import updated_followed_entity, get_state_by_short_name
from helpers.subscription_helper import start_free_trial, subscribe_users_to_plan
from helpers.folder_helper import create_folder
from helpers.agency_helper import DefaultAgenciesToFollowAtSignup

email_helper = EmailHelper()


def _send_activation_email(mode, user_model):
    if BASE_URL_FOR_EMAIL:
        base_url = BASE_URL_FOR_EMAIL
    else:
        base_url = 'http://%s:%s' % (API_BOUND_HOST, API_PORT)

    activate_url = '%s/activate?email=%s&token=%s' % (
        base_url,
        urllib.quote_plus(user_model.email),
        urllib.quote_plus(user_model.reset_token)
    )

    if mode == 'activate':
        template = 'activate'
        subject = 'Please activate your Compliance.ai account'
    elif mode == 'reset':
        template = 'reset-inline'
        subject = 'Compliance.ai password reset request'
        activate_url += '&reset=1'
    elif mode == 'invite':
        template = 'invite-inline'
        subject = 'Activate your Compliance.ai account'
        activate_url += '&invite=1'
    elif mode == 'confirm':
        template = 'confirm-inline'
        subject = 'Confirm your Compliance.ai account'
        activate_url += '&confirm=1'

    template_vars = {
        'url': activate_url,
        'email': user_model.email,
        'base_url': base_url,
    }

    if template == 'confirm-inline':
        mandrill_recipient = [{
            'email': user_model.email,
            'name': user_model.first_name,
            'type': 'to'
        }]
        email_helper.send_via_mandrill(
            mandrill_recipient,
            'noreply@compliance.ai',
            'Compliance.ai',
            subject,
            template=template,
            vars=template_vars,
        )
    else:
        email_helper.send_email(
            user_model.email,
            'noreply@compliance.ai',
            subject,
            template=template,
            vars=template_vars,
        )

def activate_user(params):
    email = params.get('email')
    token = params.get('token')
    new_password = params.get('new_password')
    first_name = params.get('first_name')
    last_name = params.get('last_name')

    is_contributor = params.get('is_contributor')
    dry_run = params.get('dry_run', False)  # validate token, email, enabled state only

    linkedin_id = params.get('linkedin_id')
    google_id = params.get('google_id')
    enabled = params.get('enabled')

    # params to go into json field in db
    json_params = [
        'agencies', 'state_agencies',
        'other_agencies', 'other_state_agencies', 'other_topics',
        'user_style'
    ]

    def error_response(msg='Invalid email or token'):
        response = jsonify({
            'error': msg,
        })
        response.status_code = 400
        return response

    # confirmation_required variable tracks whether this is an activation sourced from a marketing campaign,
    # a signup withouot a token, or from the invite -> activate flow.
    # use confirmation_required to indicate we need to send a confirmation email later on
    confirmation_required = False
    marketing_campaign = db_session_users.query(MarketingCampaign).filter_by(token=token).first()
    if marketing_campaign is not None or token is None:
        confirmation_required = True
    else:
        if email is None:
            return error_response()
        else:
            email = email.lower()
            g.user_email = email

        user = db_session_users.query(User).filter_by(email=email).scalar()

        if user is None:
            return error_response()

        if dry_run and user.enabled:
            return error_response('User is already enabled')

        enabled_at_start = user.enabled

        if not user.reset_token or user.reset_token != token:
            # send an email to support, but only if the user is in the db to prevent spamming
            if dry_run:
                template_vars = {
                    'email': email,
                }
                email_helper.send_email(
                    'support@compliance.ai',
                    'noreply@compliance.ai',
                    'A user attempted to use an invalid token during activation',
                    template='activate-fail',
                    vars=template_vars,
                )

            return error_response()

    if dry_run:
        return jsonify({'marketing_campaign': marketing_campaign is not None})

    if not new_password:
        return error_response('Missing fields')

    # for the marketing campaign approach, create an entry in the users table,
    # for the invite-based registration approach, mark the user enabled
    if confirmation_required:
        email = email.lower()
        g.user_email = email

        # check if this user exists in the database (the invite use-case), so we can use the existing entry if so
        # and create a new entry if not
        user = db_session_users.query(User).filter_by(email=email).first()

        # this is for when a user comes to our site without being invited through the admin tool
        if user is None:
            user = User({
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'password': new_password,
                'enabled': False,
            })


        # this is for when the user is instead invited to our site, but then instead of trying to enter via the
        # invitation link, they use the regular user signup flow. they will now get the confirmation email
        # and have to fully activate their account there
        else:
            # triple check to prevent any shenanigans for enabled users, or user accounts
            # that somehow exist but were not invited, and also if the invite has already been skipped
            # and we have successfully moved onto the confirmation step
            # n.b. relying on hash values is a little funky here, but it seems to work
            if user.enabled or "invited_by" not in user.properties or "invite_skipped" in user.properties:
                return error_response()

            user.properties["invite_skipped"] = True  # n.b. record that the invite workflow was skipped
            user.first_name = first_name
            user.last_name = last_name
            user.update_password(new_password)

        if linkedin_id:
            user.linkedin = linkedin_id
            user.industry = params.get('industry')
            user.company = params.get('company')
            user.properties['linkedin_data'] = params.get('linkedin_data')
            user.enabled = enabled
            user.properties['confirmed_date'] = datetime.datetime.utcnow().isoformat()

        if google_id:
            user.google_id = google_id
            user.enabled = enabled
            user.properties['confirmed_date'] = datetime.datetime.utcnow().isoformat()

        # mark internal users with the internal user flag so we can differentiate user types when
        # calculating various stats
        if email.endswith("@jurispect.com") or email.endswith("@compliance.ai"):
            user.is_internal_user = True

        if marketing_campaign is not None:
            user.marketing_campaigns.append(marketing_campaign)
        user.gen_reset_token()

        enabled_at_start = False

        try:
            _send_activation_email('confirm', user)
        except SMTPException:
            db_session_users.rollback()
            return error_response('Could not send email', code=500)

    else:
        user.enabled = True

        user.update_password(new_password)
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name

        # only allow the token to be used once:
        user.reset_token = None

    new_props = {p: params[p] for p in json_params if params.get(p)}

    # n.b. since this route is shared with password resets, we need to skip updating the activation time
    # when it is a password reset action
    if not enabled_at_start:
        new_props['activation_time'] = datetime.datetime.utcnow().isoformat()

    if not params.get('user_style') and email.endswith('@firstrepublic.com'):
        new_props['user_style'] = 'first-republic'

    if len(new_props) > 0:
        user.properties = merge_two_dicts(user.properties, new_props)

    if is_contributor:
        user.roles = ['contributor']

    # FIXME: this is needed for marketing-campaign sourced users but yields a double commit
    # probably not super noticeable, but should fix if we have the time
    db_session_users.add(user)
    try:
        db_session_users.commit()
    except IntegrityError:
        return error_response()
    db_session_users.refresh(user)

    topic_ids = []
    topic_ids.extend(params.get('topics', AggregatedAnnotations.topic_id_name_mapping.keys()))
    for topic_id in topic_ids:
        userTopic = UserTopic({
            'user_id': user.id,
            'topic_id': topic_id,
            'following': True
        })
        db_session_users.add(userTopic)

    news_ids = [x['id'] for x in jsearch.query_records({'size': 1000}, doc_type='news_sources')]
    for news_id in news_ids:
        userFollowedEntity = UserFollowedEntity({
            'user_id': user.id,
            'entity_id': news_id,
            'entity_type': 'news_sources',
            'following': True
        })
        db_session_users.add(userFollowedEntity)

    agency_ids = []
    agency_ids.extend(params.get('agencies', []))

    new_ids = []

    # verify that the agency ids are correct
    # using DefaultAgenciesToFollowAtSignup since users now skip onboarding
    for agency_id in DefaultAgenciesToFollowAtSignup:
        try:
            agency = jsearch.get_record(agency_id, 'agencies')
            new_ids.append(agency['id'])
        except NotFoundError:
            pass

    for agency_id in new_ids:
        user_agency = UserAgency({'user_id': user.id, 'agency_id': agency_id, 'following': True})
        db_session_users.add(user_agency)

    state_jurisdictions = []
    state_jurisdictions.extend(params.get('state_agencies', []))
    state_ids = []

    # get selected state jurisdiction ids and add them to follow entity table
    for state_jurisdiction in state_jurisdictions:
        try:
            state = get_state_by_short_name('jurisdictions', state_jurisdiction)
            state_ids.append(state['id'])
        except NotFoundError:
            pass

    updated_followed_entity(user.id, {'entities': [{ 'entity_id': state_id, 'entity_type': 'jurisdictions', 'following': True } for state_id in state_ids]})

    # send a support mail if the user requests a new source
    other_agencies = params.get('other_agencies', '')
    other_state_agencies = params.get('other_state_agencies', '')
    other_topics = params.get('other_topics', '')

    if other_agencies or other_state_agencies or other_topics:
        template_vars = {
            'other_agencies': other_agencies,
            'other_state_agencies': other_state_agencies,
            'other_topics': other_topics,
            'name': '%s %s' % (first_name, last_name),
            'email': email,
        }
        email_helper.send_email(
            'support@compliance.ai',
            'noreply@compliance.ai',
            'A new user has requested additional sources or topics',
            template='additional-sources',
            vars=template_vars,
        )

    try:
        db_session_users.commit()
    except IntegrityError:
        return error_response()

    # start free trials.
    user = db_session_users.query(User).filter_by(email=email.lower()).first()
    latest_subscription = db_session_users.query(Subscription).filter_by(user_id=user.id, latest=True).first()
    if latest_subscription is None:
        # new users with .edu email get a 120 month free trial.
        if user.email.endswith('.edu'):
            subscribe_users_to_plan([user.id],'free_trial_120months')

        # all other users get a 1 month free trial
        else:
            start_free_trial(user.id)

    create_folder(user.id, {'name': 'Read'})
    create_folder(user.id, {'name': 'Bookmarked'})
    if confirmation_required:
        # special case login for unenabled marketing campaign users allow access for 7 days only
        expiration_datetime = datetime.datetime.utcnow() + datetime.timedelta(days=7)
        token = jwt.encode({'user_id': user.id, 'exp': expiration_datetime}, SECRET_JWT)
        # Flag 'is_new' defines if user is returning or just registered. True means just registered user
        return jsonify({"jwt_token": token, "is_new": True, 'email': email.lower()})
    else:
        # return empty if user not from marketing campaign
        return jsonify({})


def reset_password(params):
    email = params.get('email')

    # pretend it succeeded, so user accounts can't be probed this way
    if email is None:
        return jsonify({})
    else:
        email = email.lower()

    g.user_email = email
    user = db_session_users.query(User).filter_by(email=email).scalar()

    if user is None or not user.enabled:
        return jsonify({})

    user.gen_reset_token()

    try:
        _send_activation_email('reset', user)
    except SMTPException:
        db_session_users.rollback()
    else:
        db_session_users.add(user)
        db_session_users.commit()

    return jsonify({})

def invite_user(params, user_id):
    email = params.get('email')
    resend = params.get('resend', False)

    def error_response(msg, code=400):
        response = jsonify({
            'error': msg,
        })
        response.status_code = code
        return response

    current_user = db_session_users.query(User).filter_by(id=user_id).first()

    if not 'admin' in current_user.roles:
        return error_response('Only admin users can send invitations', code=403)

    if email is None:
        return error_response('Email must be specified')
    else:
        email = email.lower()

    if not EmailHelper.validate_email(email):
        return error_response('Domain is not allowed')

    user = db_session_users.query(User).filter_by(email=email).scalar()

    if user is None:
        user = User({
            'email': email,
            'enabled': False,
            'properties': {'invited_by': current_user.email},
        })

        # mark internal users with the internal user flag so we can differentiate user types when
        # calculating various stats
        if email.endswith("@jurispect.com") or email.endswith("@compliance.ai"):
            user.is_internal_user = True

        user.gen_reset_token()
    elif resend is True and user is not None:
        # Add resent email time to user properties to surface in the FE
        user.properties = merge_two_dicts(user.properties, { 'resent_invite_time': datetime.datetime.utcnow().isoformat() })

    elif resend is False:
        return error_response('User already exists')


    user.gen_reset_token()

    try:
        _send_activation_email('invite', user)
    except SMTPException:
        db_session_users.rollback()

        return error_response('Could not send email', code=500)

    response = jsonify({
        'success': True,
    })

    db_session_users.add(user)

    try:
        db_session_users.commit()
    except IntegrityError:
        return error_response('User already exists')

    return response

def confirm_user(params):
    def error_response(msg='Invalid email or token'):
        response = jsonify({
            'error': msg,
        })
        response.status_code = 400
        return response

    email = params.get('email')
    token = params.get('token')

    if email is None or token is None:
        return error_response()

    email = email.lower()
    g.user_email = email
    g.user_token = token

    user = db_session_users.query(User).filter_by(email=email).first()
    if user.enabled:
        return error_response('User is already enabled')

    if user.reset_token != token:
        return error_response()

    user.enabled = True
    user.reset_token = None  # once enabled, the token is done

    user.properties = merge_two_dicts(user.properties, {'confirmed_date': datetime.datetime.utcnow().isoformat() })

    db_session_users.add(user)
    db_session_users.commit()

    return jsonify({})

def check_email_in_use(params):
    def error_response(msg='Check email error'):
        response = jsonify({
            'error': msg,
        })
        response.status_code = 400
        return response


    email = params.get('email')
    if email is None:
        return error_response()

    email = email.lower()
    user = db_session_users.query(User).filter_by(email=email).first()
    return jsonify({'email_in_use': user is not None and user.password_hash is not None})

def send_confirm_email(params):
    def error_response(msg='Error: Email is not in use.'):
        response = jsonify({
            'error': msg,
        })
        response.status_code = 400
        return response

    if 'email' not in params:
        return error_response()

    email = params.get('email').lower()
    user = db_session_users.query(User).filter_by(email=email).first()

    if user is None or user.password_hash is None:
        return error_response()

    user.properties = merge_two_dicts(user.properties, {'confirmation_resent_time': datetime.datetime.utcnow().isoformat() })
    db_session_users.add(user)
    db_session_users.commit()

    try:
        _send_activation_email('confirm', user)
    except SMTPException:
        return error_response('Could not send email', code=500)
    return jsonify({'data': 'email sent'})

def pure_send_confirmation_email(user):

    user = db_session_users().query(User).filter_by(id=user.id).first()
    if user is not None:
        try:
            _send_activation_email('confirm', user)
            user.properties = merge_two_dicts(user.properties, {'recent_confirmation_email_success': True})
        except:
            email_helper.send_email(
                'support@compliance.ai',
                'noreply@compliance.ai',
                'error sending confirmation email during daily heroku script',
                template='feedback-inline',
                vars={'feedback':  'user (user_id='+str(user.id)+')  ' + user.email,
                      'User_first_name': 'complaibot',
                      'User_last_name': 'complaibot', },
            )
            user.properties = merge_two_dicts(user.properties, {'recent_confirmation_email_success': False})
        db_session_users.add(user)
        db_session_users.commit()

def link_secondary_signups(user):
    if not hasattr(user, 'linkedin_user_info') and not hasattr(user, 'google_user_info'):
        return

    # user exists in db but is using linkedin for the first times.
        # link accounts. account must have common email
    if hasattr(user, 'linkedin_user_info'):
        # linkedin is source of truth for name
        user.first_name = user.linkedin_user_info['first_name']
        user.last_name = user.linkedin_user_info['last_name']
        user.linkedin = user.linkedin_user_info['linkedin_id']
        user.industry = user.linkedin_user_info['industry']
        user.company = user.linkedin_user_info['company']

        if user.linkedin_user_info['is_contributor'] :
            user.roles.append('contributor')
        new_properties = {
            'linkedin_data': user.linkedin_user_info['linkedin_data'],
            'secondary_signup_dates': {'linkedin': datetime.datetime.utcnow().isoformat()}
        }

    if hasattr(user, 'google_user_info'):
        user.google_id = user.google_user_info['google_id']
        if not user.linkedin:
            # linkedin is source of truth for name
            user.first_name = user.google_user_info['first_name']
            user.last_name = user.google_user_info['last_name']
        if user.google_user_info['is_contributor']:
            user.roles.append('contributor')
        new_properties = {
        'secondary_signup_dates': {'google': datetime.datetime.utcnow().isoformat()}
        }

    if not user.enabled:
        user.enabled = True
        new_properties['confirmed_date'] = datetime.datetime.utcnow().isoformat()
    user.properties = merge_two_dicts(user.properties, new_properties)

    db_session_users.add(user)
    try:
        db_session_users.commit()
    except IntegrityError:
        return error_response()
    db_session_users.refresh(user)

################################################################
#                                                              #
################################################################
