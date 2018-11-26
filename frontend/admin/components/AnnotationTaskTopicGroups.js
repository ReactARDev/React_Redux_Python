import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import {
  fetchAnnotationTaskTopicGroups,
  fetchAllAnnotationTasks,
  fetchAllUsers
} from '../../shared/actions';
import AnnotationTaskTopicGroup from './AnnotationTaskTopicGroup';
import AnnotationTaskTopicGroupModal from './AnnotationTaskTopicGroupModal';

class AnnotationTaskTopicGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }
  componentDidMount() {
    this.props.fetchAnnotationTaskTopicGroups();
    this.props.fetchAllAnnotationTasks();
    this.props.fetchAllUsers();
  }

  closeModal = () => {
    this.setState({ showModal: false, showDeleteModal: false });
  };
  render() {
    const tableFields = [
      'created_at',
      'updated_at',
      'id',
      'name',
      'description',
      'annotation_task_ids',
      'arbitrary_tags',
      'active_topic_annotation_model_id',
      'gold_annotator_users',
      'topic_id'
    ];

    return (
      <div>
        <AnnotationTaskTopicGroupModal
          showModal={this.state.showModal}
          closeModal={this.closeModal}
          addNewGroup
        />

        <Button
          onClick={e => {
            e.stopPropagation();
            this.setState({ showModal: true });
          }}
        >
          Add new Group
        </Button>
        <Table>
          <thead>
            <tr>{tableFields.map((field, i) => <th key={i}>{field}</th>)}</tr>
          </thead>
          <tbody>
            {this.props.annotation_task_topic_groups.sort((a, b) => a.id > a.id).map((group, i) => {
              return (
                <AnnotationTaskTopicGroup
                  {...group}
                  gold_annotator_users={group.gold_annotator_users.map(user => ({
                    label: `${user.email}, ${user.id}`,
                    value: user.id
                  }))}
                  tableFields={tableFields}
                  key={group.id}
                />
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    annotation_task_topic_groups: state.annotation_task_topic_groups.annotation_task_topic_groups
  };
};

const ReduxAnnotationTaskTopicGroups = connect(mapStateToProps, {
  fetchAnnotationTaskTopicGroups,
  fetchAllAnnotationTasks,
  fetchAllUsers
})(AnnotationTaskTopicGroups);

export default ReduxAnnotationTaskTopicGroups;
