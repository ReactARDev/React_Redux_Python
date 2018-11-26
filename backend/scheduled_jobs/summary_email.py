import os
import sys
import optparse
from werkzeug.datastructures import MultiDict
from dateutil import parser
from dateutil.relativedelta import relativedelta
import datetime
import pprint
import elasticsearch

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')

from settings import BASE_URL_FOR_EMAIL, BUGSNAG_API_KEY, JURISPECT_API_URL
from models import *
from helpers.document_helper import get_filtered_documents
from helpers.agency_helper import get_followed_agency_ids_with_backoff
import schemas.jurasticsearch as jsearch
from helpers.emailhelper import EmailHelper
from helpers.slack_helper import post_email_notice_to_slack

if BUGSNAG_API_KEY:
    import bugsnag
    bugsnag.configure(api_key=BUGSNAG_API_KEY, project_root=os.path.dirname(__file__)+'/..' )

optparser = optparse.OptionParser()
optparser.add_option("-i", "--job_interval", dest="job_interval", default="weekly", help="Is this job being run on a weekly or daily interval")
optparser.add_option("-o", "--override_email", dest="override_email", help="Override destination email address for testing")
optparser.add_option("-u", "--specified_user", dest="specified_user", help="send email to specific user")
optparser.add_option("-s", "--email_suffix_user_override", dest="email_suffix_user_override", help="Override the override email if this is a @suffix user")
optparser.add_option("-f", "--force", dest="force", action="store_true", help="Force execution")
optparser.add_option("-d", "--debug", dest="debug", action="store_true", help="Add debug data to email")
optparser.add_option("-l", "--limit", dest="limit", type="int", help="Limit number of emails to send")
optparser.add_option("-b", "--base-url", dest="base_url", help="Override default base URL")
(opts, _) = optparser.parse_args()

email_helper = EmailHelper()
num_of_emails_attempted = 0
# helper method to get the minimum date, handles for cases when one of the two dates = None
def get_min_date(date1, date2):
    if date1 and not date2:
        return date1
    elif date2 and not date1:
        return date2
    else:
        return min(date1, date2)

# default the user's job interval to weekly if not set (weekly/daily/none)
def get_user_job_interval_preference(user):
    interval_map = {
        'weekly': True,
        'daily': False,
    }
    if user.properties and 'email_updates' in user.properties:
        if 'agency_weekly' in user.properties['email_updates']:
            interval_map['weekly'] = user.properties['email_updates']['agency_weekly']

        if 'agency_daily' in user.properties['email_updates']:
            interval_map['daily'] = user.properties['email_updates']['agency_daily']

    return interval_map

# make sure we only check enabled users, and apply a limit for debug purposes if set
user_query = db_session_users.query(User).filter_by(enabled=True)
if opts.limit:
    user_query = user_query.limit(opts.limit)

all_users = user_query.all()

if opts.specified_user:
    all_users = db_session_users.query(User).filter_by(email=opts.specified_user).all()

distinct_document_types = jsearch.get_distinct_attribute_values('category')

today = datetime.date.today()
today_str = today.strftime("%m/%d/%Y")
#n.b. easy way to generate more data for testing that functionality works
#today_str = (today-relativedelta(months=12)).strftime("%m/%d/%Y")

# heroku only supports a maximum of daily intervals, so for weekly jobs, we kill the script on any day but Monday
# weekday is 0-6 representing Monday-Sunday
if opts.job_interval == 'weekly' and today.weekday() != 0 and not opts.force:
    print("Weekly interval called on day other than Monday, exiting")
    exit()

one_month_from_now = (today + relativedelta(months=1)).strftime("%m/%d/%Y")
email_styled_from_date = (today - relativedelta(weeks=1)).strftime("%b. %d")

if opts.job_interval == 'weekly':
    overview_from_date = (today - relativedelta(weeks=1)).strftime("%m/%d/%Y")
    time_span = email_styled_from_date + " - " + today.strftime("%b. %d, %Y")
elif opts.job_interval == 'daily':
    overview_from_date = (today - relativedelta(days=1)).strftime("%m/%d/%Y")
    time_span = today.strftime("%b. %d, %Y")

