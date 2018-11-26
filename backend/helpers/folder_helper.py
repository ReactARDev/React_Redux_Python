from models import *
from flask import jsonify
from flask_socketio import emit
from helpers.utilities import merge_two_dicts
from helpers.emailhelper import EmailHelper
from collections import defaultdict
from settings import API_BOUND_HOST, API_PORT, BASE_URL_FOR_EMAIL

email_helper = EmailHelper()


def create_folder(user_id, params):
    folder_name = params.get('name', None)

    if not folder_name:
        return jsonify({'errors': "Folder name required"}), 400

    name_conflict_user = db_session_users.query(UserFolder).filter_by(user_id=user_id, name=folder_name).first()
    if name_conflict_user:
        return jsonify({'errors': "Folder name: " + folder_name + " is already being used"}), 409

    new_folder = UserFolder(user_id=user_id, name=folder_name)

    db_session_users.add(new_folder)
    db_session_users.commit()
    db_session_users.refresh(new_folder)

    return jsonify(new_folder.to_dict())

def share_user_folder(folder_id, params):
    user_id = params.get('user_id', None);
    # user who creates shared folder should automatically have ownership permissions
    owner = params.get('owner', True)

    if not user_id:
        return jsonify({'errors': "user id required"}), 400

    new_shared_folder = UserSharedFolder(user_id=user_id, folder_id=folder_id, owner=owner)

    db_session_users.add(new_shared_folder)
    db_session_users.commit()
    db_session_users.refresh(new_shared_folder)

    return jsonify(new_shared_folder.to_dict())

def add_users_to_shared_folder(folder_id, params):
    shared_folder = db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id).first()
    if not shared_folder:
        return jsonify({'errors': "No shared folder exists for id: " + str(folder_id)}), 404

    shared_folder_owner_id = db_session_users.query(UserFolder.user_id).filter_by(id=folder_id).first()

    user_shared_folders = []
    mandrill_recipients = []
    for user in params['users']:
        user_access_to_folder = db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id, user_id=user['id']).first()
        if user_access_to_folder:
            return jsonify({'errors': 'Folder already shared with user'}), 409
        elif (shared_folder_owner_id != user['id']): # no need to notify owner
            new_user_shared_folder = UserSharedFolder({
                "user_id": user['id'],
                "folder_id": folder_id,
                "editor": user['editor'],
                "viewer": user['viewer']
            })
            user_shared_folders.append(new_user_shared_folder)

            # new sharees need to be notified and emailed
            user_from_db = db_session_users.query(User).filter_by(id=user['id']).first()

            mandrill_recipients.append({
                'email': user_from_db.email,
                'name': user_from_db.first_name,
                'type': 'to'
            })

            if 'notif_status' in user_from_db.properties:
                folder_status = {
                    "user_folders": {"viewed_status": False}
                }
                new_notif_status = merge_two_dicts(user_from_db.properties['notif_status'], folder_status)
            else:
                new_notif_status = {
                    "user_folders": {"viewed_status": False}
                }

            new_props = merge_two_dicts(user_from_db.properties,{'notif_status': new_notif_status})
            user_from_db.properties = merge_two_dicts(user_from_db.properties, new_props)
            db_session_users.add(user_from_db)
            db_session_users.commit()

    db_session_users.add_all(user_shared_folders)
    db_session_users.commit()

    from app import socket
    for user in user_shared_folders:
        socket.emit('foldersNotification', room = user.user_id)

    if BASE_URL_FOR_EMAIL:
        base_url = BASE_URL_FOR_EMAIL
    else:
        base_url = 'http://%s:%s' % (API_BOUND_HOST, API_PORT)

    if 'user_msg' in params:
        user_msg = params['user_msg']
    else:
        user_msg = ''

    shared_folder_owner = db_session_users.query(User).filter_by(id=shared_folder_owner_id).first()

    if shared_folder_owner.first_name is not None:
        owner_first_name = shared_folder_owner.first_name + ' has'
    else:
        owner_first_name = 'I&apos;ve'

    folder_url = '%s/content?folderTimelineView=true&no_skipping=true&folder_id=%s' % (
        base_url,
        folder_id,
    )
    #email sharees
    email_helper.send_via_mandrill(
        mandrill_recipients,
        'noreply@compliance.ai',
        'Compliance.ai',
        'A Compliance.ai folder has been shared with you!',
        template='shared-folder-inline',
        vars={
        'url': folder_url,
        'base_url': base_url,
        'user_msg': user_msg,
        'owner_first_name': owner_first_name,
        },
    )

    return jsonify({'folder_shared_with_users': True})

