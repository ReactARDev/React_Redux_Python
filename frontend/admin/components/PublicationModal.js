import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap';
import { updatePublicationWithParams } from '../../shared/actions';
import _ from 'lodash';

class PublicationModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      saveDisabled: false,
      name: '',
      days_between_crawls: '',
      active_crawls: false,
      active_display: false,
      showAlert: false,
      updateMode: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const all_publications = this.props.all_publications.items;
    let existing_pub = null;

    let new_state = {
      name: '',
      days_between_crawls: '',
      active_crawls: false,
      active_display: false,
      updateMode: false
    };

    if (nextProps.publication_id) {
      existing_pub = _.find(all_publications, { id: nextProps.publication_id });

      new_state = {
        name: existing_pub.name,
        days_between_crawls: existing_pub.days_between_crawls,
        active_crawls: existing_pub.active_crawls,
        active_display: existing_pub.active_display,
        updateMode: true
      };
    }

    this.setState(new_state);
  }

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  handleSubmit = event => {
    event.preventDefault();
    const params = {};

    this.props.close();
    this.setState({ saveDisabled: true });

    if (this.state.updateMode) {
      const all_publications = this.props.all_publications.items;
      const existing_publication = _.find(all_publications, { id: this.props.publication_id });

      if (existing_publication.active_display !== this.state.active_display) {
        params.active_display = this.state.active_display;
      }

      if (existing_publication.active_crawls !== this.state.active_crawls) {
        params.active_crawls = this.state.active_crawls;
      }

      if (existing_publication.days_between_crawls !== this.state.days_between_crawls) {
        params.days_between_crawls = this.state.days_between_crawls;
      }

      this.props.updatePublicationWithParams(this.props.publication_id, params).then(() => {
        this.props.updatePublications();
      });
    }
  };

  handleFieldChange = (field, val) => {
    const new_state = { showAlert: false };
    new_state[field] = val;
    this.setState(new_state);
  };

  closeModal = () => {
    this.setState({ showAlert: false });
    this.props.close();
  };

  render() {
    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>Publication</Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup>
              <ControlLabel>Name</ControlLabel>
              <FormControl componentClass="input" value={this.state.name} disabled />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Display status</ControlLabel>
              <select
                className="form-control"
                value={this.state.active_display ? 'shown' : 'hidden'}
                onChange={e => this.handleFieldChange('active_display', e.target.value === 'shown')}
              >
                <option value="shown">Shown</option>
                <option value="hidden">Hidden</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Crawl status</ControlLabel>
              <select
                className="form-control"
                value={this.state.active_crawls ? 'active' : 'inactive'}
                onChange={e => this.handleFieldChange('active_crawls', e.target.value === 'active')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Days between crawls</ControlLabel>
              <FormControl
                componentClass="input"
                onChange={e => this.handleFieldChange('days_between_crawls', e.target.value)}
                value={this.state.days_between_crawls}
              />
            </FormGroup>
            <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
              Please make sure that all required fields are filled in.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeModal}>Close</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              {this.state.updateMode ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

PublicationModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    updatePublicationWithParams: (publication_id, data) => {
      return dispatch(updatePublicationWithParams(publication_id, data));
    }
  };
};

const mapStateToProps = state => {
  return {
    publication: state.publication,
    all_publications: state.all_publications,
    errors: state.errors
  };
};

const ReduxPublicationModal = connect(mapStateToProps, mapDispatchToProps)(PublicationModal);

export default ReduxPublicationModal;
