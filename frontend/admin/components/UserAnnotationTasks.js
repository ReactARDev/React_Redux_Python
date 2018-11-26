import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchAllAnnotationTasks, fetchAnnotationJob } from '../../shared/actions';
import { Link } from 'react-router';
import _ from 'lodash';

class UserAnnotationTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tasks: null
    };
  }

  // If user is contributor, then parameter "type = topic_annotation" indicates that
  // received tasks is annotation tasks.
  componentWillMount() {
    this.props.fetchAllAnnotationTasks({ type: "topic_annotation" }).then(response => {
      this.setState({ tasks: response.annotation_tasks });
    });
  }

  getAnnotationJobs = annotation_task_id => {
    this.props.fetchAnnotationJob(annotation_task_id);
  };

  render() {
    if (!this.state.tasks) {
      return null;
    }

    if (!this.props.current_user.isReady) {
      return null;
    }

    let annotation_tasks = this.state.tasks;

    // if user is admin, display only tasks assigned to him
    const current_user_id = this.props.current_user.user.id;
    const assigned_tasks = [];
    if (_.includes(this.props.current_user.user.roles, 'admin')) {
      annotation_tasks.forEach(task => {
        if (_.includes(task.user_ids, current_user_id)) {
          assigned_tasks.push(task);
        }
      });
      annotation_tasks = _.cloneDeep(assigned_tasks);
    }

    const topic_annotation_tasks = [];
    const slot_fill_tasks = [];

    annotation_tasks.forEach(task => {
      if (task.type === 'topic_annotation') {
        const topic = Object.keys(task.topics)[0];
        topic_annotation_tasks.push(
          <h5>
            <Link to={'/annotationtool?id=' + task.id + '&topic=' + topic}>
              {topic}: {task.name}
            </Link>
          </h5>
        );
      } else if (task.type === 'slot_fill') {
        const slot_type = task.config.slot_type;
        slot_fill_tasks.push(
          <h5>
            <Link to={'/slot-tool?id=' + task.id + '&slot_type=' + slot_type}>
              {slot_type}: {task.name}
            </Link>
          </h5>
        );
      }
    });

    let topic_annotation_section = "";
    let slot_fill_section = "";

    if (topic_annotation_tasks.length > 0) {
      topic_annotation_section = (
        <div>
          <h5>Topic annotation</h5>
          {topic_annotation_tasks}
        </div>
      );
    }

    if (slot_fill_tasks.length > 0) {
      slot_fill_section = (
        <div>
          <h5>Slot fill tool</h5>
          {slot_fill_tasks}
        </div>
      );
    }

    return (
      <div className="annotation-tasks-container">
        <div className="annotation-tasks">
          <h4>My annotation tasks</h4>
          {topic_annotation_section}
          {slot_fill_section}
        </div>
      </div>
    );
  }
}

UserAnnotationTasks.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllAnnotationTasks: (params) => {
      return dispatch(fetchAllAnnotationTasks(params));
    },
    fetchAnnotationJob: task_id => {
      dispatch(fetchAnnotationJob(task_id));
    }
  };
};

const mapStateToProps = state => {
  return {
    annotation_jobs: state.annotation_jobs,
    current_user: state.current_user
  };
};

const ReduxUserAnnotationTasks = connect(mapStateToProps, mapDispatchToProps)(UserAnnotationTasks);

export default ReduxUserAnnotationTasks;
