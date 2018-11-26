import os
import sys
import json
import re

# add the default tags to the db. safe to run more than once

def add_default_user_tags():
    this_folder = os.path.dirname(os.path.realpath(__file__))
    sys.path.append(this_folder + '/../')
    from schemas import base_users as jorm_users
    from settings import API_ENV

    default_user_tags_list = json.loads(open('./test/fixtures/user_tags.json').read())

    session = jorm_users.UsersSession()

    for tag in default_user_tags_list:
        existing = session.query(jorm_users.UserTag).filter_by(name=tag['name']).scalar()
        if existing:
            print "skipping tag '%s' already in db" % tag['name']
        else:
            session.add(jorm_users.UserTag(name=tag['name'], provenance='system', active_suggestion=True))
            session.commit()
            print "added tag '%s'" % tag['name']

    session.close()

if __name__ == "__main__":
    add_default_user_tags()
