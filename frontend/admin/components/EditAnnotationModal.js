import React from 'react';
import { Modal, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import Select from 'react-select';
import _ from 'lodash';
import {
  fetchAggregatedAnnotations,
  editAggregatedAnnotationResearch,
  fetchAnnotationTaskTopicGroups,
  editAggregatedAnnotationGold
} from '../../shared/actions';

class EditAnnotationModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isGoldAnnotation: false, annotation_job: { arbitrary_tags: [] } };
  }

  componentWillMount() {
    this.props.fetchAnnotationTaskTopicGroups();
  }
  componentWillReceiveProps(nextProps) {
    const newState = { ...nextProps.annotation, ...nextProps.annotation.annotation_job };
    if (nextProps.annotation.gold_topic_annotation_id === nextProps.annotation.id) {
      newState.isGoldAnnotation = true;
    } else {
      newState.isGoldAnnotation = false;
    }

    if (
      this.props.annotation_task_topic_groups.isFetching &&
      nextProps.annotation_task_topic_groups.isReady
    ) {
      const annotationTaskTopicGroup =
      nextProps.annotation_task_topic_groups.annotation_task_topic_groups.find(
        group => group.id === this.props.annotation_task_group_id
      );

      this.setState({
        arbitraryTagOptions: annotationTaskTopicGroup.arbitrary_tags.map(tag => ({
          value: tag,
          label: tag
        }))
      });
    }

    this.setState(newState);
  }
  handleChange = (field, value) => {
    this.setState({ [field]: value });
  };

  handleAnnotationJobChange = (field, value) => {
    const annotation_job = { ...this.state.annotation_job, ...{ [field]: value } };
    this.setState({ annotation_job });
  };

  submit = e => {
    const data = {
      annotation_job_updates: {},
      topic_annotation_updates: {}
    };
    if (
      !_.isEqual(
        this.props.annotation.annotation_job.arbitrary_tags,
        this.state.annotation_job.arbitrary_tags
      )
    ) {
      data.annotation_job_updates.arbitrary_tags = this.state.annotation_job.arbitrary_tags;
    }
    if (
      this.props.annotation.annotation_job.user_difficulty !==
      this.state.annotation_job.user_difficulty
    ) {
      data.annotation_job_updates.user_difficulty = this.state.annotation_job.user_difficulty;
    }

    if (this.props.annotation.admin_notes !== this.state.admin_notes) {
      data.topic_annotation_updates.admin_notes = this.state.admin_notes;
    }

    if (this.props.annotation.is_positive !== this.state.is_positive) {
      data.topic_annotation_updates.is_positive = this.state.is_positive;
      data.topic_annotation_updates.user_id = this.props.user.id;
    }

    if (this.props.annotation.annotation_job.notes !== this.state.notes) {
      data.annotation_job_updates.notes = this.state.notes;
    }

    data.topic_annotation_id = this.props.annotation.id;

    this.props
      .editAggregatedAnnotationResearch(data, this.props.aggregated_annotation_id)
      .then(() => {
        this.props.fetchAggregatedAnnotations(this.props.topicIdToDisplay, {
          offset: this.props.offset
        });
        this.props.closeEditAnnotationModal();
      });

    let topic_annotation_id = null;
    if (this.state.isGoldAnnotation) {
      topic_annotation_id = this.props.annotation.id;
    }
    this.props
      .editAggregatedAnnotationGold({ topic_annotation_id }, this.props.aggregated_annotation_id)
      .then(() => {
        this.props.fetchAggregatedAnnotations(this.props.topicIdToDisplay, {
          offset: this.props.offset
        });
        this.props.closeEditAnnotationModal();
      });
  };

  render() {
    const userDifficulty = {
      value: this.state.annotation_job.user_difficulty,
      label: this.state.annotation_job.user_difficulty
    };
    const arbitraryTags = !_.isNil(this.state.annotation_job.arbitrary_tags)
      ? this.state.annotation_job.arbitrary_tags.map(tag => ({ value: tag, label: tag }))
      : [];

    const isPositive = {
      value: this.state.is_positive,
      label: `${this.state.is_positive}`
    };
    return (
      <Modal show={this.props.showEditAnnotationModal}>
        <Modal.Body>
          <h4>Edit Annotation</h4>
          <FormGroup>
            <ControlLabel>admin_notes</ControlLabel>
            <FormControl
              type="text"
              value={this.state.admin_notes}
              onChange={e => this.handleChange('admin_notes', e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>notes</ControlLabel>
            <FormControl
              type="text"
              value={this.state.notes}
              onChange={e => this.handleChange('notes', e.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>is_positive</ControlLabel>
            <Select
              value={isPositive}
              options={[
                {
                  value: true,
                  label: 'true'
                },
                {
                  value: false,
                  label: 'false'
                }
              ]}
              onChange={obj => this.handleChange('is_positive', obj.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>user_difficulty</ControlLabel>
            <Select
              value={userDifficulty}
              options={[
                {
                  value: 'easy',
                  label: 'easy'
                },
                {
                  value: 'medium',
                  label: 'medium'
                },
                {
                  value: 'hard',
                  label: 'hard'
                }
              ]}
              onChange={obj => this.handleAnnotationJobChange('user_difficulty', obj.value)}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>arbitrary_tags</ControlLabel>
            <Select
              multi
              value={arbitraryTags}
              options={this.state.arbitraryTagOptions}
              onChange={objs =>
                this.handleAnnotationJobChange('arbitrary_tags', objs.map(obj => obj.value))
              }
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Gold Standard</ControlLabel>
            <div>
              <input
                name="isContributor"
                type="checkbox"
                checked={this.state.isGoldAnnotation}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  this.setState({ isGoldAnnotation: !this.state.isGoldAnnotation });
                }}
                className="qa-checkbox"
              />
            </div>
          </FormGroup>

          <div className="editAnnotationButtons">
            <Button onClick={this.submit}>Submit</Button>
            <Button
              onClick={e => {
                e.stopPropagation();
                this.props.closeEditAnnotationModal();
              }}
            >
              Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  return {
    annotation_task_topic_groups: state.annotation_task_topic_groups,
    user: state.current_user.user
  };
};

const ReduxEditAnnotationModal = connect(mapStateToProps, {
  fetchAggregatedAnnotations,
  editAggregatedAnnotationResearch,
  fetchAnnotationTaskTopicGroups,
  editAggregatedAnnotationGold
})(EditAnnotationModal);

export default ReduxEditAnnotationModal;
