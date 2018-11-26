from flask import g, jsonify
import datetime as dt
from models import *
from helpers.utilities import merge_two_dicts
from helpers.subscription_helper import subscribe_users_to_plan
from sqlalchemy.sql.functions import coalesce
import urllib
from settings import API_BOUND_HOST, API_PORT, BASE_URL_FOR_EMAIL
from helpers.emailhelper import EmailHelper
from helpers.delete_users import delete_users

email_helper = EmailHelper()

def get_external_user_id_subquery():
    return db_session_users.query(User.id).filter(coalesce(User.is_internal_user, False) != True).subquery()

def update_user_role(role_name, role_value, user):
    if role_value:
        if user.roles:
            if role_name not in user.roles:
                new_roles = list(user.roles)
                new_roles.append(role_name)
                user.roles = new_roles
        else:
            user.roles = [role_name]
    else:
        if user.roles:
             # remove role name, e.g. 'qa', from roles
             user.roles = [role for role in user.roles if role != role_name]

def update_user_details(email, params):
    user = db_session_users.query(User).filter_by(email=email).first()

    if g.admin_user:
        if 'isQA' in params:
            update_user_role('qa', params['isQA'], user)

        if 'isContributor' in params:
            update_user_role('contributor', params['isContributor'], user)

            if params['isContributor']:
                # deactivate current subscriptions and subscribe user to a contributor subscription
                subscribe_users_to_plan([user.id], 'contributor_monthly_recur')
                user.isSubscribedContributor = True
            else:
                # deactivate contributor subscription and subscription them to a 30 day free trial
                subscribe_users_to_plan([user.id], 'free_trial_extension')
                user.isSubscribedContributor = False

        if 'suspended' in params:
            user.suspended = params['suspended']
            if 'suspended_reason' in params:
                user.suspended_reason = params['suspended_reason']

            # n.b. timestamping the action so we know when it happened
            user.properties = merge_two_dicts(user.properties, {"suspended_time": dt.datetime.utcnow().isoformat()})
        
        if 'enabled' in params:
            user.enabled = params['enabled']
            
            # n.b. timestamping the action so we know when it happened
            user.properties = merge_two_dicts(user.properties, {"confirmed_date": dt.datetime.utcnow().isoformat()})

    # prevent any actions by non-admin users on a different user row than logged in for
    elif g.user_id != user.id:
        return jsonify({"errors": "Not found"}), 404

    if params.get('first_name', False): user.first_name = params['first_name']
    if params.get('last_name', False): user.last_name = params['last_name']
    
    if BASE_URL_FOR_EMAIL:
        base_url = BASE_URL_FOR_EMAIL
    else:
        base_url = 'http://%s:%s' % (API_BOUND_HOST, API_PORT)
        
    if 'email' in params and user.email.lower() != params['email'].lower():
        new_user_email = params['email'].lower()
        mandrill_recipient = [
        {
            'email': user.email,
            'name': user.first_name,
            'type': 'to'
        },
        {
            'email': new_user_email,
            'name': user.first_name,
            'type': 'to'
        }]
        
        email_helper.send_via_mandrill(
            mandrill_recipient,
            'noreply@compliance.ai',
            'Compliance.ai',
            'Your Compliance.ai Email has Changed!',
            template='confirm-change-inline',
            vars={
            'base_url': base_url,
            'user_first_name': user.first_name,
            'user_account_item': 'email',
            'user_email': user.email,
            'account_change_txt_begin': 'please contact us at',
            'link_txt': "support@compliance.ai",
            'account_change_txt_end': 'immediately',
            'url': 'mailto:support@compliance.ai',
            },
        )
    if params.get('email', False): user.email = params['email'].lower()
    if params.get('properties', False):
        user.properties = merge_two_dicts(user.properties, params['properties'])
    if params.get('company', False): user.company = params['company']
    if 'team_id' in params: user.team_id = params['team_id']
    if params.get('industry', False): user.industry = params['industry']
    if params.get('discipline', False): user.discipline = params['discipline']
    if params.get('level', False): user.level = params['level']
    # update the password if the current and new passwords were provided,
    # and the current password is correct
    if params.get('current_password', False) and params.get('new_password', False):
        if user.compare_password(params['current_password']):
            user.update_password(params['new_password'])
            mandrill_recipient = [{
                'email': user.email,
                'name': user.first_name,
                'type': 'to'
            }]
            user.gen_reset_token()
            
            reset_url = '%s/activate?&email=%s&token=%s' % (
                base_url,
                urllib.quote_plus(user.email),
                urllib.quote_plus(user.reset_token)
            )
            reset_url += '&reset=1'
            
            email_helper.send_via_mandrill(
                mandrill_recipient,
                'noreply@compliance.ai',
                'Compliance.ai',
                'Your Compliance.ai Password has Changed!',
                template='confirm-change-inline',
                vars={
                'base_url': base_url,
                'user_first_name': user.first_name,
                'user_account_item': 'password',
                'user_email': user.email,
                'url': reset_url,
                'account_change_txt_begin': "you'll need to click",
                'link_txt': "here",
                'account_change_txt_end': "and reset your password",
                },
            )
        else:
            return jsonify({"errors": {'field': 'password'}}), 400
        
    db_session_users.add(user)
    db_session_users.commit()
    db_session_users.flush()
    db_session_users.refresh(user)

    if hasattr(user, 'isSubscribedContributor'):
        return jsonify({
            'user': user.to_dict(),
            'isSubscribedContributor': user.isSubscribedContributor
        })

    return jsonify({'user': user.to_dict()})

