import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup, Checkbox } from 'react-bootstrap';
import {
  fetchAllTermSamplingGroups,
  createTermSamplingGroupsFromParams,
  updateTermSamplingGroupWithParams
} from '../../shared/actions';
import Select from 'react-select';
import _ from 'lodash';
import escapeStringRegexp from 'escape-string-regexp';

class TermSamplingGroupsModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      saveDisabled: false,
      terms: null,
      term_options: [],
      new_term: '',
      updateMode: false,
      showAlert: false,
      alert_message: '',
      regex_mode: false
    };
  }

  componentWillMount() {}

  componentWillReceiveProps(nextProps) {
    const all_groups = this.props.term_sampling_groups.items.term_sampling_groups;
    let existing_group = null;

    let new_state = {
      name: '',
      terms: null,
      new_term: '',
      updateMode: false,
      regex_mode: false
    };

    if (nextProps.group_id) {
      existing_group = _.find(all_groups, { id: nextProps.group_id });
      const options = [];
      existing_group.terms.forEach(term => {
        options.push({ value: term, label: term });
      });

      new_state = {
        name: existing_group.name,
        term_options: options,
        terms: existing_group.terms.join(),
        updateMode: true
      };
    }

    this.setState(new_state);
  }

  closeModal = () => {
    this.setState({ showAlert: false });
    this.props.close();
  };

  handleSelectChange = (field, val) => {
    const new_state = { showAlert: false };
    new_state[field] = val;
    this.setState(new_state);
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = { showAlert: false };
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  addNewTerm = () => {
    const new_term_options = _.cloneDeep(this.state.term_options);

    let new_term_formatted = this.state.new_term;
    if (!this.state.regex_mode) {
      new_term_formatted = escapeStringRegexp(this.state.new_term);
    }

    new_term_options.push({
      value: new_term_formatted,
      label: new_term_formatted
    });
    const new_terms = this.state.terms
      ? this.state.terms + ',' + new_term_formatted
      : new_term_formatted;
    this.setState({ terms: new_terms, term_options: new_term_options, new_term: '' });
  };

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  handleSubmit = event => {
    event.preventDefault();
    if (!this.state.terms || this.isEmpty(this.state.name) || this.isEmpty(this.state.terms)) {
      this.setState({
        alert_message: 'Please make sure that name and terms are filled in.',
        showAlert: true
      });
    } else {
      if (this.state.updateMode) {
        this.updateGroup();
      } else {
        this.createGroup();
      }
    }
  };

  updateGroup = () => {
    const all_groups = this.props.term_sampling_groups.items.term_sampling_groups;
    const existing_group = _.find(all_groups, { id: this.props.group_id });
    const params = {};
    if (!_.isEqual(existing_group.name, this.state.name)) {
      params.name = this.state.name;
    }
    const updated_terms = this.state.terms.split(',');
    if (!_.isEqual(existing_group.terms, updated_terms)) {
      params.terms = _.cloneDeep(updated_terms);
    }
    if (_.isEmpty(params)) {
      this.setState({
        alert_message: 'Please modify at least one field before submit',
        showAlert: true
      });
    } else {
      this.props.close();
      this.setState({ saveDisabled: true });
      this.props.updateTermSamplingGroupWithParams(this.props.group_id, params).then(() => {
        this.props.updateGroups();
      });
    }
  };

  createGroup = () => {
    const params = {};
    params.name = this.state.name;
    params.terms = _.cloneDeep(this.state.terms.split(','));

    this.props.close();
    this.setState({ saveDisabled: true });
    this.props.createTermSamplingGroupsFromParams(params).then(() => {
      this.props.updateGroups();
    });
  };

  toggleTermEnterMode = e => {
    this.setState({ regex_mode: e.target.checked });
  };

  render() {
    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>Create Term Sampling Group</Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup>
              <ControlLabel>Name</ControlLabel>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('name', e)}
                value={this.state.name}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Add term</ControlLabel>
              <Checkbox onChange={this.toggleTermEnterMode}>Use regex mode</Checkbox>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('new_term', e)}
                value={this.state.new_term}
              />

              <Button
                className="add-term-button"
                onClick={this.addNewTerm}
                disabled={!this.state.new_term}
              >
                Add
              </Button>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Terms</ControlLabel>
              <Select
                multi
                options={this.state.term_options}
                value={this.state.terms}
                onChange={objs =>
                  this.handleSelectChange('terms', objs.map(obj => obj.value).join(','))}
              />
            </FormGroup>
            <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
              {this.state.alert_message}
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

TermSamplingGroupsModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllTermSamplingGroups: () => {
      dispatch(fetchAllTermSamplingGroups());
    },
    createTermSamplingGroupsFromParams: params => {
      return dispatch(createTermSamplingGroupsFromParams(params));
    },
    updateTermSamplingGroupWithParams: (id, params) => {
      return dispatch(updateTermSamplingGroupWithParams(id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    term_sampling_groups: state.term_sampling_groups
  };
};

const ReduxTermSamplingGroupsModal = connect(mapStateToProps, mapDispatchToProps)(
  TermSamplingGroupsModal
);

export default ReduxTermSamplingGroupsModal;
