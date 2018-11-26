import os
import sys
import re
import json
import requests
import datetime as dt
from sqlalchemy.orm import sessionmaker

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

from shared_env import *
from schemas import base as jorm

synonym_map = json.loads(open(this_folder + '/./tmp_data/synonyms.json').read())

session = jorm.Session()
for a_name in synonym_map:
    a = session.query( jorm.Agency ).filter( jorm.Agency.name == a_name ).scalar()
    w = a.words
    syn = set(a.synonyms())
    for s in synonym_map[a_name]:
        syn.add(s)
    w.synonyms = list(syn)
    print "{}: {} --> {}".format(a.id, a_name, str(w.synonyms))
    session.add(w)
session.commit()
session.close()