def fetch_user_details(email):
    user = db_session_users.query(User).filter_by(email=email).first()

    if g.user_id != user.id and not g.admin_user:
        return jsonify({"errors": "Not found"}), 404

    return jsonify({'user': user.to_dict()})

def fetch_all_users():
    if not g.admin_user:
        return jsonify({"errors": "Not found"}), 404

    # n.b. the reason for continuing to list out a large number of fields is
    # because the size of data here could get quite large, so any pruning could
    # be useful for us, both on the db request and the response payload
    # if we later paginate these results, we can remove this no prob
    fields = [User.email, User.enabled, User.first_name, User.last_name, User.company, User.team_id, User.industry,
              User.discipline, User.level, User.properties, User.roles, User.id, User.suspended,
              User.suspended_reason, User.created_at]
    all_users = [ {
        "email": u[0],
        "enabled": u[1],
        "first_name": u[2],
        "last_name": u[3],
        "company": u[4],
        "team_id": u[5],
        "industry": u[6],
        "discipline": u[7],
        "level": u[8],
        "properties": u[9],
        "roles": u[10],
        "id": u[11],
        "suspended": u[12],
        "suspended_reason": u[13],
        "created_at": unicode(u[14]),
    } for u in db_session_users.query(*fields).all()]

    return jsonify({"users": all_users})

def delete_user(email):
    user = db_session_users.query(User).filter_by(email=email).first()
    if user is None:
        return jsonify({"errors": email + " doesn't exist"})

    try:
        delete_users([email])
    except:
        return jsonify({"errors": "Delete " + email + " unsuccessful"}), 500

    return jsonify({"msg": email + " successfully deleted"})

##########################################################
# To be utlized when you want to assign all users to a new email notification
# Enter the following cmds in to your terminal
# 1 - `PYTHONSTARTUP=juriterm.py python`
# 2 - `from helpers.user_helper import add_all_users_to_email_list`
# 3 - add_all_users_to_email_list()
##########################################################
def add_all_users_to_email_list():
    all_users = db_session_users.query(User).filter_by(enabled=True).all()
    # for each user
    users = []
    for user in all_users:
        # check to see if the email_updates in user.properties is a string (deprecated)
        if  user.properties and 'email_updates' in user.properties and isinstance(user.properties['email_updates'], unicode):
            # update to become a hash table (latest)
            # also set whatever the user's actual preferences are
            properties = { 
                'email_updates': {
                    'agency_weekly': user.properties['email_updates'] == 'weekly',
                    'agency_daily': user.properties['email_updates'] == 'daily',
                    'topics_weekly': True, # all users are being set to recieve topics email by default
                }
            }
        elif 'email_updates' not in user.properties: # catch those users who may have not signed up for email yet
            properties = { 
                'email_updates': {
                    'agency_weekly': True,
                    'agency_daily': False,
                    'topics_weekly': True,
                }
            }
            
        user.properties = merge_two_dicts(user.properties, properties)
        users.append(user)
        
    # after each user has been updated save it in the db  
    db_session_users.add_all(users)
    db_session_users.commit()
    
