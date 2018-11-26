import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Col,
  Pagination,
  Table,
  FormGroup,
  FormControl,
  ControlLabel,
  Form,
  Button,
  Radio
} from 'react-bootstrap';
import {
  fetchAllDocuments,
  fetchAllCategories,
  fetchAllSpiderNames,
  fetchAllProvenances,
  fetchFullDocuments
} from '../../shared/actions';
import DocumentModal from './DocumentModal';
import _ from 'lodash';
import Select from 'react-select';
import {
  defaultFederalAgencies,
  defaultStateAgencies,
  federalAgenciesBeingEvaluated
} from '../../shared/utils/defaultSources';
import DatePicker from 'react-datepicker';

class AdminTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      created_at: 24,
      recent_time: '24',
      limit: 25,
      page: 1,
      category: '',
      spider_name: '',
      provenance: '',
      offset: 0,
      showModal: false,
      openedDocumentId: null,
      all_agencies: true,
      all_topics: true,
      document_id: '',
      filtered_by_id: false,
      filtered_document_id: '',
      showAlert: false,
      agency_id: '',
      topic_id: '',
      from_date: null,
      to_date: null,
      date_type: 'created_at'
    };
  }

  componentWillMount() {
    this.props.fetchAllDocuments(_.cloneDeep(this.state));
    this.props.fetchAllCategories();
    this.props.fetchAllSpiderNames();
    this.props.fetchAllProvenances();
  }

  getParams = () => {
    const params = {};
    params.limit = this.state.limit;
    params.offset = this.state.offset;

    if (this.state.category) {
      params.category = this.state.category;
    }
    if (this.state.provenance) {
      params.provenance = this.state.provenance;
    }
    if (this.state.spider_name) {
      params.spider_name = this.state.spider_name;
    }
    if (this.state.agency_id) {
      params.all_agencies = false;
      params.agency_id = this.state.agency_id;
    } else {
      params.all_agencies = true;
    }
    if (this.state.topic_id) {
      params.all_topics = false;
      params.topic_id = this.state.topic_id;
    } else {
      params.all_topics = true;
    }
    if (this.state.date_type === 'created_at') {
      if (this.state.recent_time) {
        params.created_at = this.state.recent_time;
      } else {
        if (this.state.from_date) {
          params.created_from = this.state.from_date.format('MM/DD/YYYY');
        }
        if (this.state.to_date) {
          params.created_to = this.state.to_date.format('MM/DD/YYYY');
        }
      }
    } else if (this.state.date_type === 'publication_date') {
      if (this.state.recent_time) {
        params.published_at = this.state.recent_time;
      } else {
        if (this.state.from_date) {
          params.published_from = this.state.from_date.format('MM/DD/YYYY');
        }
        if (this.state.to_date) {
          params.published_to = this.state.to_date.format('MM/DD/YYYY');
        }
      }
    }
    return params;
  };

  getAllDefaultAgencies = () => {
    const list = [];
    defaultFederalAgencies.forEach(agency => {
      if (agency.id) {
        list.push({ value: agency.id, label: agency.short_name });
      }
    });

    // n.b. set of agencies to be evaluated before being moved to main default list
    federalAgenciesBeingEvaluated.forEach(agency => {
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

  getAllDefaultTopics = () => {
    const list = [];
    this.props.sources.sources.activeTopics.forEach(topic => {
      if (topic.id) {
        list.push({ value: topic.id, label: topic.label });
      }
    });
    return list;
  };

  agencies_options_default_list = this.getAllDefaultAgencies();

  handlePageChange = eventKey => {
    this.setState(
      {
        page: eventKey,
        offset: this.state.limit * (eventKey - 1)
      },
      () => {
        this.props.fetchAllDocuments(this.getParams());
      }
    );
  };

  handleFieldChange = (field, event) => {
    if (field === 'document_id') {
      this.setState({
        spider_name: '',
        category: '',
        provenance: '',
        agency_id: '',
        topic_id: ''
      });
    } else {
      this.setState({ document_id: '' });
    }
    const new_state = {};
    new_state[field] = event.target.value;
    new_state.showAlert = false;
    this.setState(new_state);
  };

  handleSelectChange = (field, val) => {
    const new_state = {};
    new_state.showAlert = false;
    if (field === 'recent_time') {
      new_state.from_date = null;
      new_state.to_date = null;
    }
    new_state[field] = val;
    new_state.document_id = '';
    this.setState(new_state);
  };

  handleFilter = () => {
    if (this.state.document_id) {
      if (!/^\d+$/.test(this.state.document_id)) {
        this.setState({ showAlert: true });
        return;
      }
      this.setState(
        {
          offset: 0,
          page: 1,
          filtered_by_id: true,
          filtered_document_id: this.state.document_id
        },
        () => {
          this.props.fetchFullDocuments({ id: this.state.document_id });
        }
      );
    } else {
      this.setState(
        {
          offset: 0,
          page: 1,
          filtered_by_id: false,
          filtered_document_id: ''
        },
        () => {
          this.props.fetchAllDocuments(this.getParams());
        }
      );
    }
  };

  openModal = id => {
    this.setState({ showModal: true, openedDocumentId: id });
  };

  close = () => {
    this.setState({ showModal: false });
  };

  updateDocumentsResult = () => {
    if (this.state.filtered_by_id) {
      this.props.fetchFullDocuments({ id: this.state.document_id });
    } else {
      this.setState({ scrollTop: this.refs.main_container.scrollTop });
      this.props.fetchAllDocuments(this.getParams()).then(() => {
        if (this.refs.main_container) {
          this.refs.main_container.scrollTop = this.state.scrollTop;
        }
      });
    }
  };

  isDocumentNotFound = () => {
    const errors = this.props.errors || {};
    if (
      errors.document_summary &&
      errors.document_summary.length > 0 &&
      errors.document_summary[0].responseURL &&
      errors.document_summary[0].responseURL.includes('/' + this.state.filtered_document_id + '?')
    ) {
      return true;
    }
    return false;
  };

  handleFromDateChange = date => {
    this.setState({ from_date: date, recent_time: null });
  };

  handleToDateChange = date => {
    this.setState({ to_date: date, recent_time: null });
  };

  handleDateFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  recent_time_options = [
    { value: '24', label: '24 hours' },
    { value: '48', label: '48 hours' },
    { value: '72', label: '72 hours' }
  ];

  render() {
    if (
      !this.props.all_documents.isReady ||
      !this.props.categories.isReady ||
      !this.props.spider_names.isReady ||
      !this.props.provenances.isReady ||
      !this.props.sources.isReady
    ) {
      return null;
    }

    const allCategories = this.props.categories.items.categories;
    const categories_options = [];
    allCategories.forEach((category, i) => {
      categories_options.push({ value: category, label: category });
    });

    const allSpiderNames = this.props.spider_names.items.spider_names;
    const spider_names_options = [];
    allSpiderNames.forEach((spider_name, i) => {
      spider_names_options.push({ value: spider_name, label: spider_name });
    });

    const allProvenances = this.props.provenances.items.provenances;
    const provenance_options = [];
    allProvenances.forEach((provenance, i) => {
      provenance_options.push({ value: provenance, label: provenance });
    });

    let documents = [];
    let count = 1;

    const documentNotFound = this.isDocumentNotFound();
    if (this.state.filtered_by_id) {
      if (documentNotFound) {
        //show empty search result if document is not found in index
        count = 0;
      } else {
        if (
          !this.props.documents_full.isReady ||
          !this.props.documents_full.ids[this.state.filtered_document_id]
        ) {
          return null;
        }
        const doc = this.props.documents_full.ids[this.state.filtered_document_id];
        documents.push(doc);
      }
    } else {
      documents = this.props.all_documents.items.documents;
      count = this.props.all_documents.items.count;
    }

    const get_agencies = document => {
      const agency_list = [];
      if (document.agencies) {
        for (const agency of document.agencies) {
          agency_list.push(agency.short_name);
        }
      }
      return agency_list.join(', ');
    };

    const total_pages = Math.ceil(count / this.state.limit);
    // Limit number of displayed documents to 10000 (400 pages with 25 per page).
    // Otherwise elesticsearch will return error "Result window is too large".
    const max_buttons = total_pages > 400 ? 400 : total_pages;
    const rows = [];
    const getStatus = flagged_object => {
      if (_.isNull(flagged_object) || flagged_object.status === 'skipped') {
        return 'not flagged';
      }
      return flagged_object.status;
    };

    documents.forEach((document, i) => {
      rows.push(
        <tr key={i}>
          <td className="document-data">
            <p className="uppercase">
              {document.id} | {getStatus(document.flagged)}{' '}
            </p>
            <p>
              <b>Title: </b>
              {document.title}
            </p>
            <p>
              <b>Summary Text: </b>
              {document.summary_text}
            </p>
            <p>
              <b>Category: </b>
              {document.category}
            </p>
            <p>
              <b>Spider Name: </b>
              {document.spider_name}
            </p>
            <p>
              <b>Provenance: </b>
              {document.provenance}
            </p>
            <p>
              <b>Agencies: </b>
              {get_agencies(document)}
            </p>
            <p>
              <b>Topics: </b>
              {
                document.topics.map(topic =>
                  topic.name + "(" +
                  [topic.judge_count, topic.positive_judgments, topic.model_probability].join(", ") +
                  ")").join(', ')
              }
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
          </td>
          <td>
            <Button
              bsStyle="primary"
              onClick={() => this.openModal(documents[i].id)}
              disabled={document.flagged && document.flagged.status === 'flagged'}
            >
              Flag
            </Button>
          </td>
        </tr>
      );
    });
    return (
      <div ref="main_container" className="main-container">
        <h1>Document Admin Tool</h1>
        <Form horizontal className="filter-container">
          <FormGroup>
            <Col sm={4}>
              <ControlLabel>{'Date Type'}</ControlLabel>
              <div className="volume-stat-radio-btn">
                <Radio
                  name="date_type"
                  value="created_at"
                  inline
                  checked={this.state.date_type === 'created_at'}
                  onChange={e => this.handleDateFieldChange('date_type', e)}
                >
                  Created
                </Radio>
                <Radio
                  name="date_type"
                  value="publication_date"
                  inline
                  checked={this.state.date_type === 'publication_date'}
                  onChange={e => this.handleDateFieldChange('date_type', e)}
                >
                  Publication
                </Radio>
              </div>

              <ControlLabel>Filter by most recent</ControlLabel>
              <Select
                options={this.recent_time_options}
                value={this.state.recent_time}
                onChange={obj => this.handleSelectChange('recent_time', obj.value)}
              />
              <ControlLabel>{'Select range'}</ControlLabel>
              <div className="">
                <DatePicker
                  className="date-picker-doc-tool"
                  placeholderText="From"
                  selected={this.state.from_date}
                  onChange={this.handleFromDateChange}
                  isClearable
                />
                <DatePicker
                  className="date-picker-doc-tool"
                  placeholderText="To"
                  selected={this.state.to_date}
                  onChange={this.handleToDateChange}
                  isClearable
                />
              </div>
            </Col>
            <Col sm={4}>
              <ControlLabel>Spider Name</ControlLabel>
              <Select
                options={spider_names_options}
                value={this.state.spider_name}
                onChange={obj => this.handleSelectChange('spider_name', obj.value)}
              />
              <ControlLabel>Category</ControlLabel>
              <Select
                options={categories_options}
                value={this.state.category}
                onChange={obj => this.handleSelectChange('category', obj.value)}
              />
              <ControlLabel>Provenance</ControlLabel>
              <Select
                options={provenance_options}
                value={this.state.provenance}
                onChange={obj => this.handleSelectChange('provenance', obj.value)}
              />
              <ControlLabel>Agencies</ControlLabel>
              <Select
                options={this.agencies_options_default_list}
                value={this.state.agency_id}
                multi
                onChange={objs => this.handleSelectChange('agency_id', objs.map(obj => obj.value))}
              />
              <ControlLabel>Topics</ControlLabel>
              <Select
                options={this.getAllDefaultTopics()}
                value={this.state.topic_id}
                multi
                onChange={objs => this.handleSelectChange('topic_id', objs.map(obj => obj.value))}
              />
            </Col>
            <Col sm={4}>
              <ControlLabel>Document ID</ControlLabel>
              <FormControl
                type="text"
                value={this.state.document_id}
                onChange={e => this.handleFieldChange('document_id', e)}
              />
            </Col>
          </FormGroup>
          <Button bsStyle="primary" bsSize="xsmall" onClick={this.handleFilter}>
            Filter
          </Button>
          <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
            Documents ID must be an integer
          </div>
        </Form>
        <Pagination
          bsSize="small"
          prev
          next
          first
          last
          ellipsis
          boundaryLinks
          items={max_buttons}
          maxButtons={5}
          activePage={this.state.page}
          onSelect={this.handlePageChange}
        />
        <Table className="documents-table" striped condensed hover>
          <tbody>{rows}</tbody>
        </Table>
        <Pagination
          bsSize="small"
          prev
          next
          first
          last
          ellipsis
          boundaryLinks
          items={max_buttons}
          maxButtons={5}
          activePage={this.state.page}
          onSelect={this.handlePageChange}
        />
        <DocumentModal
          close={this.close}
          document_id={this.state.openedDocumentId}
          showModal={this.state.showModal}
          updateDocumentsResult={this.updateDocumentsResult}
        />
      </div>
    );
  }
}

AdminTool.contextTypes = {
  router: PropTypes.object
};
const mapDispatchToProps = dispatch => {
  return {
    fetchAllDocuments: params => {
      return dispatch(fetchAllDocuments(params));
    },
    fetchAllCategories: () => {
      dispatch(fetchAllCategories());
    },
    fetchAllSpiderNames: () => {
      dispatch(fetchAllSpiderNames());
    },
    fetchAllProvenances: () => {
      dispatch(fetchAllProvenances());
    },
    fetchFullDocuments: id => {
      dispatch(fetchFullDocuments(id));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_documents: state.all_documents,
    categories: state.categories,
    spider_names: state.spider_names,
    provenances: state.provenances,
    documents_full: state.documents_full,
    sources: state.sources,
    errors: state.errors
  };
};

const ReduxAdminTool = connect(mapStateToProps, mapDispatchToProps)(AdminTool);

export default ReduxAdminTool;
