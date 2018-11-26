import datetime
import json
import logging
from os.path import dirname
from smtplib import SMTPException

import dateutil.parser
import jwt
import stripe
from jwt.exceptions import ExpiredSignatureError
from flask_socketio import SocketIO, disconnect, join_room, leave_room, emit
from gevent import pywsgi
from geventwebsocket.handler import WebSocketHandler

from settings import API_BOUND_HOST, API_PORT, LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
from settings import SECRET_JWT, BUGSNAG_API_KEY, STRIPE_SECRET_WEBHOOK_KEY

if BUGSNAG_API_KEY:
    import bugsnag
    from bugsnag.flask import handle_exceptions

    bugsnag.configure(api_key=BUGSNAG_API_KEY, project_root=dirname(__file__))

from flask_sslify import SSLify
from flask import Flask
from flask_cors import CORS
from flask import request
from flask import make_response
from flask_compress import Compress
from werkzeug.routing import PathConverter
import uuid
from helpers.document_helper import *
from helpers.agency_helper import *
from helpers.aggregation_helper import *
from helpers.judgments_helper import *
from helpers.user_helper import *
from helpers.tag_helper import *
from helpers.followed_entity_helper import get_all_followed_entities, updated_followed_entity
from helpers.folder_helper import *
from helpers.flagged_document_helper import flag_document, get_flagged_hidden_documents
from helpers.saved_search_helper import get_all_saved_searches, create_saved_search, update_saved_search, \
    remove_saved_search
from helpers.search_queries_helper import track_search_query, get_top_search_queries
from helpers.popular_entity_helper import get_most_popular_docs, get_most_popular_sources
from helpers.contributor_points_helper import get_contributor_points, track_contributor_point
from helpers.proposed_filter_helper import get_suggestions, get_entity_by_type_and_id
from helpers.rated_search_helper import create_rated_search
from helpers.utilities import merge_two_dicts
from helpers.marketing_campaigns_helper import get_all_marketing_campaigns, create_marketing_campaign, \
    update_marketing_campaign, get_marketing_campaign_details
from helpers.registration_helper import activate_user, reset_password, invite_user, confirm_user, check_email_in_use, \
    send_confirm_email, link_secondary_signups
from helpers.annotation_job_helper import pop_annotation_job_from_queue, get_annotation_jobs_for_task, \
    get_annotation_job_by_id, create_annotations_for_job, create_review_for_job, get_reviews_count_for_user, \
    get_review_breakdown_for_task, get_all_skipped_annotation_jobs
from helpers.annotation_task_helper import get_all_annotation_tasks, create_annotation_task, update_annotation_task, \
    delete_annotation_task, get_annotation_task_group_tags_for_task
from helpers.annotation_task_groups_helper import create_annotation_task_group, delete_annotation_task_group, \
    get_all_annotation_tasks_in_group, get_all_annotation_task_groups, update_annotation_task_group, \
    get_all_topic_annotations_in_group, get_user_accuracies_for_topic_group
from helpers.aggregated_annotations_helper import get_aggregated_annotations, update_aggregated_annotation, \
                                                  update_research_mode_expanded_view, update_research_mode_gold_standard
from helpers.topic_annotation_helper import get_topic_annotation_breakdown_for_task
from helpers.emailhelper import EmailHelper
from helpers.pdf_utils import add_cover_to_pdf
from helpers.search_helper import *
from errors import UnauthorizedUsage
from elasticsearch import NotFoundError
from helpers.update_document_helper import update_document
from helpers.google_analytics_helper import request_documents
from helpers.user_created_document_helper import get_all_created_documents, queue_created_document, get_content_type_length
from helpers.subscription_helper import post_subscribe_customer, get_subscriptions, handle_payment_event, handle_request_invoice, \
    get_all_subscriptions, update_subscription, get_all_plans
from helpers.topics_helper import get_user_topics, update_user_topics
from helpers.team_helpers import *
from helpers.summary_graph_helper import summary_email_graph
from helpers.sources_helper import get_sources
from helpers.topics_stats_helper import get_topics_stat
import requests

app = Flask(__name__, static_folder=dirname(__file__))
Compress(app)
CORS(app)  # allow cross-origin requests
socket = SocketIO(app)

if API_ENV is None or API_ENV in ['development', 'testing', 'local']:
    app.debug = True
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
else:
    handle_exceptions(app)
    sslify = SSLify(app)

# routes that don't require a jwt token, either because they are unauthenticated or they require api keys
NON_JWT_AUTH_ROUTES = {'/activate', '/login', '/reset', '/test', '/confirm', '/docs', '/suggestion', '/doc_pdf',
                        '/check_email', '/payment_events', '/send_confirm_email', '/data_updates', '/socket.io', '/auth_linkedin_token',
                        '/auth_google_token', '/agency_summaries', '/insights_csv_by_slug', '/agency_summary_graph', '/agency_infos',
                        '/agency_enforcements_by_month', '/pub_rules_created_by_time'}

# routes that are accessible with api keys only
API_KEY_AUTH_ROUTES = {'/docs', '/suggestion', '/doc_pdf', '/data_updates', '/agency_summaries', '/insights_csv_by_slug', '/agency_infos',
                        '/agency_enforcements_by_month', '/pub_rules_created_by_time'}

email_helper = EmailHelper()
# In production mode, add log handler to sys.stderr.
@app.before_first_request
def setup_logging():
    if not app.debug:
        logger = logging.getLogger('werkzeug')
        handler = logging.FileHandler('access.log')
        logger.addHandler(handler)
        app.logger.addHandler(handler)
        app.logger.addHandler(logging.StreamHandler())
        app.logger.setLevel(logging.DEBUG)


# creates a custom path converted that takes everything - with the specific use-case of supporting leading slashes
# currently used by the autosuggest route
class EverythingConverter(PathConverter):
    regex = '.*?'


app.url_map.converters['everything'] = EverythingConverter


