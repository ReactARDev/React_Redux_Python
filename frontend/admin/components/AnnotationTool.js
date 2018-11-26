import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  fetchAllAnnotationTasks,
  fetchAnnotationJob,
  createAnnotationsForJob,
  fetchAllAnnotationJobs,
  fetchAnnotationJobById,
  fetchAnnotationTaskTopicGroups
} from '../../shared/actions';
import { Radio, Button, FormControl, FormGroup, Col, Row } from 'react-bootstrap';
import Select from 'react-select';
import _ from 'lodash';

const TOPIC_DEFINITION = {
  Lending:
    'an entity (bank, credit union, P2P lender,' +
    'other lender) lends money to a borrower ' +
    '(individual or business) to pay for something ' +
    '(car, home, personal expenses, etc.).',
  'BSA/AML':
    'The Bank Secrecy Act / Anti-Money Laundering rules ' +
    '(BSA/AML) requires U.S. financial ' +
    'institutions to assist the U.S. government to detect and prevent ' +
    'money laundering and fraud. Money Laundering ' +
    'includes the concealment of the origins of illegally obtained money, ' +
    'typically involving bank transfers.' +
    'Fraud includes deception intended to result in financial gain.',
  'Mortgage Lending':
    'A mortgage is a loan used to purchase property ' +
    '(such as a house). Bank (or other lender) lends money to borrower; ' +
    'the loan is secured by the title of the property.',
  'Consumer Lending':
    'an entity (bank, credit union, P2P lender, ' +
    'other lender) lends money to a borrower (individual consumer) to pay ' +
    'for something (car, home, personal expenses, etc.).',
  'Commercial Lending':
    'an entity (bank, other lender) lends money to ' +
    'a commercial entity (non-consumer entity) to pay ' +
    'for something (usually real estate).',
  Crowdfunding:
    'the practice of funding a project or venture by raising ' +
    'small monetary contributions from multiple investors, typically through ' +
    'an online platform. The funds may be provided in exchange for a) loan repayment ' +
    '(with or without interest), b) equity, c) other “rewards,” ' +
    'like an invite to a product launch.',
  Deposits:
    'Deposits of money made to banking institutions ' +
    'for safe keeping. May include checking accounts, ' +
    'savings accounts, and money market accounts.'
};

class AnnotationTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      is_positive: null,
      notes: '',
      previous_job_id: null,
      topic_annotation_id: null,
      previousAnnotation: false,
      count: 0,
      showAlert: false,
      difficulty: '',
      arbitraryTags: ''
    };
  }

  componentWillMount() {
    const { query } = this.props.location;
    const id = query.id;
    this.setState({ task_id: id });
    this.state.topic = query.topic;
    this.props.fetchAnnotationJob(id);
    this.props.fetchAnnotationTaskTopicGroups();
  }

  componentDidMount() {
    // get total number of annotations from queue
    this.props
      .fetchAllAnnotationJobs(this.state.task_id, {
        status: 'queued',
        count_only: true
      })
      .then(response => {
        this.setState({ total: response.total });
      });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.annotation_jobs.isReady &&
      nextProps.annotation_jobs.items.annotation_job &&
      !_.isEqual(this.props.annotation_jobs, nextProps.annotation_jobs)
    ) {
      let answer = null;
      let annotation_id = null;
      let previousAnnotationIsLoaded = false;
      let previous_notes = '';
      // get answer for the last completed annotation.
      // assume that topic_annotations array is available only if fetched job is completed.
      const annotations = nextProps.annotation_jobs.items.annotation_job.topic_annotations;
      if (annotations && annotations.length > 0) {
        // get first annotation. Currently it's only one annotation saved per job.
        const topic_annotation = annotations[0];
        const prev_answer = topic_annotation.is_positive;
        answer = prev_answer ? 'yes' : 'no';
        annotation_id = topic_annotation.id;
        previousAnnotationIsLoaded = true;
      }
      if (nextProps.annotation_jobs.items.annotation_job.notes) {
        previous_notes = nextProps.annotation_jobs.items.annotation_job.notes;
      }
      this.setState({
        job_id: nextProps.annotation_jobs.items.annotation_job.id,
        is_positive: answer,
        notes: previous_notes,
        topic_annotation_id: annotation_id,
        previousAnnotation: previousAnnotationIsLoaded,
        showAlert: false
      });
    }
  }

  getParams = () => {
    const topic_annotations = [];
    const annotation_result = {};
    annotation_result.is_positive = this.state.is_positive === 'yes';
    annotation_result.topic_name = this.state.topic;
    const details = {};
    if (this.state.topics) {
      details.topics = this.state.topics;
    }
    if (details) {
      annotation_result.details = details;
    }
    if (this.state.topic_annotation_id) {
      annotation_result.topic_annotation_id = this.state.topic_annotation_id;
    }
    topic_annotations.push(annotation_result);
    const params = {};
    params.topic_annotations = topic_annotations;
    if (this.state.notes) {
      params.notes = this.state.notes;
    }
    if (this.state.difficulty) {
      params.user_difficulty = this.state.difficulty;
    }
    if (this.state.arbitraryTags && this.state.arbitraryTags.length > 0) {
      params.arbitrary_tags = this.state.arbitraryTags;
    }
    return params;
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state.showAlert = false;
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  submit = () => {
    const new_state = {};
    if (!this.state.previousAnnotation) {
      new_state.count = this.state.count + 1;
      new_state.total = this.state.total - 1;
    }
    new_state.previous_job_id = this.state.job_id;
    new_state.difficulty = null;
    new_state.arbitraryTags = null;
    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams());
    this.setState(new_state);
    this.props.fetchAnnotationJob(this.state.task_id);
  };

  handleDone = () => {
    this.props
      .createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams())
      .then(() => {
        window.location = '#/dashboard';
      });
    this.setState({ difficulty: null, arbitraryTags: null });
  };

  handleError = () => {
    this.setState({
      total: this.state.total - 1,
      previous_job_id: this.state.job_id,
      showAlert: false
    });
    const params = {};
    params.error = true;
    if (!this.isEmpty(this.state.notes)) {
      params.notes = this.state.notes;
    }
    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, params);
    this.props.fetchAnnotationJob(this.state.task_id);
  };

  handleSkip = () => {
    // Check that notes are provided for skipped document
    if (this.isEmpty(this.state.notes)) {
      this.setState({ showAlert: true });
    } else {
      this.setState({ total: this.state.total - 1, previous_job_id: this.state.job_id });
      const params = {};
      params.skip = true;
      params.notes = this.state.notes;
      this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, params);
      this.props.fetchAnnotationJob(this.state.task_id);
    }
  };

  openNextDocument = () => {
    this.setState({ total: this.state.total - 1 });
    this.props.fetchAnnotationJob(this.state.task_id);
  };

  openPreviousDocument = () => {
    this.setState({
      previous_job_id: null,
      showAlert: false,
      total: this.state.total + 1
    });
    const params = {};
    params.complete_later = true;
    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, params);
    this.props.fetchAnnotationJobById(this.state.task_id, this.state.previous_job_id);
  };

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  render() {
    if (!this.props.annotation_jobs || !this.props.annotation_jobs.isReady) {
      return null;
    }
    if (this.props.annotation_jobs.items.errors) {
      return (
        <div>
          <h4>{this.props.annotation_jobs.items.errors}</h4>
          <Button bsStyle="primary" onClick={this.openNextDocument}>
            Next
          </Button>
        </div>
      );
    } else if (!this.props.annotation_jobs.items.annotation_job) {
      return (
        <div>
          <h4>Queue is empty</h4>
        </div>
      );
    }

    const document = this.props.annotation_jobs.items.document;
    const agencies_display = [];
    for (const agency of document.agencies) {
      agencies_display.push(agency.short_name);
    }

    const topic = _.find(this.props.annotation_task_topic_groups, ['name', this.state.topic]);
    const arbitraryTags = topic ? topic.arbitrary_tags : [];
    const arbitraryTagOptions = arbitraryTags.map(tag => {
      return { value: tag, label: tag };
    });

    return (
      <div>
        <Row>
          <Col sm={10}>
            <h1>{document.title}</h1>
          </Col>
          <Col sm={2}>
            <div className="counter-container">
              <h1>{this.state.count}</h1>
              <p>completed</p>
              <p>this session</p>
              <p>Total queued: {this.state.total}</p>
            </div>
          </Col>
        </Row>
        <p>
          <b>Author:</b> {agencies_display.join()}
        </p>
        <p>
          <b>Publication Date:</b> {document.publication_date}
        </p>
        <p>
          <b>Doc ID:</b> {document.id}
        </p>
        <p>
          <b>Document type:</b> {document.category}
        </p>
        <p>
          <b>Web url: </b>
          <a href={document.web_url} target="_blank">
            {document.web_url}
          </a>
        </p>
        <p>
          <b>Pdf url: </b>
          <a href={document.pdf_url} target="_blank">
            {document.pdf_url}
          </a>
        </p>
        <div className="text-container">{document.full_text}</div>
        <Row>
          <FormGroup>
            <Col sm={8}>
              <div className={TOPIC_DEFINITION[this.state.topic] ? '' : 'hidden'}>
                <h4>Definition of {this.state.topic}</h4>
                <div className="topic-definition">{TOPIC_DEFINITION[this.state.topic]}</div>
              </div>
            </Col>
          </FormGroup>
          <FormGroup className="topic-form-group">
            <Col sm={6}>
              <h4>Difficulty of Judgment</h4>
              <select
                className="form-control"
                value={this.state.difficulty}
                onChange={e => this.setState({ difficulty: e.target.value })}
              >
                <option value="" />
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </Col>
          </FormGroup>
        </Row>
        {this.props.user.roles.includes('admin') ? (
          <Row>
            <FormGroup>
              <Col sm={6}>
                <h4>Arbitrary Tags</h4>
                <Select
                  options={arbitraryTagOptions}
                  multi
                  value={this.state.arbitraryTags}
                  onChange={objs => {
                    this.setState({
                      arbitraryTags: objs.map(obj => obj.value)
                    });
                  }}
                />
              </Col>
            </FormGroup>
          </Row>
        ) : null}
        <Row>
          <FormGroup className="topic-form-group">
            <Col sm={12}>
              <h4>
                Is this a{' '}
                <span className="text-capitalize">
                  <b>{this.state.topic}</b>
                </span>{' '}
                document?
              </h4>
              <Radio
                name="is_positive"
                value="yes"
                inline
                checked={this.state.is_positive === 'yes'}
                onChange={e => this.handleFieldChange('is_positive', e)}
              >
                YES
              </Radio>
              <Radio
                name="is_positive"
                value="no"
                inline
                checked={this.state.is_positive === 'no'}
                onChange={e => this.handleFieldChange('is_positive', e)}
              >
                NO
              </Radio>
              <Button bsStyle="primary" onClick={this.submit} disabled={!this.state.is_positive}>
                Next
              </Button>
            </Col>
          </FormGroup>

          <FormGroup className="topic-form-group">
            <Col sm={6}>
              <FormControl
                className="notes-text-area"
                componentClass="textarea"
                placeholder="Notes (required for skipped document)"
                value={this.state.notes}
                onChange={e => this.handleFieldChange('notes', e)}
              />
            </Col>
          </FormGroup>
          <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
            {'Notes are required when skipping a document.'}
          </div>

          <Button
            bsStyle="primary"
            disabled={!this.state.previous_job_id}
            onClick={this.openPreviousDocument}
          >
            Back
          </Button>
          <Button bsStyle="primary" onClick={this.handleError}>
            Error
          </Button>
          <Button bsStyle="primary" onClick={this.handleDone} disabled={!this.state.is_positive}>
            {"I'm done"}
          </Button>
          <Button bsStyle="primary" onClick={this.handleSkip}>
            Skip
          </Button>
        </Row>
      </div>
    );
  }
}

