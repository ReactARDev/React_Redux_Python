import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import moment from 'moment';
import _ from 'lodash';
import trunc from 'trunc-html';
import json2csv from 'json2csv';
import { CSVLink } from 'react-csv';
import classnames from 'classnames';
import FolderMenu from './FolderMenu';
import { connect } from 'react-redux';
import { Tooltip, Overlay, Modal, FormControl, Button } from 'react-bootstrap';
import { create_email } from '../utils/email';
import { fetchDocumentPDF, generateFilename } from '../utils/pdf';
import { clearSelectedDocsAndReset } from '../utils/getSelected';
import { initiateDownload } from '../utils/downloads';
import { initiatePrinting } from '../utils/print';
import { get_search_view } from '../utils/search';
import { submit_timing, safe_mixpanel_track, safe_analytics } from '../../shared/utils/analytics';
import { ad_block_detected } from '../../shared/utils/adBlockDetector';
import {
  initiatePendingAction,
  completePendingAction,
  addError,
  fetchFullDocuments,
  markDocumentAsRead,
  clearSelectedItems,
  clearSelectedFolder,
  openFolderMenu,
  clearErrors,
  changeDocumentView,
  addContributorPoints
} from '../../shared/actions';

class DashboardActionBar extends React.Component {
  constructor(props) {
    super(props);

    let csv_file_name = 'Compliance_ai_Export_' + moment().format('MMDDYYYY');
    // make sure proper extension is applied if os is Windows
    if (_.includes(navigator.appVersion, 'Windows')) {
      csv_file_name += '.csv';
    }

    this.action_start = null;
    this.state = {
      read_status: false,
      isOpen: false,
      tooltipMessage: null,
      export_csv_open: false,
      selected_csv_docs: [],
      csv_file_name,
      clickedMarkAsUnread: false
    };
  }

  componentWillMount() {
    //prevents error when checking read status on initial render
    if (!this.props.document_details.isReady) {
      return;
    }
  }

  componentWillReceiveProps(nextProps) {
    /* update the read status of those documents selected upon selection */
    let read_status = false;
    if (this.props.location.query.overlay === 'pdf-overlay' && !this.state.clickedMarkAsUnread) {
      read_status = true;
    } else {
      for (const id of Object.keys(nextProps.current_view.selected_items)) {
        if (
          nextProps.document_details.documents[id] &&
          nextProps.document_details.documents[id].read
        ) {
          read_status = true;
          break;
        }
      }
    }
    this.setState({ read_status });

    const document_ids = nextProps.current_view.pending_action.document_ids;
    const action = nextProps.current_view.pending_action.name;

    if (!(action && nextProps.document_details.isReady) &&
      !(action && nextProps.current_view.bulk_docs_selected)) {
      return;
    }

    const timeline_documents = {};
    for (const doc of nextProps.documents.combined_list) {
      timeline_documents[doc.id] = doc;
    }
    const searched_documents = {};
    for (const doc of nextProps.current_view.docs_to_select.items) {
      searched_documents[doc.id] = doc;
    }

    // select doc open in right panel
    let whichDocuments = nextProps.document_details.documents;
    if (nextProps.current_view.bulk_docs_selected) {
      if (nextProps.current_view.bulk === 'timeline') {
        whichDocuments = timeline_documents; // timeline or news
      } else {
        whichDocuments = searched_documents; // search result
      }
    }
    const documents = _.filter(whichDocuments, doc => {
      return document_ids.indexOf(doc.id) !== -1;
    });

    for (const doc of documents) {
      safe_analytics(
        'Doc Action – ' + _.capitalize(action) + ' document',
        'Doc Action',
        _.capitalize(action) + ' document',
        doc.title
      );
    }

    this._completePendingAction(action);

    // send email was previously initiated
    if (action === 'email') {
      create_email(documents)
        .then(() => {
          // completed successfully
        })
        .catch(err => {
          this.props.addError(err, 'documents');
        });
    } else if (action === 'export_csv') {
      const selected_csv_docs = [];

      for (const doc of documents) {
        let comments_close = 'n/a';
        if (doc.rule && doc.rule.comments_close_on) {
          comments_close = moment(doc.rule.comments_close_on).format('MM/DD/YYYY');
        }
        let effective_date = 'n/a';
        if (doc.rule && doc.rule.effective_on) {
          effective_date = moment(doc.rule.effective_on).format('MM/DD/YYYY');
        }
        const publication_date = moment(doc.publication_date).format('MM/DD/YYYY');
        const agencies = this._renderAgencyNames(doc);
        const doc_pdf_url =
          process.env.APPLICATION_URL +
          '/content?overlay=pdf-overlay&summary_id=' +
          doc.id +
          '&summary_page=summary';

        selected_csv_docs.push({
          'Document Type': doc.category,
          'Comments Close Date': comments_close,
          'Effective Date': effective_date,
          'Publication Date': publication_date,
          Title: doc.title,
          Link: doc_pdf_url,
          Source: agencies
        });
      }
      this.setState({ export_csv_open: true, selected_csv_docs });
    } else if (action === 'download' || action === 'print') {
      let num_pdfs = 0;
      const fetchPDFThen = (document, callback) => {
        return fetchDocumentPDF(document)
          .then(pdf => {
            if (pdf) {
              // pdf retrieved successfully
              num_pdfs++;
              const filename = generateFilename(document.title);
              const blob = new Blob([pdf], { type: 'application/pdf' });
              callback(blob, filename);
            } else {
              safe_analytics(
                'Dashboard – PDF unavailable',
                'Dashboard',
                'PDF unavailable',
                document.title
              );
            }
          })
          .catch(err => {
            if (err.message === 'Could not open window') {
              this.setState({
                tooltipMessage: 'Could not open window. Please allow popups from Compliance.ai'
              });
            } else {
              throw err; // let the global handler handle it
            }
          });
      };

      let callback = initiateDownload;

      if (nextProps.current_view.pending_action.name === 'print') {
        callback = initiatePrinting;
      }

      const promises = [];

      for (const document of documents) {
        promises.push(fetchPDFThen(document, callback));
      }

      Promise.all(promises)
        .then(() => {
          if (!this.state.tooltipMessage) {
            const missing = promises.length - num_pdfs;

            if (missing === 1) {
              this.setState({
                tooltipMessage: `${missing} document was not included
                because its PDF is unavailable.`
              });
            } else if (missing > 1) {
              this.setState({
                tooltipMessage: `${missing} documents were not included
                because their PDFs are unavailable.`
              });
            }
            if (_.isEmpty(this.props.errors)) {
              clearSelectedDocsAndReset(this.props, this.context.router);
            }
          }
        })
        .catch(err => {
          this.props.addError(err, 'download');
        });
    }
  }

