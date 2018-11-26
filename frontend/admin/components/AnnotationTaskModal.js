import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Modal,
  Button,
  FormControl,
  ControlLabel,
  FormGroup,
  Col,
  Row,
  Checkbox
} from 'react-bootstrap';
import {
  createAnnotationTaskFromParams,
  updateAnnotationTaskWithParams,
  fetchAllCategories,
  fetchAllJurisdictions,
  fetchAllProvenances,
  fetchAllUsers,
  fetchAllTermSamplingGroups
} from '../../shared/actions';
import Select from 'react-select';
import _ from 'lodash';
import { defaultFederalAgencies, defaultStateAgencies } from '../../shared/utils/defaultSources';
import DatePicker from 'react-datepicker';
import moment from 'moment';

class AnnotationTaskModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      saveDisabled: false,
      name: '',
      topics: '',
      status: 'active',
      showAlert: false,
      updateMode: false,
      agency_id: '',
      category: '',
      format_str: 'YYYY-MM-DDTHH:mm:ss',
      provenance: '',
      jurisdiction: '',
      users: '',
      num_touches: '',
      alert_message: '',
      selected_group_terms: '',
      groups: '',
      showTerms: false,
      pub_date_filter: null,
      type: '',
      slot_type: '',
      document_selection_strategy: 'random'
    };
  }

  componentWillMount() {
    this.props.fetchAllCategories();
    this.props.fetchAllJurisdictions();
    this.props.fetchAllProvenances();
  }

  componentWillReceiveProps(nextProps) {
    const all_annotation_tasks = this.props.all_annotation_tasks.annotation_tasks;
    let existing_annotation_task = null;

    // Check if contributor task exists
    let contributor_task_found = false;
    const contributor_task = _.find(all_annotation_tasks, {
      type: 'contributor',
      status: 'active'
    });
    if (contributor_task) {
      contributor_task_found = true;
    }

    let new_state = {
      name: '',
      topics: '',
      updateMode: false,
      agency_id: '',
      category: '',
      provenance: '',
      jurisdiction: '',
      users: '',
      num_touches: '',
      published_from: null,
      published_to: null,
      selected_group_terms: '',
      groups: '',
      showTerms: false,
      type: '',
      slot_type: '',
      document_selection_strategy: 'random',
      contributor_task_exists: contributor_task_found
    };

    if (nextProps.annotation_task_id) {
      existing_annotation_task = _.find(all_annotation_tasks, { id: nextProps.annotation_task_id });
      const config = existing_annotation_task.config;
      const filters = config ? config.doc_filters : {};
      let new_state_categories = '';
      if (filters && filters.category) {
        if (Array.isArray(filters.category)) {
          new_state_categories = filters.category.join(',');
        } else {
          new_state_categories = filters.category;
        }
      }

      let new_pub_date_filter = null;
      if (filters && filters.published_in_last_day) {
        new_pub_date_filter = 'day';
      }
      if (filters && filters.published_in_last_week) {
        new_pub_date_filter = 'week';
      }

      let existing_topics = null;
      if (existing_annotation_task.topics) {
        existing_topics = Object.keys(existing_annotation_task.topics).join(',');
      }

      new_state = {
        name: existing_annotation_task.name,
        topics: existing_topics,
        updateMode: true,
        users: existing_annotation_task.user_ids ? existing_annotation_task.user_ids.join() : '',
        agency_id: filters && filters.agency_id ? filters.agency_id.join() : '',
        category: new_state_categories,
        published_from: filters && filters.published_from ? moment(filters.published_from) : null,
        published_to: filters && filters.published_to ? moment(filters.published_to) : null,
        provenance: filters && filters.provenance ? filters.provenance : '',
        jurisdiction: filters && filters.jurisdiction ? filters.jurisdiction : '',
        num_touches: config && config.num_touches ? config.num_touches.toString() : '',
        groups: existing_annotation_task.term_sampling_group_ids
          ? existing_annotation_task.term_sampling_group_ids.join()
          : '',
        pub_date_filter: new_pub_date_filter,
        type: existing_annotation_task.type,
        status: existing_annotation_task.status,
        slot_type: config && config.slot_type ? config.slot_type : '',
        document_selection_strategy: config && config.document_selection_strategy ?
          config.document_selection_strategy : 'random'
      };
    }

    this.setState(new_state);
  }

  getAllNumTouchesOptions = () => {
    const result = [];
    for (let i = 1; i <= 10; i++) {
      result.push({ value: i, label: i.toString() });
    }
    return result;
  };

  getAllDefaultAgencies = () => {
    const list = [];
    defaultFederalAgencies.forEach(agency => {
      if (agency.id) {
        list.push({ value: agency.id, label: agency.short_name });
      }
    });

    defaultStateAgencies.forEach(agency => {
      if (agency.id) {
        list.push({ value: agency.id, label: agency.short_name });
      }
    });
    return list;
  };

  num_touches_options = this.getAllNumTouchesOptions();

  agencies_options_default_list = this.getAllDefaultAgencies();

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  updateTask = () => {
    const params = {};
    const all_annotation_tasks = this.props.all_annotation_tasks.annotation_tasks;
    const existing_annotation_task = _.find(all_annotation_tasks, {
      id: this.props.annotation_task_id
    });

    if (existing_annotation_task.name !== this.state.name) {
      params.name = this.state.name;
    }

    if (existing_annotation_task.status !== this.state.status) {
      params.status = this.state.status;
    }

    if (this.state.type !== 'contributor') {
      if (Object.keys(existing_annotation_task.topics).join(',') !== this.state.topics) {
        const new_topics = {};
        this.state.topics.split(',').forEach((topic, i) => {
          new_topics[topic] = {};
        });
        params.topics = new_topics;
      }

      if (!_.isEqual(existing_annotation_task.user_ids.join(','), this.state.users)) {
        if (this.state.users) {
          params.user_ids = this.state.users.split(',').map(Number);
        } else {
          params.user_ids = [];
        }
      }
    }

    if (!_.isEqual(existing_annotation_task.term_sampling_group_ids.join(','), this.state.groups)) {
      if (this.state.groups) {
        params.term_sampling_group_ids = this.state.groups.split(',').map(Number);
      } else {
        params.term_sampling_group_ids = [];
      }
    }

    // Save all filter values in the object
    const current_doc_filters = {};
    if (this.state.agency_id) {
      current_doc_filters.agency_id = this.state.agency_id.split(',').map(Number);
    }

    if (this.state.category) {
      current_doc_filters.category = this.state.category.split(',');
    }

    if (this.state.provenance) {
      current_doc_filters.provenance = this.state.provenance;
    }

    if (this.state.jurisdiction) {
      current_doc_filters.jurisdiction = this.state.jurisdiction;
    }

    if (this.state.published_from) {
      current_doc_filters.published_from = this.state.published_from.format(this.state.format_str);
    }
    if (this.state.published_to) {
      current_doc_filters.published_to = this.state.published_to.format(this.state.format_str);
    }
    if (this.state.pub_date_filter) {
      if (this.state.pub_date_filter === 'day') {
        current_doc_filters.published_in_last_day = true;
      } else if (this.state.pub_date_filter === 'week') {
        current_doc_filters.published_in_last_week = true;
      }
    }

    const config = {};

    config.doc_filters = current_doc_filters;
    config.num_touches = this.state.num_touches ? parseInt(this.state.num_touches, 10) : '';
    if (this.state.slot_type) {
      config.slot_type = this.state.slot_type;
    }

    if (this.state.document_selection_strategy) {
      config.document_selection_strategy = this.state.document_selection_strategy;
    }

    // Update task only if changes were made
    if (_.isEmpty(params) && _.isEqual(config, existing_annotation_task.config)) {
      this.setState({
        alert_message: 'Please modify at least one field before submit',
        showAlert: true
      });
    } else {
      this.props.close();
      this.setState({ saveDisabled: true });
      params.config = config;
      this.props.updateAnnotationTaskWithParams(this.props.annotation_task_id, params).then(() => {
        this.props.updateAnnotationTasks();
      });
    }
  };

  createTask = () => {
    const params = {};
    params.name = this.state.name;
    params.type = this.state.type;
    // Current mapping for type field is: contributor -> contributor,
    // topic_annotation -> null, since we don't use type field for topic_annotation tasks.
    if (this.state.type === 'contributor') {
      params.is_contributor_task = true;
    }
    params.status = this.state.status;

    if (this.state.type === 'topic_annotation') {
      params.topics = {};
      this.state.topics.split(',').forEach((topic, i) => {
        params.topics[topic] = {};
      });
    }

    if (this.state.groups) {
      params.term_sampling_group_ids = this.state.groups.split(',').map(Number);
    }

    if (this.state.users) {
      params.user_ids = this.state.users.split(',').map(Number);
    }

    const config = {};
    const doc_filters = {};

    if (this.state.agency_id) {
      doc_filters.agency_id = this.state.agency_id.split(',').map(Number);
    }
    if (this.state.category) {
      doc_filters.category = this.state.category.split(',');
    }
    if (this.state.published_from) {
      doc_filters.published_from = this.state.published_from.format(this.state.format_str);
    }
    if (this.state.published_to) {
      doc_filters.published_to = this.state.published_to.format(this.state.format_str);
    }
    if (this.state.provenance) {
      doc_filters.provenance = this.state.provenance;
    }
    if (this.state.jurisdiction) {
      doc_filters.jurisdiction = this.state.jurisdiction;
    }

    if (this.state.pub_date_filter) {
      if (this.state.pub_date_filter === 'day') {
        doc_filters.published_in_last_day = true;
      } else if (this.state.pub_date_filter === 'week') {
        doc_filters.published_in_last_week = true;
      }
    }

    if (this.state.num_touches) {
      config.num_touches = parseInt(this.state.num_touches, 10);
    }
    if (this.state.slot_type) {
      config.slot_type = this.state.slot_type;
    }
    if (this.state.document_selection_strategy) {
      config.document_selection_strategy = this.state.document_selection_strategy;
    }
    if (!_.isEmpty(doc_filters)) {
      config.doc_filters = doc_filters;
    }
    if (!_.isEmpty(config)) {
      params.config = config;
    }

    this.props.close();
    this.setState({ saveDisabled: true });
    this.props.createAnnotationTaskFromParams(params).then(() => {
      this.props.updateAnnotationTasks();
    });
  };

  handleSubmit = event => {
    event.preventDefault();
    if (this.isEmpty(this.state.name) || this.isEmpty(this.state.type)) {
      this.setState({
        alert_message: "Please make sure that 'name' and 'type' fields are filled in.",
        showAlert: true
      });
    } else if (this.state.type === 'topic_annotation' && this.isEmpty(this.state.topics)) {
      const text =
        "Please make sure that 'topics' field is filled in" +
        'for task with Topic Annotation type.';
      this.setState({
        alert_message: text,
        showAlert: true
      });
    } else {
      if (this.state.updateMode) {
        this.updateTask();
      } else {
        this.createTask();
      }
    }
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = { showAlert: false };
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  handleSelectChange = (field, val) => {
    const new_state = { showAlert: false };
    new_state[field] = val;
    if (field === 'groups') {
      this.setState(new_state, () => {
        this.updateSelectedTerms();
      });
    } else {
      this.setState(new_state);
    }
    if (field === 'pub_date_filter') {
      this.setState({ published_from: null, published_to: null });
    } else if (field === 'type') {
      if (val === 'contributor') {
        this.setState({ pub_date_filter: 'week' });
      } else {
        this.setState({ pub_date_filter: null });
      }
    } else if (field === 'slot_type') {
      this.setState({ slot_type: val });
    } else if (field === 'document_selection_strategy') {
      this.setState({ document_selection_strategy: val });
    }
  };

  addToSelectedTerms = (terms, selected) => {
    terms.forEach(term => {
      selected.push(
        <span key={selected.length} className="selected-term-item">
          {term}
        </span>
      );
    });
  };

  updateSelectedTerms = () => {
    const selected_terms = [];
    const selected_groups = this.state.groups.split(',').map(Number);
    const all_groups = this.props.term_sampling_groups.items.term_sampling_groups;
    for (const group of all_groups) {
      if (_.includes(selected_groups, group.id)) {
        this.addToSelectedTerms(group.terms, selected_terms);
      }
    }
    this.setState({ selected_group_terms: selected_terms });
  };

  handleFromDateChange = date => {
    this.setState({ published_from: date, pub_date_filter: null });
    this.setState({ showAlert: false });
  };

  handleToDateChange = date => {
    this.setState({ published_to: date, pub_date_filter: null });
    this.setState({ showAlert: false });
  };

  closeModal = () => {
    this.setState({ showAlert: false });
    this.props.close();
  };

  toggleShowTerms = e => {
    if (this.state.groups && !this.state.selected_group_terms) {
      this.updateSelectedTerms();
    }
    this.setState({ showTerms: e.target.checked });
  };

  render() {
    if (
      !this.props.categories.isReady ||
      !this.props.provenances.isReady ||
      !this.props.jurisdictions.isReady ||
      !this.props.all_users.isReady ||
      !this.props.term_sampling_groups.isReady
    ) {
      return null;
    }

    const allCategories = this.props.categories.items.categories;
    const categories_options = [];
    allCategories.forEach((category, i) => {
      categories_options.push({ value: category, label: category });
    });

    const allProvenances = this.props.provenances.items.provenances;
    const provenance_options = [];
    allProvenances.forEach((provenance, i) => {
      provenance_options.push({ value: provenance, label: provenance });
    });

    const allJurisdictions = this.props.jurisdictions.items.jurisdictions;
    const jurisdictions_options = [];
    allJurisdictions.forEach((name, i) => {
      if (name) {
        jurisdictions_options.push({ value: name, label: name });
      }
    });

    const allUsers = this.props.all_users.users;
    const users_options = [];
    allUsers.forEach((user, i) => {
      users_options.push({ value: user.id, label: user.email });
    });

    const termSamplingGroups = this.props.term_sampling_groups.items.term_sampling_groups;
    const groups_options = [];
    termSamplingGroups.forEach(group => {
      groups_options.push({ value: group.id, label: group.name });
    });

    // n.b. hard-coded list lifted from system tags in system. this will probably be sourced
    // from the API in the future
    const topics_options = this.props.all_topics.items.topics.map(topic => ({
      value: topic.name,
      label: topic.name
    }));

    // Currently we allow only one task with contributor type.
    // TODO fix this to set document review type explicitly
    let type_options = [
      { value: 'topic_annotation', label: 'Topic annotation' },
      { value: 'slot_fill', label: 'Slot fill' },
      { value: 'contributor', label: 'Contributor' }
    ];

    if (this.state.contributor_task_exists) {
      type_options = [
        { value: 'topic_annotation', label: 'Topic annotation' },
        { value: 'slot_fill', label: 'Slot fill' }
      ];
    }

    const slot_type_options = [
      { value: 'action_type', label: 'Action type' },
      { value: 'violation', label: 'Violation' },
      { value: 'respondent', label: 'Respondent' },
      { value: 'penalty', label: 'Penalty' }
    ];

    const document_strategy_options = [
      { value: 'random', label: 'Random' }
    ];
    if (this.state.type === 'topic_annotation') {
      document_strategy_options.push(
        {
          value: 'prediction_gte_topic_threshold',
          label: 'Docs with predictions above threshold'
        },
        {
          value: 'uncertain_prediction',
          label: 'Docs with uncertain predictions'
        }
      );
    }

    const pubdate_options = [{ value: 'day', label: 'day' }, { value: 'week', label: 'week' }];

    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>Create Annotation Task</Modal.Title>
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
              <ControlLabel>Type</ControlLabel>
              <Select
                options={type_options}
                value={this.state.type}
                onChange={obj => this.handleSelectChange('type', obj.value)}
                disabled={this.state.updateMode}
              />
              <span>Note: Currently only one active task with "contributor" type is allowed</span>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Topics</ControlLabel>
              <Select
                multi
                options={topics_options}
                value={this.state.topics}
                onChange={objs =>
                  this.handleSelectChange('topics', objs.map(obj => obj.value).join(','))
                }
                disabled={this.state.type !== 'topic_annotation'}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Document Selection Strategy</ControlLabel>
              <Select
                options={document_strategy_options}
                value={this.state.document_selection_strategy}
                onChange={obj => this.handleSelectChange('document_selection_strategy', obj.value)}
                disabled={this.state.type !== 'topic_annotation'}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Slot types</ControlLabel>
              <Select
                test={this.state.type}
                options={slot_type_options}
                value={this.state.slot_type}
                onChange={obj => this.handleSelectChange('slot_type', obj.value)}
                disabled={this.state.type !== 'slot_fill'}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Status</ControlLabel>
              <select
                className="form-control"
                value={this.state.status}
                onChange={e => this.handleFieldChange('status', e)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Users</ControlLabel>
              <Select
                options={users_options}
                value={this.state.users}
                multi
                onChange={objs =>
                  this.handleSelectChange('users', objs.map(obj => obj.value).join(','))
                }
                disabled={this.state.type === 'contributor'}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Opinions</ControlLabel>
              <Select
                options={this.num_touches_options}
                value={this.state.num_touches}
                onChange={obj => this.handleSelectChange('num_touches', obj.value)}
                disabled={this.state.type === 'contributor'}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Sampling groups</ControlLabel>
              <Select
                multi
                options={groups_options}
                value={this.state.groups}
                onChange={objs =>
                  this.handleSelectChange('groups', objs.map(obj => obj.value).join(','))
                }
              />
            </FormGroup>
            <Checkbox onChange={this.toggleShowTerms}>Show terms for selected groups</Checkbox>
            <div className={this.state.showTerms ? 'selected-group-terms-container' : 'hidden'}>
              {this.state.selected_group_terms}
            </div>

            <FormGroup>
              <Modal.Title>Document Filters</Modal.Title>
            </FormGroup>
            <FormGroup>
              <Row>
                <Col sm={6}>
                  <ControlLabel>Agencies</ControlLabel>
                  <Select
                    options={this.agencies_options_default_list}
                    value={this.state.agency_id}
                    multi
                    onChange={objs =>
                      this.handleSelectChange('agency_id', objs.map(obj => obj.value).join(','))
                    }
                  />
                </Col>
                <Col sm={6}>
                  <ControlLabel>Category</ControlLabel>
                  <Select
                    options={categories_options}
                    value={this.state.category}
                    onChange={objs =>
                      this.handleSelectChange('category', objs.map(obj => obj.value).join(','))
                    }
                    multi
                  />
                </Col>
              </Row>
            </FormGroup>
            <FormGroup>
              <Row>
                <Col sm={6}>
                  <ControlLabel>Provenance</ControlLabel>
                  <Select
                    options={provenance_options}
                    value={this.state.provenance}
                    onChange={obj => this.handleSelectChange('provenance', obj.value)}
                  />
                </Col>
                <Col sm={6}>
                  <ControlLabel>Jurisdiction</ControlLabel>
                  <Select
                    options={jurisdictions_options}
                    value={this.state.jurisdiction}
                    onChange={obj => this.handleSelectChange('jurisdiction', obj.value)}
                  />
                </Col>
              </Row>
            </FormGroup>
            <FormGroup>
              <Row>
                <Col sm={6}>
                  <ControlLabel>Published in the last:</ControlLabel>
                  <Select
                    options={pubdate_options}
                    value={this.state.pub_date_filter}
                    onChange={obj => this.handleSelectChange('pub_date_filter', obj.value)}
                    disabled={
                      this.state.type === 'contributor' && this.state.pub_date_filter === 'week'
                    }
                  />
                </Col>
                <Col sm={6}>
                  <ControlLabel>Published From</ControlLabel>
                  <div>
                    <DatePicker
                      selected={this.state.published_from}
                      onChange={this.handleFromDateChange}
                      isClearable
                      disabled={this.state.type === 'contributor'}
                    />
                  </div>
                  <ControlLabel>Published To</ControlLabel>
                  <div>
                    <DatePicker
                      selected={this.state.published_to}
                      onChange={this.handleToDateChange}
                      isClearable
                      disabled={this.state.type === 'contributor'}
                    />
                  </div>
                </Col>
              </Row>
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

AnnotationTaskModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    createAnnotationTaskFromParams: data => {
      return dispatch(createAnnotationTaskFromParams(data));
    },
    updateAnnotationTaskWithParams: (annotation_task_id, data) => {
      return dispatch(updateAnnotationTaskWithParams(annotation_task_id, data));
    },
    fetchAllCategories: () => {
      dispatch(fetchAllCategories());
    },
    fetchAllJurisdictions: () => {
      dispatch(fetchAllJurisdictions());
    },
    fetchAllProvenances: () => {
      dispatch(fetchAllProvenances());
    },
    fetchAllUsers: () => {
      dispatch(fetchAllUsers());
    },
    fetchAllTermSamplingGroups: () => {
      dispatch(fetchAllTermSamplingGroups());
    }
  };
};

const mapStateToProps = state => {
  return {
    annotation_task: state.annotation_task,
    all_annotation_tasks: state.all_annotation_tasks,
    categories: state.categories,
    jurisdictions: state.jurisdictions,
    provenances: state.provenances,
    all_users: state.all_users,
    errors: state.errors,
    term_sampling_groups: state.term_sampling_groups,
    all_topics: state.all_topics
  };
};

const ReduxAnnotationTaskModal = connect(mapStateToProps, mapDispatchToProps)(AnnotationTaskModal);

export default ReduxAnnotationTaskModal;
