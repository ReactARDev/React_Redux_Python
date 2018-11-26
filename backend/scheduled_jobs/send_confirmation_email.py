import os
import sys
import optparse
from dateutil.relativedelta import relativedelta
import datetime

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')

from settings import BUGSNAG_API_KEY
from models import *
from helpers.registration_helper import pure_send_confirmation_email

if BUGSNAG_API_KEY:
    import bugsnag
    bugsnag.configure(api_key=BUGSNAG_API_KEY, project_root=os.path.dirname(__file__)+'/..' )

unenabled_users = db_session_users.query(User).filter_by(enabled=False).all()
for user in unenabled_users:
    today = datetime.date.today()
    seven_days_ago = (today - relativedelta(days=7)).strftime("%m/%d/%Y")
    if user.created_at.strftime("%m/%d/%Y") == seven_days_ago:
        if not 'recent_confirmation_email_success' in user.properties or not user.properties['recent_confirmation_email_success']:
            pure_send_confirmation_email(user)
