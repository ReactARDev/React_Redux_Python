import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createAnnotationsForJob } from '../../shared/actions';
import _ from 'lodash';
import { Radio, Button } from 'react-bootstrap';

class SkippedJobItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      answer: null
    };
  }

  componentWillMount() {
    const job = this.props.job;
    const new_state = {
      radio_name: job.job_id + 'is_positive',
      job_id: job.job_id,
      task_id: job.task_id,
      doc_id: job.doc_id,
      assigned_email: job.email,
      notes: job.notes,
      updated_at_date: job.updated_at,
      topic_name: job.topics ? Object.keys(job.topics).join(',') : ''
    };

    this.setState(new_state);
  }

  getParams = () => {
    const topic_annotations = [];
    const annotation_result = {};
    annotation_result.is_positive = this.state.answer === 'yes';
    annotation_result.topic_name = this.state.topic_name;
    topic_annotations.push(annotation_result);
    const params = {};
    params.topic_annotations = topic_annotations;
    if (this.state.notes) {
      params.notes = this.state.notes;
    }
    return params;
  };

  submit = e => {
    if (_.isNull(this.state.answer)) {
      this.setState({ showAlert: true });
    } else {
      this.props
        .createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams())
        .then(() => {
          this.props.update_table();
        });
    }
  };

  handleFieldChange = event => {
    const new_state = {};
    new_state.answer = event.target.value;
    this.setState(new_state);
  };

  render() {
    return (
      <tr key={this.state.job_id}>
        <td>{this.state.assigned_email}</td>
        <td>{this.state.doc_id}</td>
        <td>{this.state.topic_name}</td>
        <td>{this.state.updated_at_date}</td>
        <td>{this.state.notes}</td>
        <td>
          <Radio
            name={this.state.radio_name}
            value="yes"
            inline
            checked={this.state.answer === 'yes'}
            onChange={e => this.handleFieldChange(e)}
          >
            YES
          </Radio>
          <Radio
            name={this.state.radio_name}
            value="no"
            inline
            checked={this.state.answer === 'no'}
            onChange={e => this.handleFieldChange(e)}
          >
            NO
          </Radio>
          <Button bsStyle="primary" onClick={this.submit} disabled={_.isNull(this.state.answer)}>
            Submit
          </Button>
          <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
            {'Please select Yes or No to submit'}
          </div>
        </td>
      </tr>
    );
  }
}

SkippedJobItem.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    createAnnotationsForJob: (task_id, job_id, params) => {
      return dispatch(createAnnotationsForJob(task_id, job_id, params));
    }
  };
};

const mapStateToProps = state => {
  return {};
};

const ReduxSkippedJobItem = connect(mapStateToProps, mapDispatchToProps)(SkippedJobItem);

export default ReduxSkippedJobItem;
