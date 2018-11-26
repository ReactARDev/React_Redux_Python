import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Table,
  Button,
  Pagination,
  Col,
  ControlLabel,
  FormControl,
  Form,
  FormGroup
} from 'react-bootstrap';
import {
  fetchAllDocuments,
  fetchDocuments,
  fetchFullDocuments,
  flagDocument,
  fetchHiddenDocuments,
  updateDocument
} from '../../shared/actions';
import DocumentUpdateModal from './DocumentUpdateModal';
import _ from 'lodash';
import Select from 'react-select';
import {
  defaultFederalAgencies,
  defaultStateAgencies,
  federalAgenciesBeingEvaluated
} from '../../shared/utils/defaultSources';

class DocumentUpdate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      limit: 25,
      page: 1,
      offset: 0,
      showModal: false,
      openedDocumentId: null,
      all_agencies: true,
      flagged_status: 'flagged',
      agency_id: '',
      hidden_documents_view: false
    };
  }

  componentWillMount() {
    this.props.fetchAllDocuments(_.cloneDeep(this.state));
  }

  getParams = () => {
    const params = _.cloneDeep(this.state);
    const selected_agencies = params.agency_id;
    if (selected_agencies) {
      params.all_agencies = false;
      params.agency_id = selected_agencies.split(',').map(Number);
    } else {
      params.all_agencies = true;
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
    const new_state = {};
    new_state.page = eventKey;
    new_state.offset = this.state.limit * (eventKey - 1);
    if (this.state.hidden_documents_view) {
      this.setState(new_state);
    } else {
      this.setState(new_state, () => {
        this.props.fetchAllDocuments(this.getParams());
      });
    }
  };

  handleStatusChange = (field, event) => {
    const new_state = {};
    new_state[field] = event.target.value;
    this.setState(new_state);
  };

  handleFilter = () => {
    const new_state = { offset: 0, page: 1 };
    if (this.state.flagged_status === 'hidden') {
      new_state.hidden_documents_view = true;
      this.setState(new_state, () => {
        this.props.fetchHiddenDocuments({});
      });
    } else {
      new_state.hidden_documents_view = false;
      this.setState(new_state, () => {
        this.props.fetchAllDocuments(this.getParams());
      });
    }
  };

  handleAgencyChange = (field, val) => {
    const new_state = {};
    new_state[field] = val;
    this.setState(new_state);
  };

  openModal = document_id => {
    this.props.fetchFullDocuments({ id: document_id });
    this.setState({ showModal: true, openedDocumentId: document_id });
  };

  close = () => {
    this.setState({ showModal: false });
  };

  updateDocumentsResult = () => {
    this.props.fetchAllDocuments(this.getParams());
  };

  unflagDocument = (doc_id, user_flagged_document_id) => {
    const params = {};
    params.id = user_flagged_document_id;
    params.status = 'skipped';
    this.props.flagDocument(doc_id, params).then(() => {
      this.props.fetchAllDocuments(this.getParams());
    });
  };

  showAgainDocument = doc_id => {
    const params = {};
    params.issue_severity = 'show_now';
    params.issue_type = 'show again';
    this.props.flagDocument(doc_id, params).then(() => {
      this.props.fetchHiddenDocuments({});
    });
  };

  submitWithoutUpdating = (doc_id, flagged_doc_id) => {
    const params = {};
    params.skip_contributor_notes = true;
    params.user_flagged_document_id = flagged_doc_id;
    this.props.updateDocument(doc_id, params).then(() => {
      this.props.fetchAllDocuments(this.getParams());
    });
  };

  render() {
    let documents = [];
    let count;
    if (this.state.hidden_documents_view) {
      if (!this.props.hidden_documents || !this.props.hidden_documents.isReady) {
        return null;
      }
      count = this.props.hidden_documents.items.hidden_documents.length;
      documents = _.slice(
        this.props.hidden_documents.items.hidden_documents,
        this.state.offset,
        this.state.offset + this.state.limit
      );
    } else {
      if (!this.props.all_documents || !this.props.all_documents.isReady) {
        return null;
      }
      documents = this.props.all_documents.items.documents;
      count = this.props.all_documents.items.count;
    }

    const get_agencies = document => {
      const agency_list = [];
      for (const agency of document.agencies) {
        agency_list.push(agency.short_name);
      }
      return agency_list.join(', ');
    };

    const max_buttons = Math.ceil(count / this.state.limit);
    const rows = [];
    if (this.state.hidden_documents_view) {
      documents.forEach((document, i) => {
        if (document.data) {
          rows.push(
            <tr key={i}>
              <td>
                <p className="uppercase">
                  {document.doc_id} | {document.status} | {document.issue_severity}
                </p>
                <p className={document.field ? '' : 'hidden'}>Field: {document.field}</p>
                <p className={document.notes ? '' : 'hidden'}>Notes: {document.notes}</p>
                <p>
                  <b>Title: </b>
                  {document.data.title}
                </p>
                <p>
                  <b>Summary Text: </b>
                  {document.data.summary_text}
                </p>
                <p>
                  <b>Category: </b>
                  {document.data.category}
                </p>
                <p>
                  <b>Spider Name: </b>
                  {document.data.spider_name}
                </p>
                <p>
                  <b>Publication Date: </b>
                  {document.data.publication_date}
                </p>
              </td>
              <td>
                <Button bsStyle="primary" onClick={() => this.showAgainDocument(document.doc_id)}>
                  Show Again
                </Button>
              </td>
            </tr>
          );
        }
      });
    } else {
      let isProcessed;
      let isSeverityHideNow;
      const isContributorView = this.state.flagged_status === 'contributor_flagged';
      documents.forEach((document, i) => {
        if (_.isNull(document.flagged)) {
          return;
        }
        if (document.flagged.status !== 'skipped') {
          isProcessed = document.flagged.status !== 'flagged';
          isSeverityHideNow = document.flagged.issue_severity === 'hide_now';
          const contributor_notes = [];
          if (document.flagged.multiple_field) {
            const fields = document.flagged.multiple_field;
            _.forOwn(fields, (value, key) => {
              contributor_notes.push(
                <p>
                  {key}: {value}
                </p>
              );
            });
          }
          let status_to_display = document.flagged.status;
          if (this.state.flagged_status === 'contributor_flagged') {
            status_to_display = 'Contributor Flag';
          }
          rows.push(
            <tr key={i}>
              <td>
                <p className="uppercase">
                  {document.id} | {status_to_display} | {document.flagged.issue_severity}
                </p>
                <p className={document.flagged.field ? '' : 'hidden'}>
                  Field: {document.flagged.field}
                </p>
                <p className={document.flagged.notes ? '' : 'hidden'}>
                  Notes: {document.flagged.notes}
                </p>
                <div className={document.flagged.multiple_field ? '' : 'hidden'}>
                  Contributor Notes: {contributor_notes}
                </div>
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
                  <b>Publication Date: </b>
                  {document.publication_date}
                </p>
                <p>
                  <b>Agencies: </b>
                  {get_agencies(document)}
                </p>
              </td>
              <td>
                <Button
                  className={isProcessed ? 'hidden' : ''}
                  bsStyle="primary"
                  onClick={() => this.openModal(document.id)}
                >
                  Update
                </Button>
                <Button
                  className={isProcessed || isSeverityHideNow || isContributorView ? 'hidden' : ''}
                  bsStyle="primary"
                  onClick={() =>
                    this.unflagDocument(document.id, document.flagged.user_flagged_document_id)
                  }
                >
                  Unflag
                </Button>
                <Button
                  className={this.state.flagged_status === 'contributor_flagged' ? '' : 'hidden'}
                  bsStyle="primary"
                  onClick={() =>
                    this.submitWithoutUpdating(
                      document.id,
                      document.flagged.user_flagged_document_id
                    )
                  }
                >
                  Do not update
                </Button>
              </td>
            </tr>
          );
        }
      });
    }

    return (
      <div className="main-container">
        <h1>Update Documents</h1>
        <Form horizontal>
          <FormGroup bsSize="small">
            <Col sm={4}>
              <ControlLabel>Filter by status</ControlLabel>
              <FormControl
                componentClass="select"
                defaultValue={this.state.flagged_status}
                onChange={e => this.handleStatusChange('flagged_status', e)}
              >
                <option value="flagged">FLAGGED</option>
                <option value="processed">PROCESSED</option>
                <option value="hidden">HIDDEN</option>
                <option value="contributor_flagged">CONTRIBUTOR FLAG</option>
              </FormControl>
            </Col>
            <Col sm={8}>
              <ControlLabel>Agencies</ControlLabel>
              <Select
                options={this.agencies_options_default_list}
                value={this.state.agency_id}
                multi
                onChange={objs =>
                  this.handleAgencyChange('agency_id', objs.map(obj => obj.value).join(','))
                }
                disabled={this.state.hidden_documents_view}
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
        <Table striped condensed hover>
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
        <DocumentUpdateModal
          close={this.close}
          document_id={this.state.openedDocumentId}
          showModal={this.state.showModal}
          updateDocumentsResult={this.updateDocumentsResult}
          flagged_status={this.state.flagged_status}
        />
      </div>
    );
  }
}

DocumentUpdate.contextTypes = {
  router: PropTypes.object
};
const mapDispatchToProps = dispatch => {
  return {
    fetchAllDocuments: params => {
      dispatch(fetchAllDocuments(params));
    },
    fetchDocuments: id => {
      dispatch(fetchDocuments(id));
    },
    fetchFullDocuments: id => {
      dispatch(fetchFullDocuments(id));
    },
    flagDocument: (id, data) => {
      return dispatch(flagDocument(id, data));
    },
    fetchHiddenDocuments: params => {
      dispatch(fetchHiddenDocuments(params));
    },
    updateDocument: (id, data) => {
      return dispatch(updateDocument(id, data));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_documents: state.all_documents,
    documents_full: state.documents_full,
    flagged_document: state.flagged_document,
    hidden_documents: state.hidden_documents
  };
};

const ReduxDocumentUpdate = connect(mapStateToProps, mapDispatchToProps)(DocumentUpdate);

export default ReduxDocumentUpdate;
