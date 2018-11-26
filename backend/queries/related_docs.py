import os
import sys
from werkzeug.datastructures import MultiDict
from random import shuffle

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/..')

from settings import BASE_URL_FOR_EMAIL, BUGSNAG_API_KEY
from models import *
from helpers.document_helper import get_filtered_documents
from helpers.agency_helper import get_followed_agency_ids_with_backoff
import schemas.jurasticsearch as jsearch

distinct_document_types = jsearch.get_distinct_attribute_values('category')

user = db_session_users.query(User).first()
params = MultiDict({})
docs, _ = get_filtered_documents(params, user.id)
shuffle(docs)
first_doc = docs[0]
print(first_doc['title'])
params = MultiDict({"more_like_doc_id": first_doc['id']})
more_like, _ = get_filtered_documents(params, user.id)

#print([d['id'] for d in more_like])
for d in more_like:
    print(str(d['id']) + ":" + d['title'])