  _renderAgencyNames(document) {
    let text = null;
    if (document.agencies) {
      text = document.agencies
        .map(a => {
          return a.short_name || a.name;
        })
        .sort()
        .join(', ');
    }

    return text;
  }

  _initiatePendingAction(...args) {
    this.action_start = Date.now();
    this.props.initiatePendingAction(...args);
  }

  _completePendingAction(action) {
    submit_timing(this.action_start, 'Dashboard', action, _.capitalize(action) + ' Document');
    safe_mixpanel_track('Dashboard – ' + action + ' – ' + _.capitalize(action) + ' Document', {
      hitType: 'timing',
      timingCategory: 'Dashboard',
      timingVar: action,
      $duration: Date.now() - this.action_start,
      timingLabel: _.capitalize(action) + ' Document'
    });
    this.props.completePendingAction();
  }

  _sendAnalytics(document_ids, action) {
    for (const id of document_ids) {
      const doc = this.props.document_details.documents[id] || {};
      // XXX documents aren't guaranteed to be inside document_details
      // need to fetch manually or search through documents/search_results
      const title = doc.title || 'Title unavailable';
      safe_analytics('Doc Action – ' + action, 'Doc Action', action, title);
    }
  }

  doEmail(e) {
    e.preventDefault();
    // prevent multiple clicks
    if (this._isNotPending()) {
      const ids = this._getSelectedIds();

      if (ids.length > 0) {
        this._initiatePendingAction({ name: 'email', document_ids: ids });
        this.props.fetchFullDocuments(ids);
        this.props.addContributorPoints('emaildoc');
      }
      if (_.isEmpty(this.props.errors)) {
        clearSelectedDocsAndReset(this.props, this.context.router);
      }
    }
  }

  doDownload(e) {
    e.preventDefault();
    // prevent multiple clicks
    if (this._isNotPending()) {
      const ids = this._getSelectedIds();

      if (ids.length > 0) {
        this._initiatePendingAction({ name: 'download', document_ids: ids });
        this.props.addContributorPoints('downloaddoc');
        this.props.fetchFullDocuments(ids);
      }
    }
  }

  doPrint(e) {
    e.preventDefault();
    /*
      Ad block disupts printing aciton, send user
      tooltip message to inform them of such
    */
    const ad_blocker_on = ad_block_detected(window);
    if (ad_blocker_on) {
      this.setState({
        tooltipMessage: 'Could not open window. Please turn off your ad blocker to use this feature'
      });

      return; //cutoff action if adblock detected
    }
    // prevent multiple clicks
    if (this._isNotPending()) {
      const ids = this._getSelectedIds();

      if (ids.length > 0) {
        this._initiatePendingAction({ name: 'print', document_ids: ids });
        this.props.addContributorPoints('printdoc');
      }
    }
  }

