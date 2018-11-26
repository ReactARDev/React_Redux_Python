import React from 'react';
import { Modal, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import {
  postAnnotationTaskTopicGroup,
  fetchAnnotationTaskTopicGroups,
  fetchActiveTopicAnnotationModelIds
} from '../../shared/actions';
import Select, { Creatable } from 'react-select';

class AnnotationTaskTopicGroupModal extends React.Component {
  constructor(props) {
    super(props);
    this.defaultState = {
      name: '',
      description: '',
      arbitrary_tags: [],
      tableFields: [],
      annotation_task_ids: [],
      gold_annotator_user_ids: [],
      gold_annotator_users: [],
      topic_annotation_models: [],
      topic_id: null
    };
    this.state = this.defaultState;
  }
  componentWillReceiveProps(nextProps) {
    let newState = this.defaultState;
    if (!nextProps.addNewGroup) {
      newState = { ...nextProps };
    }
    if (nextProps.topic_id && nextProps.topic_id !== this.state.topic_id) {
      this.props.fetchActiveTopicAnnotationModelIds(nextProps.topic_id).then(res => {
        this.setState({ topic_annotation_models: res.topic_annotation_models });
      });
    }
    this.setState(newState);
  }
  handleChange = (field, value) => {
    if (field === 'topic_id') {
      this.props.fetchActiveTopicAnnotationModelIds(value).then(res => {
        this.setState({ topic_annotation_models: res.topic_annotation_models });
      });
    }
    this.setState({ [field]: value });
  };
  submit = () => {
    const data = {
      name: this.state.name,
      description: this.state.description,
      arbitrary_tags: this.state.arbitrary_tags,
      annotation_task_ids: this.state.annotation_task_ids,
      topic_id: this.state.topic_id,
      gold_annotator_user_ids: this.state.gold_annotator_users.map(user => user.value),
      active_topic_annotation_model_id: this.state.active_topic_annotation_model_id
    };

    this.props.postAnnotationTaskTopicGroup(data, this.props.id).then(() => {
      this.props.closeModal();
      this.props.fetchAnnotationTaskTopicGroups();
    });
  };
  render() {
    const arbitraryTags = this.state.arbitrary_tags.map(tag => ({ value: tag, label: tag }));
    const annotationTaskIds = this.state.annotation_task_ids.map(id => ({ value: id, label: id }));
    const parentAnnotationTasks = this.props.all_annotation_tasks
      .filter(task => task.active_task_id === null)
      .map(task => ({
        value: task.id,
        label: `${task.id}, ${task.name}, ${
          Object.keys(task.topics).length > 0 ? `topics: ${Object.keys(task.topics)}` : ''
        }`
      }));
    const topicLabel = this.props.sources.defaultTopics.find(
      topic => topic.id === this.state.topic_id
    )
      ? this.props.sources.defaultTopics.find(topic => topic.id === this.state.topic_id).label
      : '';

    const topicAnnotationModels = this.state.topic_annotation_models.map(model => ({
      value: model.id,
      label: `${model.name}, topic: ${topicLabel}, ${model.created_at}`
    }));
    topicAnnotationModels.unshift({ value: null, label: '' });
    return (
      <Modal show={this.props.showModal}>
        <Modal.Body>
          <FormGroup>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              type="text"
              value={this.state.name}
              onChange={e => this.handleChange('name', e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Description</ControlLabel>
            <FormControl
              type="text"
              value={this.state.description}
              onChange={e => this.handleChange('description', e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Arbitrary Tags</ControlLabel>
            <Creatable
              multi
              value={arbitraryTags}
              options={[]}
              onChange={objs => {
                this.setState({ arbitrary_tags: objs.map(obj => obj.value) });
              }}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>annotation_task_ids</ControlLabel>
            <Creatable
              multi
              value={annotationTaskIds}
              options={parentAnnotationTasks}
              onChange={objs => {
                this.setState({ annotation_task_ids: objs.map(obj => parseInt(obj.value, 10)) });
              }}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>topic_id</ControlLabel>
            <Select
              multi={false}
              options={this.props.sources.defaultTopics.map(source => ({
                value: source.id,
                label: source.label
              }))}
              value={{
                value: this.state.topic_id,
                label: topicLabel
              }}
              onChange={obj => this.handleChange('topic_id', obj.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>active_topic_annotation_model_id</ControlLabel>
            <Select
              value={this.state.active_topic_annotation_model_id}
              options={topicAnnotationModels}
              onChange={obj => this.handleChange('active_topic_annotation_model_id', obj.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>gold_annotator_user_ids (enter user id)</ControlLabel>
            <Creatable
              multi
              value={this.state.gold_annotator_users}
              options={this.props.all_users.users.map(user => ({
                label: user.email,
                value: user.id
              }))}
              onChange={objs => {
                this.setState({
                  gold_annotator_users: objs.map(obj => ({
                    label: obj.label,
                    value: parseInt(obj.value, 10)
                  }))
                });
              }}
            />
          </FormGroup>
        </Modal.Body>
        <div className="editAnnotationButtons">
          <Button onClick={this.submit}>Submit</Button>
          <Button
            onClick={e => {
              e.stopPropagation();
              this.props.closeModal();
            }}
          >
            Close
          </Button>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  return {
    all_annotation_tasks: state.all_annotation_tasks.annotation_tasks,
    all_users: state.all_users,
    ...state.sources
  };
};

const ReduxAnnotationTaskTopicGroupModal = connect(mapStateToProps, {
  postAnnotationTaskTopicGroup,
  fetchAnnotationTaskTopicGroups,
  fetchActiveTopicAnnotationModelIds
})(AnnotationTaskTopicGroupModal);

export default ReduxAnnotationTaskTopicGroupModal;
