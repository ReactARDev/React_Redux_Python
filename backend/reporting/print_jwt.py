import os
import sys
import jwt
import requests
import random
import datetime as dt

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

from shared_env import *
from settings import SECRET_JWT

from schemas import base_users
from models import *
from app import app, db_session_users

from schemas import jurasticsearch as jsearch

this_folder = os.path.dirname(os.path.realpath(__file__))

# create a token to use for authorization for all api calls
user = db_session_users.query(User).filter_by(id=1).scalar()
seconds_until_expiration = 60 * 60 * 24 * 14
expiration_datetime = dt.datetime.utcnow() + dt.timedelta(seconds=seconds_until_expiration)
token = jwt.encode({'user_id': user.id, 'exp': expiration_datetime}, SECRET_JWT)

print token
