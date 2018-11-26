from models import *
from flask import jsonify
from helpers.folder_helper import delete_folder_or_document_from_folder

def get_all_teams():
    return jsonify({"teams": [team.to_dict() for team in db_session_users.query(Team).all()]})

def get_all_team_members(team_id):
    team_member_ids_subquery = db_session_users.query(TeamMember.user_id).filter_by(team_id=team_id).subquery()
    return jsonify({"team_members": [u.to_dict() for u in db_session_users.query(User).filter(User.id.in_(team_member_ids_subquery))]})

def add_team(params):
    name = params.get('name', None)

    if not name:
        return jsonify({'errors': "Team name required"}), 400

    name_conflict = db_session_users.query(Team).filter_by(name=name).first()
    if name_conflict:
        return jsonify({'errors': "Team name: " + name + " is already being used"}), 409

    new_team = Team(name=name)

    db_session_users.add(new_team)
    db_session_users.commit()
    db_session_users.refresh(new_team)

    return jsonify(new_team.to_dict())

def add_team_member(team_id, params):
    user_id = params['user_id']

    already_team_member = db_session_users.query(TeamMember).filter_by(team_id=team_id, user_id=user_id).first()
    if already_team_member:
        return jsonify({'errors': 'Selected user is already on Team'})

    new_team_member = TeamMember({
        "team_id": team_id,
        "user_id": user_id,
    })

    db_session_users.add(new_team_member)
    db_session_users.commit()
    db_session_users.refresh(new_team_member)

    return jsonify({'team_member_added': True})

def update_team(team_id, params):
    team = db_session_users.query(Team).filter_by(id=team_id).first()

    if not team:
        return jsonify({'errors': "No team exists for id: " + str(team_id)}), 404

    name_update = params.get('name', None)
    if name_update:
        name_conflict = db_session_users.query(Team).filter_by(id=team_id, name=name_update).first()
        if name_conflict:
            return jsonify({'errors': "Team name: " + name_update + " is already being used"}), 409

        team.name = name_update

        db_session_users.add(team)
        db_session_users.commit()

    return jsonify(team.to_dict())

def remove_team_member(team_id, params):
    user_id = params['user_id']
    team_member = db_session_users.query(TeamMember).filter_by(team_id=team_id, user_id=user_id).first()

    if not team_member:
        return jsonify({'errors': "Team member does not exsist in team with id: " + str(team_id)}), 404

    db_session_users.delete(team_member)
    db_session_users.commit()

    return jsonify({'team_member_removed': True})

def delete_team(team_id):
    team = db_session_users.query(Team).filter_by(id=team_id).first()
    if not team:
        return jsonify({'errors': "No team exists for id: " + str(team_id)}), 404

    # Remove any team members first
    team_members_ids = [team_member.user_id for team_member in db_session_users.query(TeamMember).filter_by(team_id=team_id).all()]
    db_session_users.query(TeamMember).filter_by(team_id=team_id).filter(TeamMember.user_id.in_(team_members_ids)).delete(synchronize_session=False)
    # then remove team
    db_session_users.delete(team)
    db_session_users.commit()

    return jsonify({'msg': 'Team ' + team.name + ' successfully deleted'})

##########################################################
# Only to be utlized when trying to remove all teams on db
# Enter the following cmds in to your terminal
# 1 - `PYTHONSTARTUP=juriterm.py python`
# 2 - `from helpers.team_helpers import delete_all_teams`
# 3 - delete_all_teams()
##########################################################
def delete_all_teams():
    all_teams = [team.to_dict() for team in db_session_users.query(Team).all()]
    # for each team
    for t in all_teams:
        # find its team members
        team_member_ids_subquery = db_session_users.query(TeamMember.user_id).filter_by(team_id=t['id']).subquery()
        team_members = [u.to_dict() for u in db_session_users.query(User).filter(User.id.in_(team_member_ids_subquery))]

        for u in team_members:
            #find each team members shared folders
            shared_folder_ids_subquery = db_session_users.query(UserSharedFolder.folder_id).filter_by(user_id=u['id']).subquery()
            all_shared_folders = [f.to_dict() for f in db_session_users.query(UserFolder).filter(UserFolder.id.in_(shared_folder_ids_subquery))]
            # delete the shared folders
            for f in all_shared_folders:
                folder = db_session_users.query(UserFolder).filter_by(id=f['id'], user_id=u['id']).first()
                if folder:
                    shared_folder = db_session_users.query(UserSharedFolder).filter_by(folder_id=f['id']).first()
                    if shared_folder:
                        db_session_users.query(UserSharedFolder).filter_by(folder_id=f['id']).delete()

                    db_session_users.query(UserFolderDocument).filter_by(user_folder_id=f['id']).delete()
                    db_session_users.delete(folder)
                    db_session_users.commit()
            # then remove the team member from user's table
            u_from_db = db_session_users.query(User).filter_by(id=u['id']).first()
            u_from_db.team_id = None
            db_session_users.add(u_from_db)
            db_session_users.commit()
            # and remove from team_members table
            team_member = db_session_users.query(TeamMember).filter_by(team_id=t['id'], user_id=u['id']).first()
            db_session_users.delete(team_member)
            db_session_users.commit()
        # after all team members have been removed remove team
        t_from_db = db_session_users.query(Team).filter_by(id=t['id']).first()
        db_session_users.delete(t_from_db)
        db_session_users.commit()
