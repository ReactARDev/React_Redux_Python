from flask import jsonify
from sqlalchemy import or_
from models import db_session_users, AnnotationTaskTermSamplingGroup, AnnotationTask, AnnotationJob, TopicAnnotation, AnnotationTaskTopicGroup
from helpers.utilities import merge_two_dicts

VALID_TASK_STATUSES = [AnnotationTask.ACTIVE_STATUS, AnnotationTask.INACTIVE_STATUS]
TASK_TYPES_TO_SKIP = [AnnotationTask.ANNOTATE_ANY_DOCUMENT_TYPE]


def get_all_annotation_tasks(user_id, params, is_qa_user=False, is_contributor_user=False):
    tasks = []
    # n.b. notin_ omits cases where type is null
    annotation_task_query = db_session_users.query(AnnotationTask).filter(AnnotationTask.active_task_id == None)\
        .filter(or_(AnnotationTask.type.notin_(TASK_TYPES_TO_SKIP), AnnotationTask.type == None))
    annotation_type = params.get("type", None)

    if is_qa_user:
        annotation_task_query = annotation_task_query.filter(AnnotationTask.user_ids.any(user_id))

    if is_contributor_user:
        # n.b. using is_contributor_task=True is not required right now for topic annotation type tasks
        # TODO? should this be required in the future?
        if annotation_type == 'topic_annotation':
            annotation_task_query = annotation_task_query.filter(AnnotationTask.user_ids.any(user_id))
            annotation_task_query = annotation_task_query.filter_by(type=annotation_type)
        else:
            annotation_task_query = annotation_task_query.filter_by(is_contributor_task=True)

            # FIXME use queries on the specific type moving forward (type filter on document_review or topic_annotation)
            annotation_task_query = annotation_task_query.filter_by(type='contributor')

    for task in annotation_task_query.order_by(AnnotationTask.name):
        task_dict = task.to_dict()
        task_dict["old_tasks"] = [t.to_dict() for t in db_session_users.query(AnnotationTask).filter_by(active_task_id=task.id)]
        term_sampling_group_ids = db_session_users.query(AnnotationTaskTermSamplingGroup.term_sampling_group_id)\
            .filter_by(annotation_task_id=task.id)
        task_dict["term_sampling_group_ids"] = [t[0] for t in term_sampling_group_ids]
        tasks.append(task_dict)

    return {"annotation_tasks": tasks}


# TODO: where to add admin restriction? frontend?
# can be used to get terms for annotation_job, since task_id is attribute of annotation_job
def get_annotation_task_group_tags_for_task(annotation_task_id):
    # get allowed tags for annotation job from its annotation task group(s)
    groups_containing_job = db_session_users.query(AnnotationTaskTopicGroup)\
                                            .filter(AnnotationTaskTopicGroup.annotation_task_ids
                                                                        .any(annotation_task_id))\
                                            .all()
    allowed_tags = list(set([tag for t_group in groups_containing_job for tag in t_group.arbitrary_tags]))

    # if more than one annotation_task_group contains this task, add a warning tag to output
    if len(groups_containing_job) > 1:
        allowed_tags.append("WARNING: MORE THAN ONE ANNOTATION TASK GROUP CONTAINS THIS TASK")

    return {"annotation_task_group_tags": allowed_tags}


def create_annotation_task(params):
    new_annotation_task = AnnotationTask(params)
    term_sampling_group_ids = params.get("term_sampling_group_ids", None)

    # FIXME: enforcing default values until the front-end has been updated to provide this explicitly
    if new_annotation_task.type is None:
        new_annotation_task.type = AnnotationTask.TOPIC_ANNOTATION_TYPE
    elif new_annotation_task.type == 'contributor':
        new_annotation_task.is_contributor_task = True

    db_session_users.add(new_annotation_task)
    db_session_users.commit()
    db_session_users.refresh(new_annotation_task)

    if term_sampling_group_ids is not None:
        for term_sampling_group_id in term_sampling_group_ids:
            attsg = AnnotationTaskTermSamplingGroup(
                {'annotation_task_id': new_annotation_task.id, 'term_sampling_group_id': term_sampling_group_id}
            )
            db_session_users.add(attsg)
        db_session_users.commit()

    task_dict = new_annotation_task.to_dict()
    term_sampling_group_ids = db_session_users.query(AnnotationTaskTermSamplingGroup.term_sampling_group_id) \
        .filter_by(annotation_task_id=new_annotation_task.id)
    task_dict["term_sampling_group_ids"] = [t[0] for t in term_sampling_group_ids]

    return {"annotation_task": task_dict}