  doExportCSV(e) {
    e.preventDefault();
    // prevent multiple clicks
    if (this._isNotPending()) {
      const ids = this._getSelectedIds();

      if (ids.length > 0) {
        this._initiatePendingAction({ name: 'export_csv', document_ids: ids });
        this.props.addContributorPoints('exportcsv');
      }
    }
  }

  markAsUnread() {
    // prevent multiple clicks
    if (this._isNotPending()) {
      const ids = this._getSelectedIds();

      if (ids.length > 0) {
        this.props.markDocumentAsRead(ids, false);
        this._sendAnalytics(ids, 'Mark document unread');
      }
      this.setState({ isOpen: false });
      if (this.props.location.query.overlay === 'pdf-overlay') {
        this.setState({ read_status: false, clickedMarkAsUnread: true });
      }
      if (_.isEmpty(this.props.errors)) {
        clearSelectedDocsAndReset(this.props, this.context.router);
      }
    }
  }

  _isNotPending() {
    let bool = false;
    if (!(this.props.current_view.pending_action.name || this.props.document_details.isFetching) ||
        (this.props.current_view.pending_action.name && this.props.current_view.bulk_docs_selected)
    ) {
      bool = true;
    }
    return bool;
  }

  _getSelectedIds() {
    const ids = this.props.rightPanel
      ? [this.props.documentId]
      : Object.keys(this.props.current_view.selected_items).map(n => ~~n.replace(/\D+/g, ''));
    return ids;
  }

  handleClick(e) {
    e.preventDefault();
    if (!_.isEmpty(this.props.errors.folders)) {
      this.props.clearErrors('folders');
    }

    this.props.openFolderMenu();
  }

