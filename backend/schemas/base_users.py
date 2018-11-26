import os
import sys
import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session #, relationship, backref
from coaster.sqlalchemy import TimestampMixin

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder)
sys.path.append(this_folder + '/../')
from settings import JURISPECT_USERS_DB_URL, JURISPECT_USERS_DB_USER, JURISPECT_USERS_DB_PASSWORD,\
    JURISPECT_USERS_DB_NAME, LOG_QUERIES, STAGE_USERS_DB_USER, STAGE_USERS_DB_PASSWORD, STAGE_USERS_DB_URL,\
    STAGE_USERS_DB_NAME, PROD_USERS_DB_USER, PROD_USERS_DB_PASSWORD, PROD_USERS_DB_URL, PROD_USERS_DB_NAME

def get_postgres_url(url, name, user, password=None):
    if password:
        return "postgresql://{}:{}@{}/{}".format(user, password, url, name)
    else:
        return "postgresql://{}@{}/{}".format(user, url, name)

url_users = get_postgres_url(JURISPECT_USERS_DB_URL, JURISPECT_USERS_DB_NAME, JURISPECT_USERS_DB_USER, JURISPECT_USERS_DB_PASSWORD)
engine_users     = create_engine(url_users, pool_size=20, echo=LOG_QUERIES)
db_session_users = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine_users))
BaseUsers       = declarative_base()
BaseUsers.query = db_session_users.query_property()

if STAGE_USERS_DB_URL:
    stage_url_users = get_postgres_url(STAGE_USERS_DB_URL, STAGE_USERS_DB_NAME, STAGE_USERS_DB_USER, STAGE_USERS_DB_PASSWORD)
    stage_engine_users = create_engine(stage_url_users, pool_size=20, echo=LOG_QUERIES)
    stage_db_session_users = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=stage_engine_users))
    BaseUsers.integration_query = stage_db_session_users.query_property()

if PROD_USERS_DB_URL:
    prod_url_users = get_postgres_url(PROD_USERS_DB_URL, PROD_USERS_DB_NAME, PROD_USERS_DB_USER, PROD_USERS_DB_PASSWORD)
    prod_engine_users = create_engine(prod_url_users, pool_size=20, echo=LOG_QUERIES)
    prod_db_session_users = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=prod_engine_users))
    BaseUsers.production_query = prod_db_session_users.query_property()

## Core data stores:
from .user import User
from .user_document import UserDocument
from .user_folder import UserFolder
from .user_folder_document import UserFolderDocument
from .topic_judgment import TopicJudgment
from .user_agency import UserAgency
from .search_regression_query import SearchRegressionQuery
from .search_assessment_result import SearchAssessmentResult

from .act_word_count import ActWordCount

from .user_tag import UserTag
from .user_document_tag import UserDocumentTag
from .user_followed_entity import UserFollowedEntity
from .user_flagged_document import UserFlaggedDocument
from .user_document_update import UserDocumentUpdate
from .user_saved_search import UserSavedSearch
from .user_created_document import UserCreatedDocument

from .marketing_campaign import MarketingCampaign
from .marketing_campaign_users import MarketingCampaignUsers
from .api_key import ApiKey

from .search_query import SearchQuery
from .user_search_query import UserSearchQuery
from .user_search_result_rating import UserSearchResultRating

from .contributor_point_type import ContributorPointType
from .user_contributor_points import UserContributorPoint

from .annotation_job import AnnotationJob
from .annotation_task import AnnotationTask
from .annotation_task_topic_group import AnnotationTaskTopicGroup
from .aggregated_annotations import AggregatedAnnotations
from .topic_annotation import TopicAnnotation
from .topic_annotation_excerpts import TopicAnnotationExcerpt
from .selected_sentence import SelectedSentence
from .annotation_task_term_sampling_group import AnnotationTaskTermSamplingGroup
from .user_topics import UserTopic
from .team import Team
from .team_members import TeamMember
from .user_shared_folders import UserSharedFolder
from .insights_tables import InsightsTable

# payment tables
from .coupons import Coupon
from .customers import Customer
from .payment_events import Payment_Event
from .plans import Plan
from .subscriptions import Subscription
from .invoices import Invoice

UsersSession = sessionmaker()
UsersSession.configure(bind=engine_users)