def update_shared_folder_permissions(folder_id, params):
    shared_folder = db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id).first()

    if not shared_folder:
        return jsonify({'errors': "No shared folder exists for id: " + str(folder_id)}), 404
    
    # add/update users in shared folder
    if params['users']: 
        all_users_access_to_folders = db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id).filter(UserSharedFolder.user_id.in_([u['id'] for u in params['users']]))
        user_access_map = {f.user_id: f for f in all_users_access_to_folders}
        user_updated_shared_folders = []  
        
        for user in params['users']:
            if user['id'] not in user_access_map:
                new_user_shared_folder = UserSharedFolder({
                    "user_id": user['id'],
                    "folder_id": folder_id,
                    "editor": user['editor'],
                    "viewer": user['viewer']
                })
                db_session_users.add(new_user_shared_folder)
                db_session_users.commit()
            else:
                user_access_map[user['id']].owner = user.get('owner', None)
                user_access_map[user['id']].editor = user.get('editor', None)
                user_access_map[user['id']].viewer = user.get('viewer', None)
                user_updated_shared_folders.append(user_access_map[user['id']])
        
        db_session_users.add_all(user_updated_shared_folders)
        db_session_users.commit()
    
    # delete users from shared folder
    if params['removed_users']:       
        for user_shared_folder in db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id).filter(UserSharedFolder.user_id.in_(params['removed_users'])).all():
            # be sure to never remove the owner
            if not user_shared_folder.owner:
                db_session_users.delete(user_shared_folder)
    
        db_session_users.commit()
    
    return jsonify({'shared_folder_updated': True})

def get_all_folders(user_id):
    # Gather all of the user's folders and shared folder ids 
    all_personal_user_folders = db_session_users.query(UserFolder).filter_by(user_id=user_id).all()
    all_user_shared_folder_ids = [f[0] for f in db_session_users.query(UserSharedFolder.folder_id).filter_by(user_id=user_id).all()]
    # filter out personal folders using shared folders ids    
    personal_folders = []
    for folder in all_personal_user_folders:
        if folder.id not in all_user_shared_folder_ids: 
            personal_folders.append(folder.to_dict())
    # Gather all of the user's shared folders
    shared_folders = []        
    all_user_shared_folders = db_session_users.query(UserSharedFolder).filter_by(user_id=user_id).all()
    all_users_of_shared_folder = db_session_users.query(UserSharedFolder).filter(UserSharedFolder.folder_id.in_([f.folder_id for f in all_user_shared_folders])).all()
    
    all_relevant_users = db_session_users.query(User).filter(User.id.in_([f.user_id for f in all_users_of_shared_folder]))
    relevant_user_lookup = {u.id: u for u in all_relevant_users}
    
    folder_id_to_user_shared_folders = defaultdict(list)
    
    for f in all_users_of_shared_folder:
        folder_id_to_user_shared_folders[f.folder_id].append(f)
        
    for folder in db_session_users.query(UserFolder).filter(UserFolder.id.in_([f.folder_id for f in all_user_shared_folders])):
        # Gather all of the users with whom the folder was shared 
        shared_folder_users = []
        for shared_folder_user in folder_id_to_user_shared_folders[folder.id]:
            # Finally gather the permissions assigned to each user in the shared folder
            user_permission = {}
            if (shared_folder_user.owner):
                user_permission['user_permission_access'] = 'owner'
            elif (shared_folder_user.editor):
                user_permission['user_permission_access'] = 'editor'
            else:
                user_permission['user_permission_access'] = 'viewer'
                
            shared_folder_users.append(merge_two_dicts(relevant_user_lookup[shared_folder_user.user_id].to_dict(), user_permission));
            
        folder_users_data = {}
        folder_users_data['shared_folder_users'] = shared_folder_users
        
        shared_folders.append(merge_two_dicts(folder.to_dict(), folder_users_data)) 
            
    return jsonify({
        'personal_folders': personal_folders,
        'shared_folders': shared_folders
    })