// We'll display this section once we have an actual list of those to use
// <FormGroup className="topic-form-group">
//   <Col sm={6}>
//   <FormControl
//     className="notes-text-area"
//     componentClass="textarea"
//     placeholder="Notes (optional)"
//     onChange={e => this.handleFieldChange('notes', e)}
//   />
//   </Col>
//   <Col sm={6}>
//   <Radio
//     name="topics"
//     value="micro"
//     onChange={e => this.handleFieldChange('topics', e)}
//   >
//   MICRO TOPICS
//   </Radio>
//   <Radio
//     name="topics"
//     value="macro"
//     onChange={e => this.handleFieldChange('topics', e)}
//   >
//   MACRO TOPICS
//   </Radio>
//     </Col>
//   </FormGroup>

AnnotationTool.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllAnnotationTasks: () => {
      dispatch(fetchAllAnnotationTasks());
    },
    fetchAnnotationJob: task_id => {
      dispatch(fetchAnnotationJob(task_id));
    },
    createAnnotationsForJob: (task_id, job_id, params) => {
      return dispatch(createAnnotationsForJob(task_id, job_id, params));
    },
    fetchAllAnnotationJobs: (task_id, params) => {
      return dispatch(fetchAllAnnotationJobs(task_id, params));
    },
    fetchAnnotationJobById: (task_id, job_id) => {
      dispatch(fetchAnnotationJobById(task_id, job_id));
    },
    fetchAnnotationTaskTopicGroups: () => {
      return dispatch(fetchAnnotationTaskTopicGroups());
    }
  };
};

const mapStateToProps = state => {
  return {
    all_annotation_tasks: state.all_annotation_tasks,
    annotation_jobs: state.annotation_jobs,
    annotations_for_job: state.annotations_for_job,
    all_annotation_jobs: state.all_annotation_jobs,
    annotation_task_topic_groups: state.annotation_task_topic_groups.annotation_task_topic_groups,
    user: state.current_user.user
  };
};

const ReduxAnnotationTool = connect(mapStateToProps, mapDispatchToProps)(AnnotationTool);

export default ReduxAnnotationTool;