def update_annotation_task(annotation_task_id, params):
    original_annotation_task = db_session_users.query(AnnotationTask).filter_by(id=annotation_task_id).first()
    num_annotation_jobs = db_session_users.query(AnnotationJob).filter_by(annotation_task_id=annotation_task_id).count()

    # n.b. updating the topics hash means that we need to swap this task for a new one for
    # consistency of which annotations were generated against which task, as it is valuable to know
    # which topics were presented when annotations are created, likewise what the user and other config options
    # note: there is no need for a new task until this task has jobs added for it, so when the job count is still 0,
    #       we can do a direct update to the existing task instead
    # note: onboarding mode tasks (with is_training_task=True) also do not create a new task when they date updated
    if num_annotation_jobs > 0 and not original_annotation_task.is_training_task and \
            ('topics' in params or
             'user_ids' in params or
             'config' in params or
             'term_sampling_group_ids' in params or
             'is_training_task' in params or
             'include_gold_annotations' in params or
             'annotation_task_topic_group_id' in params):

        new_annotation_task_dict = original_annotation_task.__dict__

        if 'topics' in params:
            new_annotation_task_dict['topics'] = params['topics']

        # must be done before setting is_training_task due to check in setting is_training_task
        if 'annotation_task_topic_group_id' in params:
            new_annotation_task_dict['annotation_task_topic_group_id'] = params['annotation_task_topic_group_id']
            # update is_training_task to be False if no longer in annotation_task_topic_group
            if new_annotation_task_dict['annotation_task_topic_group_id'] is None:
                new_annotation_task_dict['is_training_task'] = False

        if 'user_ids' in params:
            new_annotation_task_dict['user_ids'] = params['user_ids']

        # n.b. changing status between active/inactive in effect toggles this task on/off
        if 'status' in params and params['status'] in VALID_TASK_STATUSES:
            new_annotation_task_dict['status'] = params['status']

        if 'config' in params:
            new_annotation_task_dict['config'] = merge_two_dicts(new_annotation_task_dict['config'], params['config'])
            if 'num_touches' in new_annotation_task_dict['config'] and new_annotation_task_dict['config']['num_touches'] == '':
                del new_annotation_task_dict['config']['num_touches']

        if 'name' in params:
            new_annotation_task_dict['name'] = params['name']

        # only allow setting this to True if this annotation_task is in an annotation_task_topic_group
        # TODO: currently possible to do illegal is_training_task update (with not effect) that creates new task
        if 'is_training_task' in params and params['is_training_task'] is True:
            if new_annotation_task_dict['annotation_task_topic_group_id'] is not None:
                new_annotation_task_dict['is_training_task'] = params['is_training_task']

        if 'include_gold_annotations' in params:
            new_annotation_task_dict['include_gold_annotations'] = params['include_gold_annotations']

        if 'is_contributor_task' in params:
            new_annotation_task_dict['is_contributor_task'] = params['is_contributor_task']

        new_annotation_task = AnnotationTask(new_annotation_task_dict)
        db_session_users.add(new_annotation_task)

        # n.b. connect the tasks together and mark the old one as inactive
        original_annotation_task.active_task = new_annotation_task
        original_annotation_task.status = AnnotationTask.INACTIVE_STATUS
        db_session_users.add(original_annotation_task)

        # also deal with any even older annotation tasks and make sure they get their active_task_id updated too
        for older_annotation_task in \
                db_session_users.query(AnnotationTask).filter_by(active_task_id=original_annotation_task.id):
            older_annotation_task.active_task = new_annotation_task
            db_session_users.add(older_annotation_task)

        db_session_users.commit()
        db_session_users.refresh(new_annotation_task)

        # update any annotation_task_groups containing original_annotation_task to point to new task
        all_task_groups = db_session_users.query(AnnotationTaskTopicGroup).all()  # get all task groups
        for group in all_task_groups:
            if annotation_task_id in group.annotation_task_ids:
                # update task id list to point to new annotation task id
                # list is a tuple, so cannot be mutated in-place
                new_ids = [id for id in group.annotation_task_ids if id != annotation_task_id]
                new_ids.append(new_annotation_task.id)
                group.annotation_task_ids = new_ids
                db_session_users.add(group)
                db_session_users.commit()

        if 'term_sampling_group_ids' in params:
            new_term_sampling_ids = params['term_sampling_group_ids']
        else:
            existing_term_sampling_group_ids = [t[0] for t in db_session_users.query(
                AnnotationTaskTermSamplingGroup.term_sampling_group_id).filter_by(
                annotation_task_id=original_annotation_task.id)]
            new_term_sampling_ids = existing_term_sampling_group_ids

        for term_sampling_group_id in new_term_sampling_ids:
            attsg = AnnotationTaskTermSamplingGroup(
                {'annotation_task_id': new_annotation_task.id, 'term_sampling_group_id': term_sampling_group_id}
            )
            db_session_users.add(attsg)

        if len(new_term_sampling_ids) > 0:
            db_session_users.commit()

        task_to_return = new_annotation_task

    # allow basic updates of status/config/name
    else:
        # n.b. changing status between active/inactive in effect toggles this task on/off
        if 'status' in params and params['status'] in VALID_TASK_STATUSES:
            original_annotation_task.status = params['status']

        if 'name' in params:
            original_annotation_task.name = params['name']

        if 'is_contributor_task' in params:
            original_annotation_task.is_contributor_task = params['is_contributor_task']

        # must be done before setting is_training_task due to check in setting is_training_task
        if 'annotation_task_topic_group_id' in params:
            original_annotation_task.annotation_task_topic_group_id = params['annotation_task_topic_group_id']
            # update is_training_task to be False if no longer in annotation_task_topic_group
            if original_annotation_task.annotation_task_topic_group_id is None:
                original_annotation_task.is_training_task = False

        ## n.b. these all can get updated here in the annotation jobs == 0 use case ##

        # only allow setting this to True if this annotation_task is in an annotation_task_topic_group
        if 'is_training_task' in params and params['is_training_task'] is True:
            if original_annotation_task.annotation_task_topic_group_id is not None:
                original_annotation_task.is_training_task = params['is_training_task']

        if 'include_gold_annotations' in params:
            original_annotation_task.include_gold_annotations = params['include_gold_annotations']

        if 'topics' in params:
            original_annotation_task.topics = params['topics']

        if 'user_ids' in params:
            original_annotation_task.user_ids = params['user_ids']

        if 'config' in params:
            original_annotation_task.config = merge_two_dicts(original_annotation_task.config, params['config'])
            if 'num_touches' in original_annotation_task.config and original_annotation_task.config['num_touches'] == '':
                del original_annotation_task.config['num_touches']

        if 'term_sampling_group_ids' in params:
            new_term_sampling_ids = params['term_sampling_group_ids']
            existing_tsgs = db_session_users.query(AnnotationTaskTermSamplingGroup)\
                .filter_by(annotation_task_id=original_annotation_task.id).all()
            existing_tsg_id_map = {t.term_sampling_group_id: t for t in existing_tsgs}
            removed_ids = [item for item in existing_tsg_id_map.keys() if item not in new_term_sampling_ids]
            for term_sampling_group_id in new_term_sampling_ids:
                if term_sampling_group_id not in existing_tsg_id_map:
                    attsg = AnnotationTaskTermSamplingGroup(
                        {'annotation_task_id': original_annotation_task.id, 'term_sampling_group_id': term_sampling_group_id}
                    )
                    db_session_users.add(attsg)

            for term_sampling_group_id in removed_ids:
                db_session_users.query(AnnotationTaskTermSamplingGroup).filter_by(annotation_task_id=original_annotation_task.id, term_sampling_group_id=term_sampling_group_id).delete()

        db_session_users.add(original_annotation_task)
        db_session_users.commit()
        task_to_return = original_annotation_task

    task_dict = task_to_return.to_dict()
    task_dict["old_tasks"] = [t.to_dict() for t in db_session_users.query(AnnotationTask).filter_by(active_task_id=task_to_return.id)]
    term_sampling_group_ids = db_session_users.query(AnnotationTaskTermSamplingGroup.term_sampling_group_id) \
        .filter_by(annotation_task_id=task_to_return.id)
    task_dict["term_sampling_group_ids"] = [t[0] for t in term_sampling_group_ids]
    return {"annotation_task": task_dict}


