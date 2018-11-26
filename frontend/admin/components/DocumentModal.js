import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap';
import { flagDocument } from '../../shared/actions';
import _ from 'lodash';

class DocumentModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      saveDisabled: false,
      issue_severity: 'review',
      issue_type: 'technical',
      field: '',
      notes: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.flagged_document.isUpdating) {
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
  };

  handleSubmit = event => {
    event.preventDefault();
    this.setState({ saveDisabled: true });
    this.props.close();
    this.props.flagDocument(this.props.document_id, _.cloneDeep(this.state)).then(() => {
      this.props.updateDocumentsResult();
    });
  };

  render() {
    return (
      <Modal show={this.props.showModal} onHide={this.props.close}>
        <Modal.Header>
          <Modal.Title>
            Document ID: {this.props.document_id}
          </Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Issue Severity</ControlLabel>
              <FormControl
                componentClass="select"
                placeholder="select"
                defaultValue={this.state.issue_severity}
                onChange={e => this.handleFieldChange('issue_severity', e)}
              >
                <option value="review">REVIEW</option>
                <option value="hide_now">HIDE NOW</option>
              </FormControl>
            </FormGroup>
            <FormGroup controlId="formControlsSelect">
              <ControlLabel>Issue Type</ControlLabel>
              <FormControl
                componentClass="select"
                placeholder="select"
                defaultValue={this.state.issue_type}
                onChange={e => this.handleFieldChange('issue_type', e)}
              >
                <option value="technical">TECHNICAL</option>
                <option value="not relevant">NOT RELEVANT</option>
              </FormControl>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Field</ControlLabel>
              <FormControl type="text" onChange={e => this.handleFieldChange('field', e)} />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Notes</ControlLabel>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('notes', e)}
              />
            </FormGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.props.close}>Close</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              Flag
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

DocumentModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    flagDocument: (id, data) => {
      return dispatch(flagDocument(id, data));
    }
  };
};

const mapStateToProps = state => {
  return {
    flagged_document: state.flagged_document,
    errors: state.errors
  };
};

const ReduxDocumentModal = connect(mapStateToProps, mapDispatchToProps)(DocumentModal);

export default ReduxDocumentModal;
