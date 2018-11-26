from flask import jsonify
from helpers.utilities import merge_two_dicts
from models import db_session_users, UserCreatedDocument
import requests

def get_all_created_documents(params):
    query = db_session_users.query(UserCreatedDocument)
    if 'user_id' in params:
        query = query.filter_by(user_id=params['user_id'])
    if 'status' in params:
        query = query.filter_by(status=params['status'])
    return {"user_created_documents": [d.to_dict() for d in query]}

def queue_created_document(params, user_id):
    created_doc = UserCreatedDocument(merge_two_dicts({"user_id": user_id}, params))
    db_session_users.add(created_doc)
    db_session_users.commit()
    db_session_users.refresh(created_doc)
    return {'user_created_document': created_doc.to_dict()}

def get_content_type_length(params):
    url = params.get('url', None)
    if not url:
        return {'errors': "Url is not found in parameters"}
    response = requests.head(url)
    if response.status_code == 200:
        return {'Content-Type': response.headers['Content-Type'], 'Content-Length': response.headers['Content-Length']}
    return {'Content-Type': None, 'Content-Length': None}
