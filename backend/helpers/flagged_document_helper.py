from models import db_session_users, UserFlaggedDocument
from flask import jsonify

ValidIssueTypes = [UserFlaggedDocument.TECHNICAL_ISSUE_TYPE, UserFlaggedDocument.NOT_RELEVANT_ISSUE_TYPE,
                   UserFlaggedDocument.SHOW_AGAIN_ISSUE_TYPE]
ValidIssueSeverities = [UserFlaggedDocument.HIDE_NOW_SEVERITY, UserFlaggedDocument.REVIEW_SEVERITY,
                        UserFlaggedDocument.SHOW_NOW_SEVERITY]
ValidIssueStatuses = [UserFlaggedDocument.SKIPPED_STATUS]

def flag_document(user_id, doc_id, params):
    issue_severity = params.get('issue_severity', UserFlaggedDocument.REVIEW_SEVERITY)
    issue_type = params.get('issue_type', None)
    notes = params.get('notes', None)
    field = params.get('field', None)
    user_flagged_document_id = params.get('id', None)
    status = params.get('status', None)

    # for creating new user flagged documents
    if user_flagged_document_id is None:
        if not issue_type or issue_type not in ValidIssueTypes:
            return {'errors': "Issue type must be one of: " + str(ValidIssueTypes)}

        if issue_severity not in ValidIssueSeverities:
            return {'errors': "Issue severity must be one of: " + str(ValidIssueSeverities)}

        flagged_doc = UserFlaggedDocument({
            'user_id': user_id,
            'doc_id': doc_id,
            'issue_severity': issue_severity,
            'issue_type': issue_type,
            'notes': notes,
            'field': field,
        })

    # for updating an existing user flagged document (status is the only relevant use-case)
    else:
        flagged_doc = db_session_users.query(UserFlaggedDocument).filter_by(id=user_flagged_document_id).first()
        if status is not None:
            if status in ValidIssueStatuses:
                flagged_doc.status = status
            else:
                return {'errors': "Issue status must be one of: " + str(ValidIssueStatuses)}

    db_session_users.add(flagged_doc)
    db_session_users.commit()
    db_session_users.refresh(flagged_doc)
    return flagged_doc.to_dict()

def get_flagged_hidden_documents(user_id, params):
    subquery = db_session_users.query(UserFlaggedDocument.doc_id).filter_by(user_id=user_id, issue_severity="show_now", status="flagged").subquery()
    documents = db_session_users.query(UserFlaggedDocument).filter_by(user_id=user_id, status="hidden").filter(UserFlaggedDocument.doc_id.notin_(subquery)).all()

    return jsonify({
        'hidden_documents': [doc.to_dict() for doc in documents]
    })