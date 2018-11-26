import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Pagination, FormGroup, ControlLabel, Form, Button, Col } from 'react-bootstrap';
import {
  fetchIncompleteDocs,
  fetchAllCategories,
  fetchAllSpiderNames,
  fetchAllProvenances
} from '../../shared/actions';
import IncompleteDocumentModal from './IncompleteDocumentModal';
import _ from 'lodash';
import Select from 'react-select';
import {
  defaultFederalAgencies,
  defaultStateAgencies,
  federalAgenciesBeingEvaluated
} from '../../shared/utils/defaultSources';
import DatePicker from 'react-datepicker';
import moment from 'moment';

class IncompleteDocTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      limit: 25,
      page: 1,
      category: '',
      spider_name: '',
      provenance: '',
      offset: 0,
      showModal: false,
      openedDocumentId: null,
      document_id: '',
      showAlert: false,
      agency_id: '',
      from_date: null,
      to_date: null
    };
  }

  componentWillMount() {
    this.props.fetchIncompleteDocs(_.cloneDeep(this.state));
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
      params.agency_id = this.state.agency_id.split(',').map(Number);
    } else {
      params.all_agencies = true;
    }
    if (this.state.recent_time) {
      const dayValue = moment().subtract(this.state.recent_time / 24, 'd').format('YYYY-MM-DD');
      params.created_from = dayValue;
      params.created_to = dayValue;
    } else {
      if (this.state.from_date) {
        params.created_from = this.state.from_date.format('MM/DD/YYYY');
      }
      if (this.state.to_date) {
        params.created_to = this.state.to_date.format('MM/DD/YYYY');
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

  agencies_options_default_list = this.getAllDefaultAgencies();

  handlePageChange = eventKey => {
    this.setState(
      {
        page: eventKey,
        offset: this.state.limit * (eventKey - 1)
      },
      () => {
        this.props.fetchIncompleteDocs(this.getParams());
      }
    );
  };

  handleFieldChange = (field, event) => {
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
    this.setState(new_state);
  };

  handleFilter = () => {
    this.setState(
      {
        offset: 0,
        page: 1
      },
      function () {
        this.props.fetchIncompleteDocs(this.getParams());
      }
    );
  };

  openModal = id => {
    this.setState({ showModal: true, openedDocumentId: id });
  };

  close = () => {
    this.setState({ showModal: false });
  };

  updateDocumentsResult = () => {
    this.setState({ scrollTop: this.refs.main_container.scrollTop });
    this.props.fetchIncompleteDocs(this.getParams()).then(() => {
      if (this.refs.main_container) {
        this.refs.main_container.scrollTop = this.state.scrollTop;
      }
    });
  };

  handleFromDateChange = date => {
    this.setState({ from_date: date, recent_time: null });
  };

  handleToDateChange = date => {
    this.setState({ to_date: date, recent_time: null });
  };

  recent_time_options = [
    { value: '24', label: '24 hours' },
    { value: '48', label: '48 hours' },
    { value: '72', label: '72 hours' }
  ];

  render() {
    if (
      !this.props.incomplete_documents.isReady ||
      !this.props.categories.isReady ||
      !this.props.spider_names.isReady ||
      !this.props.provenances.isReady
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

    const documents = this.props.incomplete_documents.items.documents;
    const count = this.props.incomplete_documents.items.count;

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

    documents.forEach((document, i) => {
      rows.push(
        <tr key={i}>
          <td className="document-data">
            <p className="uppercase">
              {document.id}
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
              {document.api_table}
            </p>
            <p>
              <b>Agencies: </b>
              {get_agencies(document)}
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
            <Button bsStyle="primary" onClick={() => this.openModal(document.id)}>
              Fix
            </Button>
          </td>
        </tr>
      );
    });

    return (
      <div ref="main_container" className="main-container">
        <h1>Incomplete Doc Tool</h1>
        <Form horizontal className="filter-container">
          <FormGroup>
            <Col sm={4}>
              <ControlLabel>Filter by most recent</ControlLabel>
              <Select
                options={this.recent_time_options}
                value={this.state.recent_time}
                onChange={obj => this.handleSelectChange('recent_time', obj ? obj.value : obj)}
              />
              <ControlLabel>
                {'created_at range'}
              </ControlLabel>
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
            </Col>
            <Col sm={4}>
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
                onChange={objs =>
                  this.handleSelectChange('agency_id', objs.map(obj => obj.value).join(','))}
              />
            </Col>
          </FormGroup>
          <Button bsStyle="primary" bsSize="xsmall" onClick={this.handleFilter}>
            Filter
          </Button>
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
          <tbody>
            {rows}
          </tbody>
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
        <IncompleteDocumentModal
          close={this.close}
          document_id={this.state.openedDocumentId}
          showModal={this.state.showModal}
          page_state={_.cloneDeep(this.state)}
          reload_function={this.props.fetchIncompleteDocs}
        />
      </div>
    );
  }
}

IncompleteDocTool.contextTypes = {
  router: PropTypes.object
};
const mapDispatchToProps = dispatch => {
  return {
    fetchIncompleteDocs: params => {
      return dispatch(fetchIncompleteDocs(params));
    },
    fetchAllCategories: () => {
      dispatch(fetchAllCategories());
    },
    fetchAllSpiderNames: () => {
      dispatch(fetchAllSpiderNames());
    },
    fetchAllProvenances: () => {
      dispatch(fetchAllProvenances());
    }
  };
};

const mapStateToProps = state => {
  return {
    incomplete_documents: state.incomplete_documents,
    categories: state.categories,
    spider_names: state.spider_names,
    provenances: state.provenances,
    errors: state.errors
  };
};

const ReduxIncompleteDocTool = connect(mapStateToProps, mapDispatchToProps)(IncompleteDocTool);

export default ReduxIncompleteDocTool;
