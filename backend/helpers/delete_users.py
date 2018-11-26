# To use this template, drop the list of emails to be deleted in the list below.
# For a list of emails one per line - format to valid syntax using regex replace: (.+) -> "$1",
# Then copy/paste the whole thing into a juriterm window pointed at the correct environment
from models import *

def delete_users(emails):
    for e in emails:
        u = db_session_users.query(User).filter_by(email=e).first()
        if u:
            db_session_users.query(UserSearchResultRating).filter_by(user_id=u.id).delete()
            db_session_users.query(UserSearchQuery).filter_by(user_id=u.id).delete()
            db_session_users.query(UserAgency).filter_by(user_id=u.id).delete()
            db_session_users.query(UserDocument).filter_by(user_id=u.id).delete()
            db_session_users.query(UserDocumentTag).filter_by(user_id=u.id).delete()
            db_session_users.query(UserDocumentUpdate).filter_by(user_id=u.id).delete()
            db_session_users.query(UserFlaggedDocument).filter_by(user_id=u.id).delete()
            db_session_users.query(UserFollowedEntity).filter_by(user_id=u.id).delete()
            db_session_users.query(UserSavedSearch).filter_by(user_id=u.id).delete()
            db_session_users.query(Customer).filter_by(user_id=u.id).delete()
            db_session_users.query(Invoice).filter_by(user_id=u.id).delete()
            db_session_users.query(Subscription).filter_by(user_id=u.id).delete()
            db_session_users.query(UserTopic).filter_by(user_id=u.id).delete()
            db_session_users.query(TeamMember).filter_by(user_id=u.id).delete()
            for f in db_session_users.query(UserFolder).filter_by(user_id=u.id).all():
                db_session_users.query(UserFolderDocument).filter_by(user_folder_id=f.id).delete()
            user_shared_folders = db_session_users.query(UserSharedFolder).filter_by(user_id=u.id).all()
            for f in user_shared_folders:
                if f.owner:
                    db_session_users.query(UserSharedFolder).filter_by(folder_id=f.folder_id).delete()
            db_session_users.query(UserSharedFolder).filter_by(user_id=u.id).delete()
            db_session_users.query(UserFolder).filter_by(user_id=u.id).delete()
            db_session_users.delete(u)

    db_session_users.commit()

def main():
    emails = [

    ]
    delete_users(emails)

if __name__ == '__main__':
	main()
