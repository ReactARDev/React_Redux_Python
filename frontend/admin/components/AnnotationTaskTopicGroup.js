import React from 'react';
import { Modal, FormGroup, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import {
  fetchAnnotationTaskTopicGroups,
  deleteAnnotationTaskTopicGroup
} from '../../shared/actions';
import AnnotationTaskTopicGroupModal from './AnnotationTaskTopicGroupModal';

class AnnotationTaskTopicGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      showAddNewModal: false,
      name: '',
      description: '',
      arbitrary_tags: [],
      tableFields: [],
      annotation_task_ids: [],
      showDeleteModal: false
    };
  }
  componentWillMount() {
    const newState = { ...this.props };
    this.setState(newState);
  }
  componentWillReceiveProps(nextProps) {
    const newState = { ...nextProps };
    this.setState(newState);
  }
  getTopic(topicId) {
    const topicExists = this.props.sources.defaultTopics.find(topic => topic.id === topicId);
    return topicExists ? topicExists.name : '';
  }
  openModal = () => {
    this.setState({ showModal: true });
  };
  closeModal = () => {
    this.setState({ showModal: false, showDeleteModal: false });
  };
  handleChange = (field, value) => {
    this.setState({ [field]: value });
  };

  render() {
    return (
      <tr onClick={this.openModal}>
        <AnnotationTaskTopicGroupModal {...this.state} closeModal={this.closeModal} />
        <Modal show={this.state.showDeleteModal} onHide={this.closeModal}>
          <Modal.Body>
            <FormGroup>
              <h4>Are you sure you want to delete this group?</h4>
              <img alt="gif" src="https://media.giphy.com/media/wkKRo7N0T1ONO/giphy.gif" />
            </FormGroup>
            <FormGroup>
              <Button
                onClick={() => {
                  this.props
                    .deleteAnnotationTaskTopicGroup(this.props.id)
                    .then(() => this.props.fetchAnnotationTaskTopicGroups());
                }}
              >
                Delete
              </Button>
            </FormGroup>
          </Modal.Body>
        </Modal>
        {this.props.tableFields.map((field, i) => {
          if (field === 'topic_id') {
            return <td key={i}>{this.getTopic(this.state[field])}</td>;
          }
          if (field === 'gold_annotator_users') {
            return <td key={i}>{this.state[field].map(user => user.label).join('; ')}</td>;
          }
          return (
            <td key={i}>
              {Array.isArray(this.state[field]) ? this.state[field].join(',') : this.state[field]}
            </td>
          );
        })}
        <td>
          <Button
            onClick={e => {
              e.stopPropagation();
              this.setState({ showDeleteModal: true });
            }}
          >
            delete
          </Button>
        </td>
      </tr>
    );
  }
}

const mapStateToProps = state => {
  return { all_annotation_tasks: state.all_annotation_tasks.annotation_tasks, ...state.sources };
};

const ReduxAnnotationTaskTopicGroup = connect(mapStateToProps, {
  fetchAnnotationTaskTopicGroups,
  deleteAnnotationTaskTopicGroup
})(AnnotationTaskTopicGroup);

export default ReduxAnnotationTaskTopicGroup;