for user in all_users:
    if user.suspended:
        print user.first_name + ' has been suspended, no email was sent'
        continue
    user_interval_preference = get_user_job_interval_preference(user)

    # ex. if this is a weekly job being run for a user configured for daily intervals, do not send for that user
    if not user_interval_preference[opts.job_interval] and not opts.force:
        print(user.email + " is not configured for " + opts.job_interval)
        continue

    followed_agency_ids = get_followed_agency_ids_with_backoff(user.id)

    agency_overview = {}

    for followed_agency_id in followed_agency_ids:
        # n.b. need to figure out a better way to filter out state code
        if followed_agency_id > 999:
            continue
        # n.b. we need to rescue elasticsearch not found errors here because we don't guarantee consistency
        # between the followed agency ids stored in the user db and any updates in
        try:
            agency_name = jsearch.get_record(str(followed_agency_id), 'agencies')['short_name']
        except elasticsearch.exceptions.NotFoundError:
            continue

        agency_overview[agency_name] = {"types": {}, "agency_id": followed_agency_id, "published_from": overview_from_date, "published_to": today_str}

        for doc_type in distinct_document_types:
            if doc_type == 'Enforcement Metadata' or doc_type == 'Mainstream News':
                continue

            params = MultiDict({
                'agency_id': followed_agency_id,
                'category': doc_type,
                'published_from': overview_from_date,
                'published_to': today_str
            })
            docs, count = get_filtered_documents(params, user.id)
            if count > 0:
                # for now only display the first document on the list
                id = None
                publication_date = ''
                additional_date = ''
                additional_date_txt = ''
                summary_text = ''

                if ('id' in docs[0]):
                    id = docs[0]['id']

                if ('publication_date' in docs[0]):
                    pub_date = parser.parse(docs[0]['publication_date'])
                    publication_date = datetime.datetime.strftime(pub_date, '%m/%d/%Y')

                if ('summary_text' in docs[0]):
                    trunc_txt = docs[0]['summary_text'][:250].rsplit('_', 1)[0]
                    summary_text = trunc_txt

                if ('rule' in docs[0]):
                    if (docs[0]['rule']['effective_on'] is not None):
                        additional_date_txt = '| Effective'
                        eff_date = parser.parse(docs[0]['rule']['effective_on'])
                        additional_date = datetime.datetime.strftime(eff_date, '%m/%d/%Y')
                    elif(docs[0]['rule']['comments_close_on'] is not None):
                        additional_date_txt = ' | Comments Close'
                        comments_close_date = parser.parse(docs[0]['rule']['comments_close_on'])
                        additional_date = datetime.datetime.strftime(comments_close_date, '%m/%d/%Y')

                display_doc = {
                "id": id,
                 "publication_date": publication_date,
                 "additional_date": additional_date,
                 "additional_date_txt": additional_date_txt,
                 "summary_text": summary_text,
                }

                agency_overview[agency_name]["types"][doc_type] = { "count": count, "display_doc": display_doc }

        # remove those agencies with no updates
        if not agency_overview[agency_name]["types"]:
            agency_overview.pop(agency_name, None)

    # In the case where all agencies have been remove there are no updates, short circut sending email
    if not agency_overview:
        print user.first_name + ' has no new agency updates, no email was sent'
        continue

    subject = time_span + " " + opts.job_interval.capitalize() + " summary for Compliance.ai"

    # n.b. this needs to be set on the command line or in the environment or it will fail
    base_url = opts.base_url or BASE_URL_FOR_EMAIL
    api_base_url = JURISPECT_API_URL

    combined_dict = {
        'name': user.first_name,
        'job_interval': opts.job_interval,
        'overview': agency_overview,
        'base_url': base_url,
        'api_base_url': api_base_url,
        'from_date': (today - relativedelta(weeks=1)).strftime("%Y-%m-%d"),
        'to_date': today.strftime("%Y-%m-%d"),
        'subject': subject,
        'debug': opts.debug,
        'user_id': user.id,
        'time_span': time_span,
    }

    template = 'agency-summary-inline'

    # allow override for easy testing, plus the ability to override the override for users with a certain email
    # suffix (i.e. @jurispect.com).
    if opts.override_email:
        if opts.email_suffix_user_override and user.email.endswith(opts.email_suffix_user_override):
            destination_email = user.email
        else:
            destination_email = opts.override_email
    else:
        destination_email = user.email

    email_helper.send_via_mandrill(
        [{
            'email': destination_email,
            'name': user.first_name,
            'type': 'to'
        }],
        'noreply@compliance.ai',
        'Compliance.ai',
        subject,
        template=template,
        vars=combined_dict,
    )
    num_of_emails_attempted += 1

post_email_notice_to_slack('attempted '+str(num_of_emails_attempted)+ ' ' + opts.job_interval + ' agency summary emails')
