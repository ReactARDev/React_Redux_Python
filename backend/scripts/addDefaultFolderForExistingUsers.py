from models import *

def giveExistingUsersDefaultFolders():
    all_users = db_session_users.query(User).all()
    for user in all_users:
        read = db_session_users.query(UserFolder).filter_by(user_id=user.id, name='Read').first()
        if read is None:
            db_session_users.add(UserFolder({'name': 'Read', 'user_id': user.id}))

        bookmarked = db_session_users.query(UserFolder).filter_by(user_id=user.id, name='Bookmarked').first()
        if bookmarked is None:
            db_session_users.add(UserFolder({'name': 'Bookmarked', 'user_id': user.id}))

    db_session_users.commit()
