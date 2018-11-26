import argparse
from apiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials
import httplib2
from oauth2client import client
from oauth2client import tools
from settings import GA_PRIVATE_KEY_ID, GA_PRIVATE_KEY, GA_CLIENT_EMAIL, GA_HOSTNAME_FILTER

SCOPE = ['https://www.googleapis.com/auth/analytics.readonly']
PROFILE_ID = '134141911'
ValidEventActions = ["View document", "Received search results", "Download document", "Print document", "Email document"]
API_NAME = "analytics"
API_VERSION = "v3"

# Get a service that is connected to the specified Google API
def get_service():
  private_key = GA_PRIVATE_KEY.replace("\\n", "\n")
  keyfile_dict = {
    "type": "service_account",
    "project_id": "jurispect-admin-tool",
    "private_key_id": GA_PRIVATE_KEY_ID,
    "private_key": private_key,
    "client_email": GA_CLIENT_EMAIL,
    "client_id": "109797925697382442319",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/jurispect-service-account%40jurispect-admin-tool.iam.gserviceaccount.com"
  }
  
  credentials = ServiceAccountCredentials.from_json_keyfile_dict(
    keyfile_dict, SCOPE)
  http = credentials.authorize(httplib2.Http(timeout=180000))
  # Build the service object.
  service = build(API_NAME, API_VERSION, http=http)
  return service

def request_documents(event_action):
  service = get_service()
  if not event_action or not event_action in ValidEventActions:
        return {'errors': "Event action must be one of: " + str(ValidEventActions)}

  # Use the Analytics Service Object to query the Core Reporting API 
  return service.data().ga().get(
    ids='ga:' + PROFILE_ID,
    start_date='30daysAgo',
    end_date='today',
    metrics='ga:totalEvents',
    dimensions='ga:eventLabel',
    sort='-ga:totalEvents',
    filters='ga:hostname=@%s;ga:eventLabel!=(not set);ga:eventAction==%s' %(GA_HOSTNAME_FILTER, event_action),
    max_results='10').execute()
