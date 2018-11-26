import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Modal,
  Button,
  FormGroup,
  ControlLabel,
  FormControl
} from 'react-bootstrap';
import _ from 'lodash';
import {
  createTopicFromParams,
  updateTopicWithParams
} from '../../shared/actions';

class TopicModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: null,
      saveDisabled: false,
      name: "",
      description: "",
      active_streaming: "",
      active_backfill: "",
      active_indexer: "",
      update_mode: false,
      alert_message: "",
      showAlert: false,
      prediction_surfacing_threshold: null
    };
  }

  componentWillReceiveProps(nextProps) {
    const all_topics = this.props.all_topics.items.topics;
    let new_state = {
      id: null,
      name: "",
      description: "",
      active_streaming: "inactive",
      active_backfill: "inactive",
      active_indexer: "inactive",
      update_mode: false,
      showAlert: false,
      prediction_surfacing_threshold: null
    };

    if (nextProps.id) {
      const topic = _.find(all_topics, { id: nextProps.id });

      new_state = {
        id: topic.id,
        name: topic.name,
        description: topic.description ? topic.description : "",
        active_streaming: topic.active_streaming ? "active" : "inactive",
        active_backfill: topic.active_backfill ? "active" : "inactive",
        active_indexer: topic.active_indexer ? "active" : "inactive",
        update_mode: true,
        showAlert: false,
        // note: 0.99 is the default system (not topic-specific) threshold
        prediction_surfacing_threshold: topic.prediction_surfacing_threshold ?
          topic.prediction_surfacing_threshold : 0.99
      };
    }
    this.setState(new_state);
  }

  getParamsForUpdate = () => {
    const params = {};
    const topics = this.props.all_topics.items.topics;
    const existing_topic = _.find(topics, { id: this.props.id });

    if (existing_topic.description !== this.state.description) {
      params.description = this.state.description;
    }

    let new_value = this.state.active_streaming === 'active';
    if (new_value !== existing_topic.active_streaming) {
      params.active_streaming = new_value;
    }
    new_value = this.state.active_backfill === 'active';
    if (new_value !== existing_topic.active_backfill) {
      params.active_backfill = new_value;
    }
    new_value = this.state.active_indexer === 'active';
    if (new_value !== existing_topic.active_indexer) {
      params.active_indexer = new_value;
    }
    if (existing_topic.prediction_surfacing_threshold !==
      this.state.prediction_surfacing_threshold) {
      params.prediction_surfacing_threshold = this.state.prediction_surfacing_threshold;
    }
    return params;
  };

  getParamsForCreate = () => {
    const params = {};
    params.name = this.state.name;
    if (this.state.description) {
      params.description = this.state.description;
    }
    if (this.state.active_streaming === 'active') {
      params.active_streaming = true;
    }
    if (this.state.active_backfill === 'active') {
      params.active_backfill = true;
    }
    if (this.state.active_indexer === 'active') {
      params.active_indexer = true;
    }
    if (this.state.prediction_surfacing_threshold) {
      params.prediction_surfacing_threshold = this.state.prediction_surfacing_threshold;
    }
    return params;
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    const new_value = event.target.value;
    let accept_value = true;
    if (changedfieldname === 'prediction_surfacing_threshold') {
      if (new_value < 0 || new_value > 1) {
        accept_value = false;
      }
    }

    if (accept_value) {
      new_state.showAlert = false;
      new_state[changedfieldname] = new_value;
    }
    this.setState(new_state);
  };

  closeModal = () => {
    this.props.close();
  };

  handleSubmit = event => {
    event.preventDefault();
    let params = {};

    if (this.state.update_mode) {
      params = this.getParamsForUpdate();

      if (_.isEmpty(params)) {
        this.setState({
          alert_message: "No changes made",
          showAlert: true
        });
      } else {
        this.props.close();
        this.props.updateTopicWithParams(this.state.id, params).then(() => {
          this.props.updateTable();
        });
      }
    } else {
      if (this.isEmpty(this.state.name)) {
        this.setState({
          alert_message: "Please make sure that 'name' field is filled in.",
          showAlert: true
        });
      } else {
        this.props.close();
        params = this.getParamsForCreate();
        this.props.createTopicFromParams(params).then(() => {
          this.props.updateTable();
        });
      }
    }
  };

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };


  render() {
    const header = this.state.update_mode ? "Update topic " + this.state.name : "Create topic";
    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title><p>{header}</p>
          </Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup className={this.state.update_mode ? "hidden" : ""}>
              <ControlLabel>Name</ControlLabel>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('name', e)}
                value={this.state.name}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description</ControlLabel>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('description', e)}
                value={this.state.description}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Active Streaming</ControlLabel>
              <select
                className="form-control"
                value={this.state.active_streaming}
                onChange={e => this.handleFieldChange('active_streaming', e)}
              >
                <option value="active">TRUE</option>
                <option value="inactive">FALSE</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Active Backfill</ControlLabel>
              <select
                className="form-control"
                value={this.state.active_backfill}
                onChange={e => this.handleFieldChange('active_backfill', e)}
              >
                <option value="active">TRUE</option>
                <option value="inactive">FALSE</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Active Indexer</ControlLabel>
              <select
                className="form-control"
                value={this.state.active_indexer}
                onChange={e => this.handleFieldChange('active_indexer', e)}
              >
                <option value="active">TRUE</option>
                <option value="inactive">FALSE</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Prediction surfacing threshold</ControlLabel>
              <input
                className="form-control"
                type="number"
                step={0.01}
                min={0.00}
                max={1.00}
                value={this.state.prediction_surfacing_threshold}
                onChange={e => this.handleFieldChange('prediction_surfacing_threshold', e)}
              />
            </FormGroup>
            <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
              {this.state.alert_message}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeModal}>Close</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              {this.state.update_mode ? "Update" : "Create"}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}


TopicModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    createTopicFromParams: (data) => {
      return dispatch(createTopicFromParams(data));
    },
    updateTopicWithParams: (topic_id, data) => {
      return dispatch(updateTopicWithParams(topic_id, data));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_topics: state.all_topics
  };
};

const ReduxTopicModal = connect(mapStateToProps, mapDispatchToProps)(TopicModal);

export default ReduxTopicModal;