def update_folder(folder_id, user_id, params):
    folder = db_session_users.query(UserFolder).filter_by(id=folder_id).first()

    if not folder:
        return jsonify({'errors': "No folder exists for id: " + str(folder_id)}), 404

    share_folder = params.get('share', None)
    if share_folder:
        return share_user_folder(folder_id, params)

    add_users_to_shared = params.get('share_add_users', None)
    if add_users_to_shared:
        return add_users_to_shared_folder(folder_id, params)

    update_user_permissions = params.get('update_share_permissions', None)
    if update_user_permissions:
        return update_shared_folder_permissions(folder_id, params)

    name_update = params.get('name', None)
    if name_update:
        name_conflict = db_session_users.query(UserFolder).filter_by(user_id=user_id, name=name_update).first()
        if name_conflict:
            return jsonify({'errors': "Folder name: " + name_update + " is already being used"}), 409

        folder.name = name_update

        db_session_users.add(folder)
        db_session_users.commit()

    return jsonify(folder.to_dict())

def add_docs_to_folder(params):
    folder_id = params['folder_id']
    user_folder_documents = []
    for doc_id in params['document_ids']:
        document_in_folder = db_session_users.query(UserFolderDocument).filter_by(user_folder_id=folder_id, doc_id=doc_id).first()

        if document_in_folder:
            return {'errors': 'Selected document is already saved in folder'}
        else:
            new_folder_document = UserFolderDocument({
                "user_folder_id": folder_id,
                "doc_id": doc_id,
            })
            user_folder_documents.append(new_folder_document)

    db_session_users.add_all(user_folder_documents)
    db_session_users.commit()

    return {'documents_added_to_folder': True}

def delete_folder_or_document_from_folder(folder_id, user_id, params):
    folder = db_session_users.query(UserFolder).filter_by(id=folder_id, user_id=user_id).first()
    if not folder:
        return jsonify({'errors': "No folder exists for id: " + str(folder_id)}), 404

    doc_ids = params.get('document_ids', None)
    # check to see if deleting documents first
    if doc_ids is not None:
        for doc_id in doc_ids:
            document_in_folder = db_session_users.query(UserFolderDocument).filter_by(user_folder_id=folder_id, doc_id=doc_id).first()

            if not document_in_folder:
                return jsonify({'errors': "Document does not exists in " + folder.name}), 404

        db_session_users.query(UserFolderDocument).filter_by(user_folder_id=folder_id).filter(UserFolderDocument.doc_id.in_(doc_ids)).delete(synchronize_session=False)
        db_session_users.commit()

        return jsonify({'msg': 'Documents in ' + folder.name + ' successfully deleted'})
    # else delete folder
    else:
        # if folder shared, remove from shared folder table then delete
        shared_folder = db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id).first()
        if shared_folder:
            db_session_users.query(UserSharedFolder).filter_by(folder_id=folder_id).delete()

        db_session_users.query(UserFolderDocument).filter_by(user_folder_id=folder_id).delete()
        db_session_users.delete(folder)
        db_session_users.commit()

        return jsonify({'msg': 'Folder ' + folder.name + ' successfully deleted'})
