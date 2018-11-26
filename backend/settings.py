import os
import sys
from os.path import join, dirname
from dotenv import load_dotenv

# make sure we load the dotenv configuration when NOT on heroku. heroku uses environment variables, while local
# instantiations of the application use the .env file. this allows local code to hit whichever environment happens
# to be configured in .env. this switch requires heroku to have an environment variable set called "HEROKU", with any
# truthy value
if "HEROKU" not in os.environ:
    dotenv_path = join(dirname(__file__), '.env' )
    load_dotenv(dotenv_path)

# default to development if no API_ENV was provided
API_ENV = os.environ.get('API_ENV')
if API_ENV == None:
    API_ENV = "development"

# detect if we are in testing mode and force the api environment and database name vars to be testing
if 'nose' in sys.modules.keys():
    API_ENV = "testing"
    JURISPECT_USERS_DB_NAME = 'testing_users'
    REGISTRATION_DOMAINS = 'jurispect.com,example.com'
    ACTIVE_INDEX_NAME = 'testing'
else:
    JURISPECT_USERS_DB_NAME = os.environ.get("JURISPECT_USERS_DB_NAME")
    REGISTRATION_DOMAINS = os.environ.get("REGISTRATION_DOMAINS")
    ACTIVE_INDEX_NAME = os.environ.get("ACTIVE_INDEX_NAME")  ## The current index: accessed by "recent" text pipeline and api


JURISPECT_USERS_DB_URL      = os.environ.get("JURISPECT_USERS_DB_URL")
JURISPECT_USERS_DB_USER     = os.environ.get("JURISPECT_USERS_DB_USER")
JURISPECT_USERS_DB_PASSWORD = os.environ.get("JURISPECT_USERS_DB_PASSWORD")

ES_HOST = os.environ.get("ES_HOST")

AWS_ACCESS_KEY_ID     = os.environ.get( "AWS_ACCESS_KEY_ID" )
AWS_SECRET_ACCESS_KEY = os.environ.get( "AWS_SECRET_ACCESS_KEY" )
AWS_BUCKET            = os.environ.get( "AWS_BUCKET" )
MOCK_S3_DATASTORE     = os.environ.get("MOCK_S3_DATASTORE")

BUGSNAG_API_KEY = os.environ.get("BUGSNAG_API_KEY")

API_BOUND_HOST  = os.environ.get("API_BOUND_HOST")
API_PORT        = os.environ.get("API_PORT")
SECRET_JWT      = os.environ.get("SECRET_JWT")
LOG_QUERIES     = (os.environ.get("LOG_QUERIES") != None)

SMTP_HOST   = os.environ.get("SMTP_HOST")
SMTP_PORT   = os.environ.get("SMTP_PORT")
SMTP_SSL    = os.environ.get("SMTP_SSL")
SMTP_TLS    = os.environ.get("SMTP_TLS")
PROXIMO_URL = os.environ.get("PROXIMO_URL")
SMTP_LOGIN = os.environ.get("SMTP_LOGIN")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")

# associates the current running api with the url of the frontend application running against it
BASE_URL_FOR_EMAIL = os.environ.get("BASE_URL_FOR_EMAIL")
MANDRILL_API_KEY = os.environ.get('MANDRILL_API_KEY')

GA_PRIVATE_KEY_ID = os.environ.get("GA_PRIVATE_KEY_ID")
GA_PRIVATE_KEY = os.environ.get("GA_PRIVATE_KEY")
GA_CLIENT_EMAIL = os.environ.get("GA_CLIENT_EMAIL")
GA_HOSTNAME_FILTER = os.environ.get("GA_HOSTNAME_FILTER")

## Integration User DB:
STAGE_USERS_DB_NAME = os.environ.get("STAGE_USERS_DB_NAME")
STAGE_USERS_DB_USER = os.environ.get("STAGE_USERS_DB_USER")
STAGE_USERS_DB_URL = os.environ.get("STAGE_USERS_DB_URL")
STAGE_USERS_DB_PASSWORD = os.environ.get("STAGE_USERS_DB_PASSWORD")

## Production User DB:
PROD_USERS_DB_NAME = os.environ.get("PROD_USERS_DB_NAME")
PROD_USERS_DB_USER = os.environ.get("PROD_USERS_DB_USER")
PROD_USERS_DB_URL = os.environ.get("PROD_USERS_DB_URL")
PROD_USERS_DB_PASSWORD = os.environ.get("PROD_USERS_DB_PASSWORD")

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_SECRET_WEBHOOK_KEY = os.environ.get("STRIPE_SECRET_WEBHOOK_KEY")

LINKEDIN_CLIENT_ID = os.environ.get("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.environ.get("LINKEDIN_CLIENT_SECRET")

MAINSTREAM_NEWS_ENABLED = os.environ.get("MAINSTREAM_NEWS_ENABLED")
JURISPECT_API_URL = os.environ.get("JURISPECT_API_URL")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
