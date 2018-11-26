import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchAnnotationJob, createAnnotationsForJob } from '../../shared/actions';
import { Button, Modal, FormGroup, ControlLabel, FormControl, Checkbox } from 'react-bootstrap';
import _ from 'lodash';
import moment from 'moment';
import { appUrl } from '../../shared/config';

const MAX_REVIEWS_PER_DAY = 10;
const QUEUE_SIZE = 5;
const FIELD_NAME_STATENAME_MAP = {
  title: 'Title',
  pub_date: 'Publication Date',
  summary: 'Summary',
  category: 'Document Type'
};

class ContributorTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      notes: '',
      flagged_field_notes_map: {},
      title: '',
      pub_date: '',
      category: '',
      summary: '',
      noErrors: false,
      today_total: null
    };
  }

  componentWillMount() {
    const { query } = this.props.location;
    const id = query.id;
    this.setState({ task_id: id });
    this.props.fetchAnnotationJob(id);
    this.setState({
      today_total: this.props.contributor_reviews.contributor_reviews_count.today_total
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.annotation_jobs.isReady &&
      nextProps.annotation_jobs.items.annotation_job &&
      !_.isEqual(this.props.annotation_jobs, nextProps.annotation_jobs)
    ) {
      this.setState({
        job_id: nextProps.annotation_jobs.items.annotation_job.id,
        title: '',
        pub_date: '',
        category: '',
        summary: '',
        noErrors: false
      });
    }
  }

  getParams = () => {
    const params = {};
    if (!this.state.noErrors) {
      const multiple_field = {};
      if (!this.isEmpty(this.state.title)) {
        multiple_field.title = this.state.title;
      }
      if (!this.isEmpty(this.state.pub_date)) {
        multiple_field.pub_date = this.state.pub_date;
      }
      if (!this.isEmpty(this.state.category)) {
        multiple_field.category = this.state.category;
      }
      if (!this.isEmpty(this.state.summary)) {
        multiple_field.summary = this.state.summary;
      }

      params.multiple_field = multiple_field;
    }
    return params;
  };

  handleNext = () => {
    const new_state = {};
    new_state.today_total = this.state.today_total + 1;
    this.setState(new_state);
    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams());
    this.props.fetchAnnotationJob(this.state.task_id);
  };

  handleDone = () => {
    this.props
      .createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams())
      .then(() => {
        window.location = '#/dashboard';
      });
  };

  openModal = (field, content) => {
    this.setState({ showModal: true, opened_field: field, opened_content: content });
  };

  close = () => {
    this.setState({ showModal: false });
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state.noErrors = false;
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  toggleNoErrors = e => {
    this.setState({
      noErrors: e.target.checked,
      title: '',
      pub_date: '',
      category: '',
      summary: ''
    });
  };

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  openNextDocument = () => {
    this.props.fetchAnnotationJob(this.state.task_id);
  };

  handleNavigateToProduct = () => {
    window.location = appUrl;
  };

  render() {
    if (!this.props.annotation_jobs || !this.props.annotation_jobs.isReady) {
      return null;
    }

    if (this.props.annotation_jobs.items.errors) {
      return (
        <div>
          <h4>{'This document cannot be displayed.'}</h4>
          <Button bsStyle="primary" onClick={this.openNextDocument}>
            Next Document
          </Button>
        </div>
      );
    } else if (!this.props.annotation_jobs.items.annotation_job) {
      return (
        <div>
          <h4>{'Your document queue is empty'}</h4>
          <Button
            bsStyle="primary"
            className="back-to-product"
            onClick={this.handleNavigateToProduct}
          >
            Back to Pro Edition
          </Button>
        </div>
      );
    }

    let next_visible = true;
    const today_total_int = parseInt(this.state.today_total, 10);
    if (today_total_int >= MAX_REVIEWS_PER_DAY - 1) {
      next_visible = false;
    }

    let nextButtonText = 'Next';
    if (today_total_int === 4) {
      nextButtonText = 'Show me 5 more';
    }

    const document = this.props.annotation_jobs.items.document;

    const display_pub_date = moment(document.publication_date).format('YYYY-MM-DD');

    const agencies = [];
    for (const a of document.agencies) {
      agencies.push(a.short_name);
    }
    const agencies_display = agencies.join();

    const instruction_line =
      '1. Select the flag next to the part(s)' +
      ' of the document where you see an error and provide notes in the pop-up window(s).';

    const review_instructions = (
      <div>
        <h4 className="instruction-header">
          {'Thank you for helping us maintain the quality of our content!'}
        </h4>
        <p>
          <b>What to look for:</b>
        </p>
        <p className="indented-text">
          <b>Title:</b> Typos or stray characters; vague titles
        </p>
        <p className="indented-text">
          <b>Publication date:</b> Stray characters
        </p>
        <p className="indented-text">
          <b>Document Summary:</b> Typos or stray characters; vague descriptions
        </p>
        <p className="instructions-paragraph">
          <b>How to complete a review:</b>
        </p>
        <p className="indented-text">
          <b>With errors:</b>
        </p>
        <p className="indented-text-double">{instruction_line}</p>
        <p className="indented-text-double">{'2. Select "Next" at the bottom of the screen.'}</p>
        <p className="indented-text">
          <b>No errors:</b>
        </p>
        <p className="indented-text-double">
          {'1. Select box that indicates "No errors in this document".'}
        </p>
        <p className="indented-text-double">{'2. Select "Next" at the bottom of the screen.'}</p>
      </div>
    );

    const flagged_fields_empty =
      this.isEmpty(this.state.title) &&
      this.isEmpty(this.state.pub_date) &&
      this.isEmpty(this.state.category) &&
      this.isEmpty(this.state.summary);
    const isNextAvailable = this.state.noErrors || !flagged_fields_empty;
    const document_number = this.state.today_total % QUEUE_SIZE + 1;

    return (
      <div>
        <h2>Review Documents</h2>
        <div>{review_instructions}</div>
        <h4 className="instruction-header">
          Document {document_number} of {QUEUE_SIZE}
        </h4>
        <div className="contributor-document-container">
          <p
            className="contributor-flagged-field"
            onClick={() => this.openModal('title', document.title)}
          >
            <span className={this.isEmpty(this.state.title) ? 'unflagged' : 'flagged'}>
              <i className="material-icons">flag</i>
            </span>
            <b>Title: </b>
            {document.title}
          </p>

          <p>
            <b>Author: </b>
            {agencies_display}
          </p>

          <p
            className="contributor-flagged-field"
            onClick={() => this.openModal('pub_date', display_pub_date)}
          >
            <span className={this.isEmpty(this.state.pub_date) ? 'unflagged' : 'flagged'}>
              <i className="material-icons">flag</i>
            </span>
            <b>Publication Date: </b>
            {display_pub_date}
          </p>

          <p
            className="contributor-flagged-field"
            onClick={() => this.openModal('category', document.category)}
          >
            <span className={this.isEmpty(this.state.category) ? 'unflagged' : 'flagged'}>
              <i className="material-icons">flag</i>
            </span>
            <b>Document Type: </b>
            {document.category}
          </p>

          <p
            className="contributor-flagged-field"
            onClick={() => this.openModal('summary', document.summary_text)}
          >
            <span className={this.isEmpty(this.state.summary) ? 'unflagged' : 'flagged'}>
              <i className="material-icons">flag</i>
            </span>
            <b>Summary: </b>
            {document.summary_text}
          </p>
          <p>
            <b>Full Text: </b>
            {document.full_text}
          </p>
        </div>
        <div className="contributor-view-checkbox">
          <Checkbox
            onChange={this.toggleNoErrors}
            checked={this.state.noErrors}
            className="text-large"
          >
            {'No errors in this document'}
          </Checkbox>
        </div>
        <div className="contributor-buttons">
          <Button
            bsStyle="primary"
            className={next_visible ? '' : 'hidden'}
            onClick={this.handleNext}
            disabled={!isNextAvailable}
          >
            {nextButtonText}
          </Button>
          <Button bsStyle="primary" onClick={this.handleDone} disabled={!isNextAvailable}>
            {"I'm Done"}
          </Button>
        </div>

        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Body>
            <div id="">
              <p>
                <span className="flagged">
                  <i className="material-icons">flag</i>
                </span>
                <b>{FIELD_NAME_STATENAME_MAP[this.state.opened_field]}: </b>
                {this.state.opened_content}
              </p>
              <FormGroup>
                <ControlLabel>Notes (required)</ControlLabel>
                <FormControl
                  componentClass="textarea"
                  onChange={e => this.handleFieldChange(this.state.opened_field, e)}
                  value={this.state[this.state.opened_field]}
                />
              </FormGroup>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close}>Ok</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

ContributorTool.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAnnotationJob: task_id => {
      dispatch(fetchAnnotationJob(task_id));
    },
    createAnnotationsForJob: (task_id, job_id, params) => {
      return dispatch(createAnnotationsForJob(task_id, job_id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    annotation_jobs: state.annotation_jobs,
    contributor_reviews: state.contributor_reviews
  };
};

const ReduxContributorTool = connect(mapStateToProps, mapDispatchToProps)(ContributorTool);

export default ReduxContributorTool;
