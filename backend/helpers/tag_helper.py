from models import *
from flask import jsonify


def get_all_tags(user_id):
    user_tags = db_session_users.query(UserTag).filter_by(user_id=user_id).all()
    active_system_tags = db_session_users.query(UserTag).filter_by(user_id=None, active_suggestion=True).all()
    return jsonify({
        'user': [t.to_dict() for t in user_tags],
        'system': [t.to_dict() for t in active_system_tags],
    })


def update_tag(tag_id, user_id, params):
    tag = db_session_users.query(UserTag).filter_by(id=tag_id, user_id=user_id).first()

    if not tag:
        return jsonify({'errors': "No user tags exist for id:" + str(tag_id)}), 404

    name_update = params.get('name', None)
    if name_update:
        name_conflict = db_session_users.query(UserTag).filter_by(user_id=user_id, name=name_update).first()
        if name_conflict:
            return jsonify({'errors': "Tag name:" + name_update + " is already taken"}), 400

        tag.name = name_update

        db_session_users.add(tag)
        db_session_users.commit()

    return jsonify(tag.to_dict())


def create_tag(user_id, params):
    tag_name = params.get('name', None)

    if not tag_name:
        return jsonify({'errors': "Tag name required"}), 400

    name_conflict_user = db_session_users.query(UserTag).filter_by(user_id=user_id, name=tag_name).first()
    name_conflict_system = db_session_users.query(UserTag).filter_by(user_id=None, name=tag_name).first()
    if name_conflict_user or name_conflict_system:
        return jsonify({'errors': "Tag name:" + tag_name + " is already taken"}), 400

    new_tag = UserTag(user_id=user_id, name=tag_name, provenance='user')

    db_session_users.add(new_tag)
    db_session_users.commit()
    db_session_users.refresh(new_tag)

    return jsonify(new_tag.to_dict())