  render() {
    const document_ids = this._getSelectedIds();
    const selected_doc_count = document_ids.length;
    let activeDocBar = false;
    let doc_in_view = false;

    //selected documents must be visible (except in state code)
    for (const sort of Object.keys(this.props.documents.document_index)) {
      for (const doc_id of Object.keys(this.props.documents.document_index[sort])) {
        const id = parseInt(doc_id, 10);
        if (_.includes(document_ids, id)) {
          doc_in_view = true;
          break;
        }
      }
    }

    const app_view = get_search_view(this.props.current_view.search_params, this.props.location);
    const unindexed_view = app_view.section === 'state_code' || app_view.section === 'search';
    if (selected_doc_count > 0 && (doc_in_view || unindexed_view || this.props.rightPanel)) {
      activeDocBar = true;
    }

    const actionBarClasses = {
      'action-bar-container': true,
      'remove-transperancy': activeDocBar
    };

    const renderDocActionDropdown = () => {
      return (
        <div className="menuStyle folder-dropdown-menu">
          <FolderMenu location={this.props.location} />
        </div>
      );
    };

    const renderTooltip = () => {
      if (!this.state.tooltipMessage) {
        return null;
      }

      const doClose = () => {
        this.setState({ tooltipMessage: null });
      };

      return (
        <Overlay
          show
          container={this}
          placement="bottom"
          target={() => ReactDOM.findDOMNode(this.refs.printer_icon)}
        >
          <Tooltip id="action-bar-tooltip" title="Warning" onClick={doClose}>
            {this.state.tooltipMessage}
          </Tooltip>
        </Overlay>
      );
    };

    const unreadIconClasses = {
      'mark-unread-folder': true,
      disabled: !this.state.read_status
    };

    const emailIconClasses = {
      'send-emails': true,
      disabled: this.props.current_view.bulk_docs_selected
    };

    const markUnread = e => {
      e.preventDefault();

      if (this.state.read_status) {
        this.markAsUnread();
      }

      return null;
    };

    const mailDocs = e => {
      e.preventDefault();

      if (!this.props.current_view.bulk_docs_selected) {
        this.doEmail(e);
      }

      return null;
    };

    const handleFileNameChange = e => {
      e.preventDefault();

      this.setState({ csv_file_name: e.target.value });
    };

    const doc_title_list = [];
    for (const doc of this.state.selected_csv_docs) {
      const trunced_title = trunc(doc.Title, 50).text;
      doc_title_list.push(
        <li className="csv_doc_title" key={doc.Link}>
          {trunced_title}
        </li>
      );
    }

    let docActionModal = null;

    const exportCsv = e => {
      // must build CSV manually for IE
      if (window.navigator.msSaveOrOpenBlob) {
        e.preventDefault();
        const csv = json2csv({
          data: this.state.selected_csv_docs,
          fields: [
            'Document Type',
            'Comments Close Date',
            'Effective Date',
            'Publication Date',
            'Title',
            'Link',
            'Source'
          ]
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        initiateDownload(blob, this.state.csv_file_name);
      }

      //reset file name after export
      let csv_file_name = 'Compliance_ai_Export_' + moment().format('MMDDYYYY');
      // make sure proper extension is applied if os is Windows
      if (_.includes(navigator.appVersion, 'Windows')) {
        csv_file_name += '.csv';
      }

      this.setState({ export_csv_open: false, csv_file_name });
      if (_.isEmpty(this.props.errors)) {
        clearSelectedDocsAndReset(this.props, this.context.router);
      }
    };

    if (this.state.export_csv_open) {
      const selected_csv_doc_count = this.state.selected_csv_docs.length;
      const doc_or_docs = selected_csv_doc_count !== 1 ? 'documents have' : 'document has';

      docActionModal = (
        <Modal show backdrop onHide={() => this.setState({ export_csv_open: false })}>
          <Modal.Body>
            <div id="export-csv-menu">
              <h3>Export to CSV</h3>
              <div className="doc-list-container">
                <div className="csv-file-name-section">
                  <h5>Export File Name:</h5>
                  <FormControl
                    bsClass="csv_input"
                    value={this.state.csv_file_name}
                    onChange={handleFileNameChange}
                  />
                </div>
                <h5>
                  {selected_csv_doc_count} {doc_or_docs} been selected for export:
                </h5>
                <ul>
                  {doc_title_list}
                </ul>
                <h5>CSV file will include:</h5>
                <ul className="csv_type_list">
                  <li>Document Type</li>
                  <li>Key Dates</li>
                  <li>Publication Date</li>
                  <li>Title</li>
                  <li>Source</li>
                </ul>
              </div>
              <div className="csv-btn-section">
                <CSVLink
                  data={this.state.selected_csv_docs}
                  className="btn btn-primary"
                  onClick={exportCsv}
                  filename={this.state.csv_file_name}
                >
                  Export
                </CSVLink>
                <Button
                  onClick={() => this.setState({ export_csv_open: false })}
                  className="btn cancel-csv-btn"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      );
    }

    return (
      <div className={classnames(actionBarClasses)} ref="tooltip_container">
        {renderTooltip()}
        {docActionModal}
        <span className="create-folder">
          <i
            className="material-icons doc-action-item"
            title="Add to folder"
            onClick={e => this.handleClick(e)}
          >
            create_new_folder
          </i>
          {this.props.user_folder.open_folder_menu && activeDocBar && renderDocActionDropdown()}
        </span>
        <span className={classnames(emailIconClasses)}>
          <i
            className="material-icons doc-action-item"
            title="Send Email"
            onClick={mailDocs}
          >
            email
          </i>
          <span className="unread-circle doc-action-item" />
        </span>
        <i
          ref="printer_icon"
          className="material-icons doc-action-item"
          title="Print"
          onClick={e => this.doPrint(e)}
        >
          print
        </i>
        <i
          className="material-icons doc-action-item"
          title="Download"
          onClick={e => this.doDownload(e)}
        >
          file_download
        </i>
        {this.props.rightPanel
          ? null
          :
          <i
            className="material-icons doc-action-item"
            id="export_to_csv"
            title="Export to CSV"
            onClick={e => this.doExportCSV(e)}
          >
              open_in_new
          </i>}
        <span className={classnames(unreadIconClasses)}>
          <i
            className="material-icons mark-unread doc-action-item"
            onClick={markUnread}
            title="Mark as Unread"
          >
            markunread
          </i>
          <span className="unread-circle doc-action-item" />
        </span>
      </div>
    );
  }
}

DashboardActionBar.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view,
    document_details: state.document_details,
    documents_full: state.documents_full,
    documents: state.documents,
    user_folder: state.user_folder,
    errors: state.errors
  };
};

const mapDispatchToProps = dispatch => {
  return {
    initiatePendingAction: name => {
      dispatch(initiatePendingAction(name));
    },
    completePendingAction: () => {
      dispatch(completePendingAction());
    },
    fetchFullDocuments: id => {
      dispatch(fetchFullDocuments({ id }));
    },
    addError: (error, component) => {
      dispatch(addError(error, component));
    },
    markDocumentAsRead: (ids, read_or_unread) => {
      dispatch(markDocumentAsRead(ids, read_or_unread));
    },
    clearSelectedFolder: () => {
      dispatch(clearSelectedFolder());
    },
    openFolderMenu: () => {
      dispatch(openFolderMenu());
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    },
    clearErrors: component => {
      dispatch(clearErrors(component));
    },
    addContributorPoints: shortname => {
      dispatch(addContributorPoints(shortname));
    }
  };
};

const ReduxDashboardActionBar = connect(mapStateToProps, mapDispatchToProps)(DashboardActionBar);

export default ReduxDashboardActionBar;
