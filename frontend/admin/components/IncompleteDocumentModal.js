import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap';
import { updateDocument } from '../../shared/actions';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import moment from 'moment';

const requiredFields = ["title", "publication_date", "summary_text"];

class IncompleteDocumentModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      saveDisabled: false,
      notes: '',
      format_str: 'YYYY-MM-DDTHH:mm:ss',
      showAlert: false,
      missing_fields: []
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.incomplete_documents && this.props.incomplete_documents.isReady &&
      nextProps.document_id) {
      const doc = _.find(this.props.incomplete_documents.items.documents,
        { id: nextProps.document_id });

      const missing_fields = _.filter(requiredFields, field => {
        return !doc[field] || doc[field].length === 0;
      });

      this.setState({
        title: doc.title,
        initial_title: doc.title,
        summary_text: doc.summary_text,
        initial_summary_text: doc.summary_text,
        publication_date: doc.publication_date ? moment(doc.publication_date) : null,
        initial_publication_date: doc.publication_date ? moment(doc.publication_date) : null,
        missing_fields,
        pdf_url: doc.pdf_url,
        web_url: doc.web_url
      });
    }

    if (!nextProps.updated_document.isUpdating) {
      // close the modal on success
      if (this.props.showModal && this.state.saveDisabled) {
        this.props.close();
      }
      this.setState({
        saveDisabled: false
      });
    }
  }

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
    this.setState({ showAlert: false });
  };

  handleDateChange = date => {
    this.setState({ publication_date: date, showAlert: false });
  };

  handleSubmit = event => {
    event.preventDefault();
    const changes = {};
    if (this.state.title && this.state.title !== this.state.initial_title) {
      changes.title = this.state.title;
    }
    if (this.state.summary_text && this.state.summary_text !== this.state.initial_summary_text) {
      changes.summary_text = this.state.summary_text;
    }

    if (this.state.publication_date) {
      const initial_date = this.state.initial_publication_date ?
        this.state.initial_publication_date.format(this.state.format_str) : null;
      const changed_date = this.state.publication_date.format(this.state.format_str);
      if (initial_date !== changed_date) {
        changes.publication_date = changed_date;
      }
    }

    // Submit if changes were made
    if (_.isEmpty(changes)) {
      this.setState({ showAlert: true });
    } else {
      if (this.state.notes) {
        changes.notes = this.state.notes;
      }
      this.props.close();
      this.setState({ saveDisabled: true });
      this.props.updateDocument(this.props.document_id, changes).then(() => {
        this.props.reload_function(this.props.page_state);
      });
    }
  };

  closeModal = () => {
    this.setState({ showAlert: false });
    this.props.close();
  };

  render() {
    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>
            Document ID: {this.props.document_id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup>
            <ControlLabel>Title</ControlLabel>
            <FormControl
              componentClass="textarea"
              value={this.state.title}
              onChange={e => this.handleFieldChange('title', e)}
              disabled={!_.includes(this.state.missing_fields, 'title')}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Summary</ControlLabel>
            <FormControl
              componentClass="textarea"
              value={this.state.summary_text}
              onChange={e => this.handleFieldChange('summary_text', e)}
              disabled
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Publication Date</ControlLabel>
            <div>
              <DatePicker
                selected={this.state.publication_date}
                onChange={this.handleDateChange}
                disabled={!_.includes(this.state.missing_fields, 'publication_date')}
              />
            </div>
          </FormGroup>
          <p>
            <b>Web url: </b>
            <a href={this.state.web_url} target="_blank">
              {this.state.web_url}
            </a>
          </p>
          <p>
            <b>Pdf url: </b>
            <a href={this.state.pdf_url} target="_blank">
              {this.state.pdf_url}
            </a>
          </p>
          <FormGroup>
            <ControlLabel>Notes</ControlLabel>
            <FormControl
              componentClass="textarea"
              onChange={e => this.handleFieldChange('notes', e)}
            />
          </FormGroup>
          <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
            Please modify at least one document field before submit
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.closeModal}>Close</Button>
          <Button
            bsStyle="primary"
            type="submit"
            disabled={this.state.saveDisabled}
            onClick={this.handleSubmit}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

IncompleteDocumentModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    updateDocument: (id, data) => {
      return dispatch(updateDocument(id, data));
    }
  };
};

const mapStateToProps = state => {
  return {
    incomplete_documents: state.incomplete_documents,
    updated_document: state.updated_document
  };
};

const ReduxIncompleteDocumentModal =
  connect(mapStateToProps, mapDispatchToProps)(IncompleteDocumentModal);

export default ReduxIncompleteDocumentModal;
