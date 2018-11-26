import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Modal,
  Button,
  FormControl,
  ControlLabel,
  FormGroup,
  HelpBlock,
  Checkbox
} from 'react-bootstrap';
import {
  creteDocumentFromUrl,
  fetchAllCategories,
  fetchAgencies,
  getResponseHeaders,
  fetchAllDocuments
} from '../../shared/actions';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { defaultFederalAgencies } from '../../shared/utils/defaultSources';

class CreateDocumentModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      saveDisabled: false,
      notes: '',
      pdf_url: '',
      category: '',
      title: '',
      format_str: 'YYYY-MM-DDTHH:mm:ss',
      agencies: '',
      showAlert: false,
      message: '',
      validated: false,
      isUrlValid: false,
      all_agencies_checked: false,
      web_url: '',
      error_message: ''
    };
  }

  componentWillMount() {
    this.props.fetchAllCategories();
    this.props.fetchAgencies();
  }

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  matchUrlPattern = url => {
    const re =
      /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/;
    return url.match(re);
  };

  checkUrlContentType = () => {
    this.props.getResponseHeaders({ url: this.state.pdf_url }).then(() => {
      this.setState({ validated: true });
      if (this.props.new_document_url_headers.items['Content-Type'] === 'application/pdf') {
        const msg =
          'Size of the pdf document is ' +
          this.props.new_document_url_headers.items['Content-Length'] +
          ' bytes';
        this.setState({ isUrlValid: true, message: msg });
      } else {
        this.setState({
          isUrlValid: false,
          message: 'Pdf url is not pointing at PDF content'
        });
      }
    });
  };

  validatePdfUrl = () => {
    this.setState({ showAlert: false, isUrlValid: false });
    if (!this.matchUrlPattern(this.state.pdf_url)) {
      this.setState({ validated: true, message: 'Invalid URL' });
      return;
    }
    this.props.fetchAllDocuments({ pdf_url: this.state.pdf_url, all_agencies: true }).then(() => {
      if (this.props.all_documents.items.count > 0) {
        this.setState({
          validated: true,
          message: 'Document with the same pdf_url already exists'
        });
      } else {
        this.checkUrlContentType();
      }
    });
  };

  handleSubmit = event => {
    event.preventDefault();
    if (
      this.isEmpty(this.state.title) ||
      this.isEmpty(this.state.pdf_url) ||
      this.isEmpty(this.state.category) ||
      this.isEmpty(this.state.web_url) ||
      !this.state.publication_date ||
      this.isEmpty(this.state.agencies)
    ) {
      this.setState({
        error_message: 'Please make sure that all required fields are filled in',
        showAlert: true
      });
    } else if (!this.state.isUrlValid) {
      this.setState({
        error_message: 'Please make sure that pdf url is validated',
        showAlert: true
      });
    } else if (!this.matchUrlPattern(this.state.web_url)) {
      this.setState({ error_message: 'Invalid Web Url', showAlert: true });
    } else {
      const params = {};
      params.notes = this.state.notes;
      params.doc_details = {};
      params.doc_details.title = this.state.title;
      params.doc_details.pdf_url = this.state.pdf_url;
      params.doc_details.category = this.state.category;
      params.doc_details.publication_date = this.state.publication_date.format(
        this.state.format_str
      );
      params.doc_details.agency_ids = this.state.agencies;
      params.doc_details.web_url = this.state.web_url;
      this.props.close();
      this.setState({ saveDisabled: true });
      this.props.creteDocumentFromUrl(params).then(() => {
        this.props.updateDocumentsResult();
      });
    }
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
    this.setState({ showAlert: false });
  };

  handleDateChange = date => {
    this.setState({ publication_date: date });
    this.setState({ showAlert: false });
  };

  handleSelectChange = (field, val) => {
    const new_state = {};
    new_state[field] = val;
    this.setState(new_state);
    this.setState({ showAlert: false });
  };

  closeModal = () => {
    this.setState({ showAlert: false, validated: false });
    this.props.close();
  };

  validate = () => {
    if (this.state.validated) {
      if (this.state.isUrlValid) {
        return 'success';
      }
      return 'error';
    }
    return null;
  };

  togleAgencyLists = e => {
    this.setState({ agencies: '', all_agencies_checked: e.target.checked });
  };

  render() {
    if (!this.props.categories.isReady) {
      return null;
    }

    const allCategories = this.props.categories.items.categories;
    const categories_options = [];
    allCategories.forEach((category, i) => {
      categories_options.push({ value: category, label: category });
    });

    const allAgencies = this.props.agencies.items;
    const all_agencies_options = [];
    allAgencies.forEach((agency, i) => {
      if (!_.isNull(agency.short_name)) {
        all_agencies_options.push({ value: agency.id, label: agency.short_name });
      }
    });

    const agencies_options_default_list = [];
    defaultFederalAgencies.forEach((agency, i) => {
      agencies_options_default_list.push({ value: agency.id, label: agency.short_name });
    });

    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>Create Document</Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup validationState={this.validate()}>
              <ControlLabel>Pdf URL</ControlLabel>
              <FormControl
                type="text"
                value={this.state.pdf_url}
                onChange={e => this.handleFieldChange('pdf_url', e)}
              />
              <HelpBlock className={this.state.validated ? '' : 'hidden'}>
                {this.state.message}
              </HelpBlock>
            </FormGroup>
            <FormGroup>
              <Button onClick={this.validatePdfUrl}>Validate URL</Button>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Title</ControlLabel>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('title', e)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Category</ControlLabel>
              <Select
                options={categories_options}
                value={this.state.category}
                onChange={obj => this.handleSelectChange('category', obj.value)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Agencies</ControlLabel>
              <Select
                options={
                  this.state.all_agencies_checked
                    ? all_agencies_options
                    : agencies_options_default_list
                }
                value={this.state.agencies}
                multi
                onChange={objs => this.handleSelectChange('agencies', objs.map(obj => obj.value))}
              />
              <Checkbox onChange={this.togleAgencyLists}>
                Select from a full list of agencies
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <ControlLabel>Publication Date</ControlLabel>
              <div>
                <DatePicker
                  selected={this.state.publication_date}
                  onChange={this.handleDateChange}
                />
              </div>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Web Url</ControlLabel>
              <FormControl
                type="text"
                value={this.state.web_url}
                onChange={e => this.handleFieldChange('web_url', e)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Notes (optional)</ControlLabel>
              <FormControl
                componentClass="textarea"
                onChange={e => this.handleFieldChange('notes', e)}
              />
            </FormGroup>
            <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
              {this.state.error_message}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeModal}>Close</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              Create
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

CreateDocumentModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    creteDocumentFromUrl: data => {
      return dispatch(creteDocumentFromUrl(data));
    },
    fetchAllCategories: () => {
      dispatch(fetchAllCategories());
    },
    fetchAgencies: following => {
      dispatch(fetchAgencies());
    },
    getResponseHeaders: params => {
      return dispatch(getResponseHeaders(params));
    },
    fetchAllDocuments: params => {
      return dispatch(fetchAllDocuments(params));
    }
  };
};

const mapStateToProps = state => {
  return {
    create_document: state.create_document,
    errors: state.errors,
    categories: state.categories,
    agencies: state.agencies,
    new_document_url_headers: state.new_document_url_headers,
    all_documents: state.all_documents
  };
};

const ReduxCreateDocumentModal = connect(mapStateToProps, mapDispatchToProps)(CreateDocumentModal);

export default ReduxCreateDocumentModal;