# helper method to delete each individual task entity
def delete_annotation_task_by_obj(ann_task, delete_with_annotations=False):
    if db_session_users.query(TopicAnnotation).filter_by(annotation_task_id=ann_task.id).count() > 0\
            and delete_with_annotations:
            db_session_users.query(TopicAnnotation).filter_by(annotation_task_id=ann_task.id).delete()

    if db_session_users.query(AnnotationJob).filter_by(annotation_task_id=ann_task.id).count() > 0:
        db_session_users.query(AnnotationJob).filter_by(annotation_task_id=ann_task.id).delete()

    db_session_users.query(AnnotationTaskTermSamplingGroup).filter_by(annotation_task_id=ann_task.id).delete()

    db_session_users.delete(ann_task)


def delete_annotation_task(annotation_task_id, params):
    # n.b. delete_with_annotations flags is intended to make it more difficult to delete tasks that have actual
    # annotations associated with them, the extra flag means users will need to take the extra step before
    # blowing them away
    delete_with_annotations = params['delete_with_annotations'] if 'delete_with_annotations' in params else False
    annotation_task = db_session_users.query(AnnotationTask).filter_by(id=annotation_task_id).first()

    if annotation_task.active_task_id is not None:
        old_annotation_tasks = db_session_users.query(AnnotationTask).filter_by(active_task_id=annotation_task.id).all()
        all_task_ids = [annotation_task.id] + [o.id for o in old_annotation_tasks]

        # make sure we do a top-level check for all of the tasks if there are annotations, and return the error
        # if the delete_with_annotations flag is not set
        if db_session_users.query(TopicAnnotation).filter(TopicAnnotation.annotation_task_id.in_(all_task_ids)).count()\
                > 0 and not delete_with_annotations:
                return jsonify({'errors': 'Annotations exist for this task'}), 400

        for old_annotation_task in old_annotation_tasks:
            delete_annotation_task_by_obj(old_annotation_task, delete_with_annotations)
        delete_annotation_task_by_obj(annotation_task, delete_with_annotations)
    else:
        if db_session_users.query(TopicAnnotation).filter_by(annotation_task_id=annotation_task.id).count() > 0\
                and not delete_with_annotations:
            return jsonify({'errors': 'Annotations exist for this task'}), 400

        delete_annotation_task_by_obj(annotation_task, delete_with_annotations)

    db_session_users.commit()

    return jsonify({"success": True})
