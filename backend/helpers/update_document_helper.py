from models import db_session_users, UserDocumentUpdate, UserFlaggedDocument

def update_document(user_id, doc_id, params):
    user_flagged_document_id = params.get('user_flagged_document_id', None)

    fix_contributor_notes = params.get('fix_contributor_notes', None)
    skip_contributor_notes = params.get('skip_contributor_notes', None)

    flagged_doc = None
    if user_flagged_document_id is not None:
        flagged_doc = db_session_users.query(UserFlaggedDocument).filter_by(id=user_flagged_document_id).first()

    # Change status without making updates in document
    # in case admin decides to not update document flagged by contributor
    if skip_contributor_notes:
        if flagged_doc is not None:
            flagged_doc.status = UserFlaggedDocument.PROCESSED_STATUS
            db_session_users.add(flagged_doc)
            db_session_users.commit()
        return {"status_updated": True}

    notes = params.get('notes', None)
    changes = {}
    category = params.get('category', None)
    if category:
        changes["category"] = category

    publication_date = params.get('publication_date', None)
    if publication_date:
        changes["publication_date"] = publication_date

    summary_text = params.get('summary_text', None)
    if summary_text:
        changes["summary_text"] = summary_text

    title = params.get('title', None)
    if title:
        changes["title"] = title

    topics_to_add = params.get('topics_to_add', None)
    if topics_to_add:
        changes["topics_to_add"] = topics_to_add

    topics_to_remove = params.get('topics_to_remove', None)
    if topics_to_remove:
        changes["topics_to_remove"] = topics_to_remove

    if not changes:
       return {'errors': "changes submitted to update document must not be empty"}

    updated_doc = UserDocumentUpdate({
        'user_id': user_id,
        'doc_id': doc_id,
        'notes': notes,
        'changes': changes,
    })

    # Update status of flagged document
    if flagged_doc is not None:
        if fix_contributor_notes:
            flagged_doc.status = UserFlaggedDocument.FIXED_STATUS
        else:
            flagged_doc.status = UserFlaggedDocument.PROCESSED_STATUS
        db_session_users.add(flagged_doc)

    db_session_users.add(updated_doc)
    db_session_users.commit()
    db_session_users.refresh(updated_doc)

    return updated_doc.to_dict()