@app.errorhandler(UnauthorizedUsage)
def handle_unauthorized_usage(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response


# helper method that takes in the request object and searches two places for the authorization token
def get_token_from_request(req):
    token = req.headers.get('Authorization', None)

    # check query params if the header is unset
    # this is needed to load pdfs in iframes in IE
    # it should also be helpful for testing and exploring the APIs
    if not token and req.args:
        token = req.args.get('access_token', None)

    return token

def verify_jwt_token(raw_token, request, websocket=None):
    # type=OPTIONS is used by CORS and needs to be let through sans-auth
    if request.method != "OPTIONS" or websocket:
        if request.path not in NON_JWT_AUTH_ROUTES:
            if raw_token and raw_token != "":
                try:
                    token = jwt.decode(raw_token, SECRET_JWT)
                except ExpiredSignatureError:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("expired token, login required")
                except:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("error decoding JWT token")

                if datetime.datetime.fromtimestamp(token['exp']) < datetime.datetime.utcnow():
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("expired token, login required")
                try:
                    g.user_id = token['user_id']
                except:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("invalid token, login required")

                try:
                    current_user = db_session_users.query(User).filter_by(id=g.user_id).first()
                    g.user_email = current_user.email
                    g.user_token = raw_token

                    # add per-request user data so that we know who generated bugsnag reports
                    if BUGSNAG_API_KEY:
                        bugsnag.configure_request(user={
                            "id": current_user.id,
                            "email": current_user.email,
                            "name": current_user.first_name,
                        })
                    g.qa_user = 'qa' in current_user.roles
                    g.admin_user = "admin" in current_user.roles
                    g.contributor_user = "contributor" in current_user.roles
                except:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("invalid user_id")

                # special case for non-invited users to have access for first 24 hours before they confirm their email
                # once they confirm, the account is enabled and this check is moot.
                if not current_user.enabled:
                    # check if the created_at date is older than a day ago, we allow marketing campaign and
                    # cold signup (no token) users to login less than a day after signup before they confirm their
                    # other disabled accounts will surely be created well before a day ago,
                    # and their authorization will still fail
                    if current_user.created_at < datetime.datetime.now() - datetime.timedelta(days=1):
                        if websocket:
                            disconnect()
                        raise UnauthorizedUsage("user is disabled")

                if current_user.suspended:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("user is suspended")
                return g.user_id #this is used by the websocket auth.
            else:
                if websocket:
                    disconnect()
                raise UnauthorizedUsage("api access requires a JWT token")

        elif request.path in API_KEY_AUTH_ROUTES:
            token = get_token_from_request(request)

            if token and token != "":
                api_key = db_session_users.query(ApiKey).filter_by(token=token).first()
                if api_key is None:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("api access requires a token")

                # special case login for unenabled marketing campaign users allow access
                if not api_key.enabled:
                    if websocket:
                        disconnect()
                    raise UnauthorizedUsage("api key is disabled")
            else:
                raise UnauthorizedUsage("api access requires a token")

@app.before_request
def verify_auth():
    raw_token = get_token_from_request(request)
    verify_jwt_token(raw_token, request)

# simple method to restrict routes to admin users only
def admin_users_only():
    if not g.admin_user:
        raise UnauthorizedUsage("Not found", 404)


# simple method to restrict routes to qa users only
def qa_users_only():
    if not (g.admin_user or g.qa_user):
        raise UnauthorizedUsage("Not found", 404)


# simple method to restrict routes to qa and contributor users only
def qa_or_contributor_users_only():
    if not (g.admin_user or g.qa_user or g.contributor_user):
        raise UnauthorizedUsage("Not found", 404)

def authorize(user, password=None):
    # if not user.enabled and  'linkedin_user_info' not in user and  'link_google' not in user:
    if not user.enabled and not hasattr(user,'linkedin_user_info') and not hasattr(user,'google_user_info'):
        user_part_of_campaign = db_session_users.query(MarketingCampaignUsers).filter_by(id=user.id).first()
        # case where non-verified campaign user who had 24hr access returns to login
        if user_part_of_campaign or "invited_by" not in user.properties:
            return jsonify({'error': 'User is not verified'}), 401

        return jsonify({'error': 'User is not enabled'}), 401

    if user.suspended:
        return jsonify({'error': 'User is suspended'}), 401

    # password is used for regular login but is omitted for oAuth
    if password:
        if not user.compare_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401

    # checks if this is a secondary signup (e.g. linkedin, google) for an existing user
    link_secondary_signups(user)

    expiration_datetime = datetime.datetime.utcnow() + datetime.timedelta(days=30)
    token = jwt.encode({'user_id': user.id, 'exp': expiration_datetime}, SECRET_JWT)
    # Flag 'is_new' defines if user is returning or just registered. False means returning user
    # following_agency is used in the front end when the user tries to login on /activate with linkedin
    user_followed_agencies = db_session_users.query(UserAgency).filter_by(user_id=user.id, following=True).first()
    following_agency = user_followed_agencies is not None
    return jsonify({"jwt_token": token, "roles": user.roles, "is_new": False, "following_agency": following_agency})

@app.route('/login', methods=['POST'])
def login():
    params = json.loads(request.get_data())

    if not (params.get('email') and params.get('password')):
        response = jsonify({'error': 'Missing parameters'}), 400
        return response

    email = params.get('email').lower()
    user = db_session_users.query(User).filter_by(email=email).scalar()
    g.user_email = email

    if user:
        return authorize(user, params.get('password'))
    else:
        return jsonify({'error': 'Invalid email or password'}), 401


# checks to see if email is already in use by a user in db
@app.route('/check_email', methods=['GET'])
def check_email():
    params = merge_two_dicts(request.args, {})
    return check_email_in_use(params)


@app.route('/activate', methods=['POST'])
def activate_user_route():
    params = json.loads(request.get_data())
    return activate_user(params)


@app.route('/reset', methods=['POST'])
def reset_password_route():
    params = json.loads(request.get_data())
    return reset_password(params)


@app.route('/send_confirm_email', methods=['POST'])
def send_confirm():
    params = json.loads(request.get_data())
    return send_confirm_email(params)


@app.route('/invite', methods=['POST'])
def invite():
    params = json.loads(request.get_data())
    return invite_user(params, g.user_id)


@app.route('/confirm', methods=['POST'])
def confirm():
    params = json.loads(request.get_data())
    return confirm_user(params)


@app.route('/feedback', methods=['POST'])
def feedback():
    params = json.loads(request.get_data())

    feedback = params.get('feedback')
    topics = params.get('topics', None)

    def error_response(msg, code=400):
        response = jsonify({
            'error': msg,
        })
        response.status_code = code
        return response

    if feedback is None:
        return error_response('Please fill out form')

    current_user = db_session_users.query(User).filter_by(id=g.user_id).first()

    if topics is not None:
        subject = 'Feedback about Topics on Compliance.ai from ' + current_user.first_name
        email = 'topic-feedback@compliance.ai'
    else:
        subject = 'Feedback on Compliance.ai from ' + current_user.first_name
        email = 'support@compliance.ai'

    try:
        email_helper.send_email(
            email,
            current_user.email,
            subject,
            template='feedback-inline',
            vars={'feedback': feedback,
                  'User_first_name': current_user.first_name,
                  'User_last_name': current_user.last_name, },
        )
    except SMTPException as e:
        return error_response('Could not send email', code=500)

    response = jsonify({
        'success': True,
    })

    return response


@app.route('/users/<email>', methods=['GET'])
def get_user_details(email):
    return fetch_user_details(email.lower())


@app.route('/users', methods=['GET'])
def get_all_users():
    return fetch_all_users()


@app.route('/users/<email>', methods=['POST'])
def post_user_details(email):
    return update_user_details(email.lower(), json.loads(request.get_data()))


@app.route('/current_user', methods=['GET'])
def get_current_user():
    user = db_session_users.query(User).filter_by(id=g.user_id).first()

    now = datetime.datetime.utcnow()

    # the following is some kind of annoying logic. it attempts to
    # track an active user session (which can be less or greater than
    # the time the user is logged in) by updating "session_end" each
    # time this route is hit. If there is more than a two hour gap
    # between now and "session_end", it considers this a new session,
    # and sets "last_session_end" to the value of "session_end".
    def create_datetime_obj(stamp):
        if stamp is None:
            return now - datetime.timedelta(days=7)

        try:
            return dateutil.parser.parse(stamp)
        except AttributeError:
            return now - datetime.timedelta(days=7)

    user_properties = user.properties or {}

    session_start = create_datetime_obj(user_properties.get('session_start'))
    session_end = create_datetime_obj(user_properties.get('session_end'))
    last_session_end = create_datetime_obj(user_properties.get('last_session_end'))

    time_since_last = now - session_end

    new_session_data = {}

    if time_since_last.total_seconds() > (60 * 60 * 2):  # 2 hours
        new_session_data['last_session_end'] = session_end.isoformat()
        new_session_data['session_start'] = now.isoformat()
        new_session_data['session_end'] = now.isoformat()
    else:
        new_session_data['session_end'] = now.isoformat()

    if len(new_session_data) > 0:
        user.properties = merge_two_dicts(user_properties, new_session_data)

        db_session_users.add(user)
        db_session_users.commit()

    return jsonify({'user': user.to_dict()})


@app.route('/test', methods=['POST', 'GET'])
def test_route():
    return jsonify({"success": True})


@app.route('/delete_user/<email>', methods=['DELETE'])
def delete_user_by_email(email):
    admin_users_only()
    return delete_user(email)


###################################################################################
#    Elasticsearch CRUD Routes
####################################################################################

@app.route('/docket_timeline/<int:document_id>', methods=['GET'])
def get_docket_timeline(document_id):
    params = merge_two_dicts(request.args, {})
    return jsonify({'document_timelines': document_timelines(document_id, params, g.user_id)})


@app.route('/dockets/<int:docket_id>', methods=['GET'])
def get_docket(docket_id):
    params = merge_two_dicts(request.args, {})
    return jsonify({'docket': docket_timeline(docket_id, params, g.user_id)})


@app.route('/documents', methods=['POST'])
def post_documents():
    params = json.loads(request.get_data())
    if 'folder_id' in params:
        response_dict = add_docs_to_folder(params)
    else:
        response_dict = update_document_decoration(params)

    if 'errors' in response_dict:
        if 'folder_id' in params:
            return jsonify(response_dict), 409
        return jsonify('errors'), 400

    updated_docs = params['document_ids']
    return jsonify({'documents': merge_two_dicts({'ids': updated_docs}, response_dict)})


@app.route('/documents/<int:document_id>', methods=['POST'])
def post_document(document_id):
    params = json.loads(request.get_data())
    if 'flagged' in params:
        qa_users_only()
        response_dict = flag_document(g.user_id, document_id, params['flagged'])
    elif 'update' in params:
        qa_users_only()
        response_dict = update_document(g.user_id, document_id, params['update'])
    elif 'tag' in params:
        response_dict = tag_document(document_id, params)

    if 'errors' in response_dict:
        return jsonify('errors'), 400
    else:
        return jsonify({'document': merge_two_dicts({'id': document_id}, response_dict)})


@app.route('/documents/<int:doc_id>', methods=['GET'])
def get_document(doc_id):
    params = merge_two_dicts(request.args, {})
    return get_document_by_id(doc_id, params)


@app.route('/categories', methods=['GET'])
def list_categories():
    return jsonify({'categories': get_all_document_categories()})


@app.route('/spider_names', methods=['GET'])
def list_spider_names():
    return jsonify({'spider_names': get_all_document_spider_names()})


@app.route('/provenances', methods=['GET'])
def list_provenances():
    return jsonify({'provenances': get_all_document_provenances()})


@app.route('/jurisdictions', methods=['GET'])
def list_jurisdictions():
    return jsonify({'jurisdictions': get_all_document_jurisdictions()})


@app.route('/agencies', methods=['GET'])
def list_agencies():
    params = merge_two_dicts(request.args, {})
    agencies = get_filtered_agencies(params)
    return jsonify({'agencies': agencies})

@app.route('/agency_infos', methods=['GET'])
def get_agency_infos():
    params = merge_two_dicts(request.args, {})
    agency_id = params.get('agency_id', None)
    if (agency_id is None):
        return jsonify({"errors": "no agency_id param"}), 400
    agency, err = get_agency_info_by_id(agency_id)
    if err != 200 :
        return jsonify({"errors": "not found"}), 404
    return jsonify({'agency': agency})

@app.route('/agencies', methods=['POST'])
def post_agency():
    params = json.loads(request.get_data())
    return jsonify(update_agency(params))


@app.route('/topic_judgments/pop', methods=['GET'])
def get_topic_judgment():
    return jsonify(pop_topic_judgment())


@app.route('/topic_judgments/<int:topic_judgment_id>', methods=['POST'])
def post_topic_judgment(topic_judgment_id):
    params = json.loads(request.get_data())
    return jsonify(update_topic_judgment(topic_judgment_id, params))


@app.route('/document_html/<int:doc_id>', methods=['GET'])
def get_doc_html(doc_id):
    try:
        es_doc = jsearch.get_record(doc_id)
    except NotFoundError:
        es_doc = None

    if not es_doc:
        return jsonify({"errors": "Not found"}), 404

    doc = Document(es_doc)

    try:
        doc_html = doc.xml_content()
    except:
        return jsonify({"errors": "HTML not available"}), 404

    return jsonify({"html": doc_html})


# helper method used by routes to fetch document pdf data
def get_doc_pdf_response(doc_id, params):
    try:
        es_doc = jsearch.get_record(doc_id)
    except NotFoundError:
        return jsonify({"errors": "Not found"}), 404

    include_coverpage = params.get('coverpage', False)

    doc = Document(es_doc)

    try:
        orig_binary_pdf = doc.pdf_content()
    except:
        return jsonify({"errors": "PDF not available"}), 404

    doc_title = params.get('title', doc.title)

    if include_coverpage:
        pdf_file = add_cover_to_pdf(
            title=doc_title,
            table_contents=params.get('table_contents', [['TBD']]),
            text_para=params.get('text_para'),
            pdf_contents=orig_binary_pdf,
        )

        pdf_file.seek(0)
        binary_pdf = pdf_file.read()
        pdf_file.close()
    else:
        binary_pdf = orig_binary_pdf

    filename = re.sub('[^A-Za-z0-9 ]', '', doc_title)[:50]

    response = make_response(binary_pdf)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = \
        'inline; filename="%s.pdf"' % filename
    return response


@app.route('/document_image/<int:doc_id>', methods=['GET'])
def send_doc_image(doc_id):
    try:
        es_doc = jsearch.get_record(doc_id)
    except NotFoundError:
        return jsonify({"errors": "Not found"}), 404

    doc = Document(es_doc)

    try:
        doc_image = doc.image_content()
        response = make_response(doc_image)
        response.headers['Content-Type'] = doc.mainstream_news['image_content_type']
        extension = response.headers['Content-Type'].replace("image/", "")
        response.headers['Content-Disposition'] = \
            ('inline; filename="%s.' + extension + '"') % doc.mainstream_news['image_hash']
        return response
    except:
        return jsonify({"errors": "Image not available"}), 404



@app.route('/document_pdf/<int:doc_id>', methods=['GET', 'POST'])
def send_doc_pdf(doc_id):
    if request.method == 'POST':
        params = json.loads(request.get_data()) or {}
    else:
        params = request.args or {}

    return get_doc_pdf_response(doc_id, params)


@app.route('/doc_pdf', methods=['GET'])
def send_doc_pdf_query():
    params = request.args or {}
    doc_id = params.get('doc_id')
    return get_doc_pdf_response(doc_id, params)


@app.route('/tags', methods=['GET'])
def list_tags():
    return get_all_tags(g.user_id)


@app.route('/tags/<int:tag_id>', methods=['POST'])
def post_existing_tag(tag_id):
    params = json.loads(request.get_data())
    return update_tag(tag_id, g.user_id, params)


@app.route('/tags', methods=['POST'])
def post_new_tag():
    params = json.loads(request.get_data())
    return create_tag(g.user_id, params)


@app.route('/folders', methods=['GET'])
def list_user_folders():
    return get_all_folders(g.user_id)

@app.route('/folders/<int:folder_id>', methods=['POST'])
def get_existing_folder(folder_id):
    params = json.loads(request.get_data())
    return update_folder(folder_id, g.user_id, params)


@app.route('/folders', methods=['POST'])
def create_new_folder():
    params = json.loads(request.get_data())
    return create_folder(g.user_id, params)


@app.route('/folders/<int:folder_id>', methods=['DELETE'])
def delete_user_folder(folder_id):
    params = json.loads(request.get_data())
    return delete_folder_or_document_from_folder(folder_id, g.user_id, params)


@app.route('/search_queries', methods=['POST'])
def record_search_query():
    params = json.loads(request.get_data())
    track_search_query(g.user_id, params)
    return jsonify({})


@app.route('/search_queries', methods=['GET'])
def find_top_search_queries():
    params = merge_two_dicts(request.args, {})
    return jsonify(get_top_search_queries(params))


@app.route('/popular_docs', methods=['GET'])
def find_top_docs():
    params = merge_two_dicts(request.args, {})
    return jsonify(get_most_popular_docs(params))


# n.b. for now popular sources is synonymous with popular federal agencies - if/when this needs changing
# we could parameterize this route to accommodate
@app.route('/popular_sources', methods=['GET'])
def find_top_sources():
    params = merge_two_dicts(request.args, {})
    return jsonify(get_most_popular_sources(params))


@app.route('/contributor_points', methods=['GET'])
def contributor_points_get():
    return jsonify(get_contributor_points(g.user_id))


@app.route('/contributor_points', methods=['POST'])
def record_contributor_point():
    params = json.loads(request.get_data())
    added = track_contributor_point(g.user_id, params)
    return jsonify({"added": added})


@app.route('/hidden_documents', methods=['GET'])
def list_hidden_documents():
    params = merge_two_dicts(request.args, {})
    return get_flagged_hidden_documents(g.user_id, params)


@app.route('/subscriptions', methods=['GET'])
def subscriptions():
    return jsonify(get_subscriptions(g.user_id))


@app.route('/subscriptions', methods=['POST'])
def subscribeCustomer():
    params = json.loads(request.get_data())
    return post_subscribe_customer(g.user_id, g.user_email, params)


@app.route('/payment_events', methods=['POST'])  # webhook that stripe sends events to
def receiveEvent():
    params = request.get_data()
    # stripe security https://stripe.com/docs/webhooks#signatures
    header = request.headers.get('Stripe-Signature', None)
    try:
        event = stripe.Webhook.construct_event(params, header, STRIPE_SECRET_WEBHOOK_KEY)
    except:
        raise UnauthorizedUsage("unauthorized request")
    return jsonify(handle_payment_event(event))


@app.route('/invoices', methods=['POST'])
def request_invoice():
    params = json.loads(request.get_data())
    return jsonify(handle_request_invoice(g.user_id, params))


@app.route('/subscriptions/all', methods=['GET'])
def all_subscriptions():
    admin_users_only()
    return jsonify(get_all_subscriptions())


######################################################################################
# Elasticsearch Search Routes
######################################################################################


# pared down version of /documents that heavily restricts the filterable fields, the default agencies,
# the possible categories, and the fields that are returned
@app.route('/docs', methods=['GET'])
def list_documents_subset():
    params = merge_two_dicts(request.args, {})
    documents, count = get_filtered_documents_subset(params)
    return jsonify({'documents': documents, 'count': count})

@app.route('/topics_stats', methods=['GET'])
def list_topics_stats():
    params = request.args or {}
    stats = get_topics_stat(params)
    return jsonify({'stats': stats})

@app.route('/documents', methods=['GET'])
def list_documents():
    params = merge_two_dicts(request.args, {})
    documents, count = get_filtered_documents(params, g.user_id)
    return jsonify({'documents': documents, 'count': count})


# n.b. the path: prefix for the string allows this route to "work" (not 404) with slashes in the query
@app.route('/autosuggest/<everything:query>', methods=['GET'])
def get_suggestion(query):
    return jsonify({'results': get_suggestions(query)})


# n.b. move the query string to a query arg to make auth switching simpler in current approach
@app.route('/suggestion', methods=['GET'])
def get_suggestion_subset():
    params = merge_two_dicts(request.args, {})
    return jsonify({'results': get_suggestions(params.get('query', None), use_extra_blacklisted_types=True)})

@app.route('/agency_summaries', methods=['GET'])
def get_agency_summaries():
    params = request.args or {}
    agency_id = params.get('agency_id')
    try:
        agency_summaries = jsearch.get_record(agency_id, 'agency_summaries')
    except NotFoundError:
        return jsonify({"errors": "Not found"}), 404
    return jsonify({'agency_summaries': agency_summaries})

@app.route('/agency_summary_graph', methods=['GET'])
def get_user_summary_graph():
    params = request.args or {}
    return summary_email_graph(params, make_response)

@app.route('/sources', methods=['GET'])
def getSources():
    params = request.args or {}
    return get_sources(params)

#################################################################################
# Pre-computed "Analytics" Routes
#################################################################################

def get_record_from_insight_csv(slug):
    record = db_session_users.query(InsightsTable).filter_by(slug=slug).order_by(InsightsTable.id.desc()).first()
    if record:
        return jsonify({'result': record.csv_table, 'raw_data': record.raw_data});
    else:
        return jsonify({"errors": "Insights data not found: {}".format(slug)}), 404


@app.route('/insights_csv/<slug>', methods=['GET'])
def get_insights_csv_by_slug(slug):
    return get_record_from_insight_csv(slug)

# another version of insights_csv route that are accessible with api keys only
@app.route('/insights_csv_by_slug', methods=['GET'])
def get_insights_csv():
    params = request.args or {}
    slug = params.get('slug')
    return get_record_from_insight_csv(slug)


#################################################################################
# Elasticsearch Analytics Routes
#################################################################################

@app.route('/insights', methods=['GET'])
def get_filtered_counts():
    params = merge_two_dicts(request.args, {})
    result = run_aggregation(params, g.user_id)
    return jsonify(result)


@app.route('/recently_cited_acts', methods=['GET'])
def recently_cited_acts():
    query = aggregation_query({
        "agencies": DefaultAgencies,
        "from_date": "now-3M",
        "categories": ['Enforcement'],
        "buckets": [("terms", "acts.name"), ("terms", "agencies.name")]
    })
    result = jsearch.count_records(query, 'documents')
    result['hits'] = []
    return jsonify(result)


@app.route('/rules_by_quarter', methods=['GET'])
def rules_by_quarter():
    params = merge_two_dicts(request.args, {})
    agencies = safe_getlist('agency_id', params)
    query = aggregation_query({
        "agencies": agencies,
        "from_date": "now-40M/M",  ## 3 full years of quarters
        "provenance": 'fed_api_docs',
        "categories": ['Proposed Rule', 'Final Rule'],
        "buckets": [
            ("terms", "agencies.name"),
            ("quarter", "publication_date"),
            ("terms", "category")
        ]
    })
    result = jsearch.count_records(query, 'documents')
    result['hits'] = []
    return jsonify(result)


@app.route('/rules_by_agency', methods=['GET'])
def rules_by_agency():
    params = merge_two_dicts(request.args, {})
    agencies = safe_getlist('agency_id', params)
    acts = safe_getlist('act_id', params)
    query = aggregation_query({
        "agencies": agencies,
        "from_date": "now-40M/M",  ## 3 full years of quarters
        "categories": ['Enforcement', 'Final Rule'],
        "acts": acts,
        "buckets": [
            ("terms", "agencies.short_name"),
            ("terms", "category")
        ]
    })
    result = jsearch.count_records(query, 'documents')
    result['hits'] = []
    return jsonify(result)

def rules_created_by_time():
    params = merge_two_dicts(request.args, {})
    date_range_field = params.get('date_range_field')
    from_date = params.get('from_date', '3M')
    date_range_from = params.get('date_range_from', None)
    date_range_to = params.get('date_range_to', None)
    bucket_terms = request.args.getlist('terms[]')
    buckets = [tuple(['terms', term]) for term in bucket_terms]
    histogram_interval = params.get('histogram_interval', None)
    date_histogram_format = params.get('date_histogram_format', "yyyy-MM")
    categories = request.args.getlist('categories[]')

    if histogram_interval:
        buckets.append(tuple([histogram_interval, date_range_field]))
    # If all_agencies is TRUE then query doesn't contain agency filter
    all_agencies = params.get('all_agencies', None)

    # Filter agencies in the following manner:
    #     1. By list provided; else
    #     2. By agencies followed; else
    #     3. Using the global default
    agencies = safe_getlist('agency_id', params)
    agency_skip_list = request.args.getlist('skip_agency[]')
    followed_agencies = params.get('followed_agencies', None)
    if not agencies:
        if followed_agencies:
            agencies = get_followed_agency_ids_with_backoff(g.user_id)
        else:
            agencies = DefaultAgencies

    if agency_skip_list:
        skip_list_set = set([int(a) for a in agency_skip_list])
        agencies = [a for a in agencies if a not in skip_list_set]

    aggregation_query_input = {
        "all_agencies": all_agencies,
        "agencies": agencies,
        "buckets": buckets,
        "categories": categories,
        "date_histogram_format": date_histogram_format,
        "date_range_field": date_range_field,
        "from_date": "now-%s" % from_date,
        "date_range_from": date_range_from,
        "date_range_to": date_range_to,
    }

    query = aggregation_query(aggregation_query_input)
    result = jsearch.count_records(query, 'documents')
    result['hits'] = []
    return jsonify(result)
app.add_url_rule('/rules_created_by_time', view_func=rules_created_by_time, methods=['GET'])
app.add_url_rule('/pub_rules_created_by_time', view_func=rules_created_by_time, methods=['GET'])

@app.route('/agency_enforcements_by_month', methods=['GET'])
def agency_enforcements_by_month():
    params = merge_two_dicts(request.args, {})
    agencies = safe_getlist('agency_id', params)
    from_date = params.get('from_date', 'now-10y/M')
    query = aggregation_query({
        "agencies": agencies,
        "from_date": from_date,
        "categories": ['Enforcement'],
        "buckets": [("terms", "agencies.name"), ("1M", "publication_date")]
    })
    result = jsearch.count_records(query, 'documents')
    result['hits'] = []
    return jsonify(result)


@app.route('/act_enforcement_matrix', methods=['GET'])
def act_enforcement_matrix():
    params = merge_two_dicts(request.args, {})
    agencies = safe_getlist('agency_id', params)
    query = aggregation_query({
        "agencies": agencies,
        "from_date": "now-10y/M",
        "categories": ['Enforcement'],
        "buckets": [("terms", "acts.name"), ("terms", "agencies.short_name")]
    })
    result = jsearch.count_records(query, 'documents')
    result['hits'] = []
    return jsonify(result)


# n.b. sometimes entity_id can be a string, so don't cast it here
@app.route('/entities/<entity_type>/<entity_id>', methods=['GET'])
def get_entity(entity_type, entity_id):
    entity_dict = get_entity_by_type_and_id(entity_type, entity_id)
    if 'errors' in entity_dict:
        return jsonify(entity_dict), 400
    else:
        return jsonify(entity_dict)


## NB: forward-compatible route. act id is actually hard-coded as dodd-frank for now
@app.route('/act_word_clouds/<int:act_id>', methods=['GET'])
def get_word_clouds(act_id):
    return jsonify(db_session_users.query(ActWordCount).filter_by(act_id=3207).order_by(ActWordCount.id.desc()).first())


@app.route('/followed_entities', methods=['GET'])
def get_followed_entities():
    params = merge_two_dicts(request.args, {})
    all_entities = get_all_followed_entities(g.user_id, params)
    return jsonify(all_entities)


@app.route('/followed_entities', methods=['POST'])
def post_followed_entities():
    params = json.loads(request.get_data())
    return jsonify(updated_followed_entity(g.user_id, params))


@app.route('/saved_searches', methods=['GET'])
def get_saved_searches():
    all_searches = get_all_saved_searches(g.user_id)
    return jsonify(all_searches)


@app.route('/saved_searches', methods=['POST'])
def post_saved_search_new():
    params = json.loads(request.get_data())
    return create_saved_search(g.user_id, params)


@app.route('/saved_searches/<int:saved_search_id>', methods=['POST'])
def post_saved_search_update(saved_search_id):
    params = json.loads(request.get_data())
    return update_saved_search(g.user_id, saved_search_id, params)


@app.route('/saved_searches/<int:saved_search_id>', methods=['DELETE'])
def delete_saved_search(saved_search_id):
    return jsonify(remove_saved_search(g.user_id, saved_search_id))


@app.route('/rated_results', methods=['POST'])
def post_rated_search_new():
    params = json.loads(request.get_data())
    create_rated_search(g.user_id, params)
    return jsonify({'success': True})


@app.route('/marketing_campaigns', methods=['GET'])
def get_marketing_campaigns():
    admin_users_only()
    return jsonify(get_all_marketing_campaigns())


@app.route('/marketing_campaigns', methods=['POST'])
def post_marketing_campaign_new():
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(create_marketing_campaign(g.user_id, params))


@app.route('/marketing_campaigns/<int:marketing_campaign_id>', methods=['POST'])
def post_marketing_campaign_update(marketing_campaign_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(update_marketing_campaign(marketing_campaign_id, params))


@app.route('/marketing_campaigns/<int:marketing_campaign_id>', methods=['GET'])
def get_marketing_campaign(marketing_campaign_id):
    admin_users_only()
    return jsonify(get_marketing_campaign_details(marketing_campaign_id))


@app.route('/user_created_documents', methods=['GET'])
def get_user_created_documents():
    admin_users_only()
    params = merge_two_dicts(request.args, {})
    return jsonify(get_all_created_documents(params))


@app.route('/user_created_documents', methods=['POST'])
def post_user_created_document():
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(queue_created_document(params, g.user_id))


@app.route('/new_document_url', methods=['GET'])
def get_response_headers():
    admin_users_only()
    params = merge_two_dicts(request.args, {})
    return jsonify(get_content_type_length(params))


#################################################################################################
#                                   Annotation Tasks and Jobs                                   #
#################################################################################################


@app.route('/annotation_tasks', methods=['GET'])
def list_annotation_tasks():
    qa_or_contributor_users_only()
    params = merge_two_dicts(request.args, {})
    return jsonify(get_all_annotation_tasks(g.user_id, params, is_qa_user=g.qa_user, is_contributor_user=g.contributor_user))

@app.route('/annotation_tasks/<int:annotation_task_id>/task_group_labels', methods=['GET'])
def list_annotation_task_group_tags_for_task(annotation_task_id):
    qa_or_contributor_users_only()
    return jsonify(get_annotation_task_group_tags_for_task(annotation_task_id))

@app.route('/annotation_tasks', methods=['POST'])
def post_annotation_task():
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(create_annotation_task(params))


@app.route('/annotation_tasks/<int:annotation_task_id>', methods=['POST'])
def post_annotation_task_update(annotation_task_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(update_annotation_task(annotation_task_id, params))


@app.route('/annotation_tasks/<int:annotation_task_id>/annotation_jobs/pop', methods=['GET'])
def get_annotation_job_from_queue(annotation_task_id):
    return jsonify(pop_annotation_job_from_queue(annotation_task_id, g.user_id))


@app.route('/annotation_tasks/<int:annotation_task_id>/annotation_jobs/<int:annotation_job_id>', methods=['GET'])
def get_existing_annotation_job(annotation_task_id, annotation_job_id):
    return jsonify(get_annotation_job_by_id(annotation_task_id, annotation_job_id, g.user_id))


@app.route('/annotation_tasks/<int:annotation_task_id>/annotation_jobs/<int:annotation_job_id>', methods=['POST'])
def post_annotations_for_job(annotation_task_id, annotation_job_id):
    params = json.loads(request.get_data())

    # FIXME, when we start using task types as originally intended, fix this to vary on type
    annotation_task_type = db_session_users.query(AnnotationTask.type).filter_by(id=annotation_task_id).first()[0]
    if annotation_task_type == 'contributor':
        return jsonify(create_review_for_job(annotation_task_id, annotation_job_id, g.user_id, params))
    return create_annotations_for_job(annotation_task_id, annotation_job_id, g.user_id, annotation_task_type, params)


@app.route('/annotation_tasks/<int:annotation_task_id>/annotation_jobs', methods=['GET'])
def list_annotation_job_queue(annotation_task_id):
    qa_or_contributor_users_only()
    params = merge_two_dicts(request.args, {})
    return jsonify(get_annotation_jobs_for_task(annotation_task_id, params))


@app.route('/annotation_tasks/<int:annotation_task_id>/topic_annotations', methods=['GET'])
def show_annotation_breakdown(annotation_task_id):
    admin_users_only()
    params = merge_two_dicts(request.args, {})
    return jsonify(get_topic_annotation_breakdown_for_task(annotation_task_id, params))


@app.route('/annotation_tasks/<int:annotation_task_id>/contributor_reviews', methods=['GET'])
def get_contributor_reviews_count(annotation_task_id):
    params = merge_two_dicts(request.args, {})
    return jsonify(get_reviews_count_for_user(annotation_task_id, g.user_id, params))


@app.route('/annotation_tasks/<int:annotation_task_id>/contributor_review_breakdown', methods=['GET'])
def show_contributor_review_breakdown(annotation_task_id):
    admin_users_only()
    params = merge_two_dicts(request.args, {})
    return jsonify(get_review_breakdown_for_task(annotation_task_id, params))

@app.route('/annotation_tasks/<int:annotation_task_id>', methods=['DELETE'])
def del_annotation_task(annotation_task_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return delete_annotation_task(annotation_task_id, params)

@app.route('/topics', methods=['GET'])
def get_topics():
    params = merge_two_dicts(request.args, {})
    topics = get_user_topics()
    return jsonify({'topics': topics})


@app.route('/topics', methods=['POST'])
def post_user_topics():
    params = json.loads(request.get_data())
    return jsonify(update_user_topics(params))


@app.route('/annotation_jobs/skipped', methods=['GET'])
def get_skipped_annotation_jobs():
    admin_users_only()
    return jsonify(get_all_skipped_annotation_jobs())


#################################################################################################
#                                   Annotation Task Groups                                      #
#################################################################################################


@app.route('/annotation_task_groups', methods=['GET'])
def list_all_annotation_task_groups():
    admin_users_only()
    return jsonify(get_all_annotation_task_groups())


# this is more like a general method to return metadata about this annotation task group by id
@app.route('/annotation_task_groups/<int:annotation_task_group_id>', methods=['GET'])
def list_annotation_tasks_in_group(annotation_task_group_id):
    admin_users_only()
    return get_all_annotation_tasks_in_group(annotation_task_group_id)  # response jsonified in helper


@app.route('/annotation_task_groups', methods=['POST'])
def post_annotation_task_group():
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(create_annotation_task_group(params))


@app.route('/annotation_task_groups/<int:annotation_task_group_id>', methods=['POST'])
def post_annotation_task_group_update(annotation_task_group_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return update_annotation_task_group(annotation_task_group_id, params)  # response jsonified in helper


@app.route('/annotation_task_groups/<int:annotation_task_group_id>', methods=['DELETE'])
def del_annotation_task_group(annotation_task_group_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return delete_annotation_task_group(annotation_task_group_id, params)


# route to list topic annotations judgments for given annotation_task_group (useful for onboarding mode)
@app.route('/annotation_task_groups/topic_annotations/<int:annotation_task_group_id>', methods=['GET'])
def list_topic_annotations_in_group(annotation_task_group_id):
    admin_users_only()
    params = merge_two_dicts(request.args, {})  # can contain sorting/filtering values
    return get_all_topic_annotations_in_group(annotation_task_group_id, params)


# route to list topic annotations user statistics for given annotation_task_group (useful for onboarding mode)
@app.route('/annotation_task_groups/user_statistics', methods=['GET'])
def list_user_accuracies_for_topic_group():
    admin_users_only()
    params = merge_two_dicts(request.args, {})  # can contain sorting and filtering values
    return get_user_accuracies_for_topic_group(params)


#################################################################################################
#                                   Aggregated Annotations                                      #
#################################################################################################

# NB: this route shouldn't be used unless get_aggregated_annotations is updated to allow no
#     topic_id in url request
@app.route('/all_aggregated_annotations', methods=['GET'])
def list_all_aggregated_annotations():
    admin_users_only()
    params = merge_two_dicts(request.args, {})
    return get_aggregated_annotations(None, params)

@app.route('/aggregated_annotations/<int:topic_id>', methods=['GET'])
def list_aggregated_annotations(topic_id):
    admin_users_only()
    params = merge_two_dicts(request.args, {})
    return get_aggregated_annotations(topic_id, params)

@app.route('/aggregated_annotations/<int:aggregated_annotation_id>', methods=['POST'])
def post_aggregated_annotation_update(aggregated_annotation_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return update_aggregated_annotation(aggregated_annotation_id, params)

@app.route('/aggregated_annotations/research/<int:aggregated_annotation_id>', methods=['POST'])
def post_research_mode_expanded_view_update(aggregated_annotation_id):
    admin_users_only()
    params = json.loads(request.get_data())  # topic_annotation_id must be in params
    return update_research_mode_expanded_view(aggregated_annotation_id, params)

@app.route('/aggregated_annotations/gold/<int:aggregated_annotation_id>', methods=['POST'])
def post_research_mode_gold_standard_update(aggregated_annotation_id):
    admin_users_only()
    params = json.loads(request.get_data())  # must contain id of topic_annotation to update
    return update_research_mode_gold_standard(aggregated_annotation_id, params)


#################################################################################################
#################################################################################################


@app.route('/data_updates', methods=['POST'])
def handle_update():
    params = json.loads(request.get_data())
    return jsonify(handle_data_updates(params))

@app.route('/subscriptions/<int:subscription_id>', methods=['POST'])
def post_subscriiption_update(subscription_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return jsonify(update_subscription(subscription_id, params))

@app.route('/plans', methods=['GET'])
def fetch_all_plans():
    admin_users_only()
    return jsonify(get_all_plans())


#################################################################################################
#                                             Teams                                             #
#################################################################################################

@app.route('/teams', methods=['POST'])
def add_user_team():
    admin_users_only()
    params = json.loads(request.get_data())
    return add_team(params)

@app.route('/teams/<int:team_id>/team_members', methods=['POST'])
def add_user_to_team(team_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return add_team_member(team_id, params)

@app.route('/teams', methods=['GET'])
def return_all_teams():
    admin_users_only()
    return get_all_teams()

@app.route('/teams/<int:team_id>/team_members', methods=['GET'])
def return_all_team_members(team_id):
    return get_all_team_members(team_id)

@app.route('/teams/<int:team_id>', methods=['POST'])
def update_user_team(team_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return update_team(team_id, params)

@app.route('/teams/<int:team_id>/team_members', methods=['DELETE'])
def delete_team_member(team_id):
    admin_users_only()
    params = json.loads(request.get_data())
    return remove_team_member(team_id, params)

@app.route('/teams/<int:team_id>', methods=['DELETE'])
def delete_user_team(team_id):
    admin_users_only()
    return delete_team(team_id)


#################################################################################################
#                                   Google Analytics Reporting                                  #
#################################################################################################

@app.route('/google_analytics_top_documents', methods=['GET'])
def get_top_documents():
    params = merge_two_dicts(request.args, {})
    event_action = params.get('event_action', None)
    results = request_documents(event_action)
    return jsonify({"event_action": event_action, "documents": results['rows']})


#################################################################################################
#                                   OAuth2                                             #
#################################################################################################

@app.route("/auth_linkedin_token", methods=['POST'])
def linkedin_authorized():
    linkedinToken = request.form.get("linkedinToken", None)
    marketing_campaign_token = request.form.get("token", None)
    if not linkedinToken:
        auth_data = {
            'client_id': LINKEDIN_CLIENT_ID, 'client_secret': LINKEDIN_CLIENT_SECRET, 'code': request.form.get("code", ''),
            'grant_type': "authorization_code", 'redirect_uri': request.form.get("redirect_uri", '')
        }
        r = requests.post(url="https://www.linkedin.com/oauth/v2/accessToken", data=auth_data)
        if r.status_code != requests.codes.ok or not r.json().get("access_token"):
            return jsonify({'error': 'Invalid response from LinkedIn'}), 400
        token = r.json().get("access_token")
    else :
        token = linkedinToken

    r = requests.get(url="https://api.linkedin.com/v1/people/~:(id,email-address,firstName,lastName,headline,industry,location,positions,public-profile-url,num-connections,summary,specialties)",
                     params={'format': 'json'}, headers={'Authorization': "Bearer {}".format(token)})

    if r.status_code != requests.codes.ok:
        return jsonify({'error': 'Cannot obtain token from LinkedIn'}), 400

    linkedin_data = r.json()

    if not linkedin_data.get('emailAddress'):
        return jsonify({
            'error': "LinkedIn auth was successful but no email address returned. Check the app's permissions"
        }), 400

    email = linkedin_data.get('emailAddress').lower()

    if linkedin_data.get('positions') and linkedin_data['positions']['_total'] >= 1:
        company = linkedin_data['positions']['values'][0]['company']['name']
    else:
        company = None

    user = db_session_users.query(User).filter_by(email=email).scalar()
    g.user_email = email
    is_contributor = request.form.get("is_contributor") == 'true'
    user_info = {
        'email': email, 'enabled': True, 'first_name': linkedin_data.get('firstName'), 'last_name': linkedin_data.get('lastName'),
        'industry': linkedin_data.get('industry'), 'company': company, 'linkedin_id': linkedin_data.get('id'),
        'new_password': str(uuid.uuid4()), 'linkedin_data': linkedin_data, 'is_contributor': is_contributor
    }

    if user:
        if not user.linkedin:
            user.linkedin_user_info = user_info
        return authorize(user)
    else:
        termsAgreed = request.form.get("termsAgreed", False)

        if termsAgreed != 'true':
            # this means it's a new user trying to login (not signup) with linkedin or
            # they didn't check terms aggreed on /activate.
            # they should be redirected to /socialcallback to signup
            response = {'redirectToCallback': '/socialcallback', 'loginType': 'linkedin', 'token': token}
            if marketing_campaign_token is not None:
                response['marketing_campaign_token'] = marketing_campaign_token
            if is_contributor:
                response['user_role'] = 'contributor'
            return jsonify(response)


        if marketing_campaign_token is not None:
            user_info['token'] = marketing_campaign_token
        return activate_user(user_info)
@app.route("/auth_google_token", methods=['POST'])
def google_authorized():
    access_token = request.form.get("accessToken", '')
    marketing_campaign_token = request.form.get("token", None)

    r = requests.get(url="https://www.googleapis.com/oauth2/v3/tokeninfo?access_token="+access_token)

    if r.status_code != requests.codes.ok:
        return jsonify({'error': 'Invalid response from Google'}), 400

    r = requests.get(url="https://www.googleapis.com/oauth2/v1/userinfo", params=dict(access_token=access_token))

    if r.status_code != requests.codes.ok:
        return jsonify({'error': 'Cannot obtain user from Google'}), 401
    r = r.json()

    if not r.get('email'):
        return jsonify({
            'error': "Google auth was successful but no email address returned. Check the app's permissions"
        }), 400

    email = r.get('email').lower()
    user = db_session_users.query(User).filter_by(email=email).scalar()
    g.user_email = email
    is_contributor = request.form.get("is_contributor") == 'true'

    user_info = {
        'email': email, 'enabled': True, 'first_name': r.get("given_name"),
        'last_name': r.get("family_name"), 'google_id': r.get('id'), 'new_password': str(uuid.uuid4()), 'is_contributor': is_contributor
    }
    if user:
        if not user.google_id:
            user.google_user_info = user_info
        return authorize(user)
    else:
        termsAgreed = request.form.get("termsAgreed", False)
        if termsAgreed != 'true':
                # this means it's a new user trying to login (not signup) with google or
                # they didn't check terms aggreed on /activate.
                # they should be redirected to /socialcallback to signup
                response = {'redirectToCallback': '/socialcallback', 'loginType': 'google'}
                if marketing_campaign_token is not None:
                    response['marketing_campaign_token'] = marketing_campaign_token
                if is_contributor:
                    response['user_role'] = 'contributor'
                return jsonify(response)


        if marketing_campaign_token is not None:
            user_info['token'] = marketing_campaign_token
        return activate_user(user_info)


#################################################################################################
#                                   Web Sockets                                                 #
#################################################################################################
@socket.on('connect')
def handle_connect():
    raw_token = request.args.get('token')
    verify_jwt_token(raw_token, request, True)

@socket.on('join')
def on_join(room):
    raw_token = request.args.get('token')
    user_id = verify_jwt_token(raw_token, request, True)
    if user_id is not None and user_id == room:
        join_room(room)
        emit('foldersNotification',room=room)

#################################################################################################
#                                   Application Cleanup                                         #
#################################################################################################

# for each request, log the user's email who performed the action, the status/method/path/ip and then the long
# form url at the end with deeper details on query arguments and such
@app.after_request
def after_log(response):
    user_email = getattr(g, 'user_email', '')
    user_token = getattr(g, 'user_token', '')
    if API_ENV != 'testing':
        app.logger.info('\t'.join([
            user_email,
            str(response.status_code),
            request.method,
            request.path,
            request.remote_addr,
            request.query_string,
            user_token])
        )

    # n.b. there be dragons here if you don't return the response
    return response


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session_users.remove()

# from: https://github.com/jgelens/gevent-websocket
def websocket_app(environ, start_response):
    if environ["PATH_INFO"] == '/echo':
        ws = environ["wsgi.websocket"]
        message = ws.receive()
        ws.send(message)

if __name__ == '__main__':
    if API_BOUND_HOST and API_PORT:
        app.run(host=API_BOUND_HOST, port=int(API_PORT))

        # from: https://github.com/jgelens/gevent-websocket
        server = pywsgi.WSGIServer((API_BOUND_HOST, API_PORT), websocket_app,
        handler_class=WebSocketHandler)
        server.serve_forever()

    else:
        app.run()
        server = pywsgi.WSGIServer((), websocket_app,
        handler_class=WebSocketHandler)
        server.serve_forever()
