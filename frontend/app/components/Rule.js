import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Tabs, Tab, MenuItem, DropdownButton } from 'react-bootstrap';
import DashboardActionBar from './DashboardActionBar';
import DocumentSummary from './DocumentSummary';
import DocketTimeline from './DocketTimeline';
import { examine_error } from '../utils/errors';
import { navigateSummary } from '../utils/navigate';
import {
  fetchFullDocuments,
  fetchDocketTimeline,
  fetchRelatedDocumentCount,
  markDocumentAsRead,
  changeDocumentView,
  addBanner,
  closeOverlay
} from '../../shared/actions';
import { connect } from 'react-redux';
import { submit_timing, safe_mixpanel_track, safe_analytics } from '../../shared/utils/analytics';
import { defaultStateAgencies } from '../../shared/utils/defaultSources';

class Rule extends React.Component {
  constructor(props) {
    super(props);

    const documentId = this.getDocumentId(props);
    const document = this.getDocument();

    let selectedDocketId = null;

    if (document && document.dockets && document.dockets.length > 0) {
      selectedDocketId = document.dockets[0].docket_id;
    }

    this.fetch_start = Date.now();

    this.state = {
      documentId,
      selectedDocketId,
      is_state_code: false,
      root_state_code_id: null,
      path: []
    };
  }

  componentDidMount() {
    //prevent fetch if document already in store
    const documentId = this.getDocumentId(this.props);
    const docInStore = this.props.document_details.documents[documentId];

    if (!this.props.document_details.isFetching && !docInStore) {
      this.props.fetchDocuments(this.state.documentId).then(doc_folder => {
        const selected_doc = doc_folder[0].document;
        const is_state_code =
          selected_doc.category === 'State Code Navigation' ||
          selected_doc.category === 'State Code';

        if (is_state_code) {
          //store state indicator for future
          this.setState({ is_state_code });
          if (!this.props.us_state[this.state.documentId]) {
            this.props.fetchStateCode(this.state.documentId).then(state_folder => {
              const selected_state = state_folder[0].document;
              //set root state code
              for (const state of defaultStateAgencies) {
                if (state.short_name === selected_state.jurisdiction) {
                  this.setState({ root_state_code_id: state.state_code_id });
                }
              }
              this.buildStateCodeTree(selected_state.id);
            });
          } else {
            const selected_state = this.props.us_state[this.state.documentId];
            //set root state code
            for (const state of defaultStateAgencies) {
              if (state.short_name === selected_state.jurisdiction) {
                this.setState({ root_state_code_id: state.state_code_id });
              }
            }
            this.buildStateCodeTree(selected_state.id);
          }
        }
        this.props.fetchDocketTimeline({ document_id: this.state.documentId });
        this.props.fetchRelatedDocumentCount({ more_like_doc_id: this.state.documentId });
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const nextDocumentId = this.getDocumentId(nextProps);
    //prevent fetch if document already in store
    const docInStore = this.props.document_details.documents[nextDocumentId];

    if (this.state.documentId !== nextDocumentId && !docInStore) {
      this.setState({ documentId: nextDocumentId });

      this.fetch_start = Date.now();

      this.props.fetchDocuments(nextDocumentId);
      this.props.fetchDocketTimeline({ document_id: nextDocumentId });
      this.props.fetchRelatedDocumentCount({ more_like_doc_id: nextDocumentId });
    }

    const document = this.getDocument(nextProps);

    if (!(document && document.dockets)) {
      return;
    }

    const documentsFinished =
      this.props.document_details.isFetching && !nextProps.document_details.isFetching;
    const docketsFinished =
      this.props.docket_timeline.isFetching && !nextProps.document_details.isFetching;
    const bothReady = nextProps.document_details.isReady && nextProps.docket_timeline.isReady;

    if (bothReady && (documentsFinished || docketsFinished)) {
      this._sendAnalytics(nextProps);
      submit_timing(this.fetch_start, 'Document summary', 'fetch', 'Document summary fetch');
      safe_mixpanel_track('Document summary – fetch – Document summary fetch', {
        hitType: 'timing',
        timingCategory: 'Document summary',
        timingVar: 'fetch',
        $duration: Date.now() - this.fetch_start,
        timingLabel: 'Document summary fetch'
      });
    }

    const selectedDocketId = this.state.selectedDocketId;

    // if none is selected, just pick the first one
    if (
      document.dockets &&
      document.dockets.length > 0 &&
      !(selectedDocketId && _.get(nextProps, `docket_timeline.dockets[${selectedDocketId}]`))
    ) {
      this.setState({ selectedDocketId: document.dockets[0].docket_id });
    }
    //check for errors
    const errors = nextProps.errors;
    const error_banner_in_view =
      this.props.current_view.banner.type === 'error' && this.props.current_view.banner.display;

    if (errors.document_summary && errors.document_summary.length > 0 && !error_banner_in_view) {
      const err = errors.document_summary[0];
      const err_msg = (
        <div className="banner-alert-container">
          <h4 className="banner-text">{examine_error(err, 'document_summary').text}</h4>
        </div>
      );
      this.props.addBanner('error', true, err_msg);
    }
  }

  getDocumentId(props) {
    props = props || this.props;

    if (!_.isNil(props.current_view.id)) {
      return props.current_view.id;
    }
    const { query } = this.props.location;

    if (query.citation_selected_id) {
      return parseInt(query.citation_selected_id, 10);
    }

    return parseInt(props.routeParams.documentId, 10);
  }

  getDocument(props) {
    props = props || this.props;

    if (!props) {
      // this is for IE
      return null;
    }

    const documentId = this.getDocumentId(props);
    const docInStore = props.document_details.documents[documentId];

    if (!docInStore) {
      return null;
    }

    return docInStore;
  }

  getActiveTab() {
    if (this.props.current_view.page === 'summary-timeline') {
      return 'timeline';
    }

    return 'details';
  }

  buildStateCodeTree = (doc_id, path = [doc_id]) => {
    if (!this.props.us_state[this.state.documentId]) {
      this.props.fetchStateCode(doc_id).then(doc_folder => {
        if (!doc_folder) {
          return;
        }

        const selected_state = doc_folder[0].document;
        if (selected_state.parent) {
          path.push(selected_state.parent.id);
          this.buildStateCodeTree(selected_state.parent.id, path);
        } else {
          const ordered_path = _.reverse(path);
          this.setState({ path: ordered_path });
        }
      });
    } else {
      const selected_state = this.props.us_state[this.state.documentId];
      if (selected_state.parent) {
        path.push(selected_state.parent.id);
        this.buildStateCodeTree(selected_state.parent.id, path);
      } else {
        const ordered_path = _.reverse(path);
        this.setState({ path: ordered_path });
      }
    }
  };

  handleTabChange(key) {
    const { query } = this.props.location;
    const overlay = query.overlay ? query.overlay : '';

    if (key === 'timeline') {
      navigateSummary(
        this.props.location,
        this.context.router,
        this.props.current_view.id,
        overlay,
        'summary-timeline'
      );
    } else if (key === 'details') {
      navigateSummary(
        this.props.location,
        this.context.router,
        this.props.current_view.id,
        overlay,
        'summary'
      );
    }

    this._sendAnalytics();
  }

  _sendAnalytics(props) {
    props = props || this.props;

    let action = 'View document';
    const document = this.getDocument(props) || {};

    if (props.current_view.page === 'summary-timeline') {
      action = 'View docket timeline';
    }

    safe_analytics('Doc Details – ' + action, 'Doc Details', action, document.title);
  }

  selectDocket(selectedDocketId) {
    this.setState({ selectedDocketId });
  }

  render() {
    let loadingClass = '';

    if (!this.props.document_details.isReady) {
      loadingClass = 'loading-active';
    }

    let document = this.getDocument();

    let dockets = [];

    if (!document) {
      document = {};
    } else {
      dockets = document.dockets;
    }

    let docketTimelineFragment = null;

    if (dockets && dockets.length > 0) {
      const docketNavFragment = dockets.map(docket => {
        const docketId = docket.docket_id;
        const boundClick = this.selectDocket.bind(this, docketId);
        return (
          <MenuItem
            className="timeline-docket"
            key={docketId}
            onClick={boundClick}
            location={this.props.location}
          >
            {docketId}
          </MenuItem>
        );
      });

      docketTimelineFragment = (
        <section className="docket-timeline">
          <div className="docket-timeline-button-container">
            <DropdownButton
              title={this.state.selectedDocketId}
              noCaret={docketNavFragment.length === 1}
              id="docket-timeline-dropdown"
              bsStyle="primary"
            >
              {docketNavFragment}
            </DropdownButton>
          </div>
          {this.state.selectedDocketId && (
            <DocketTimeline
              docketId={this.state.selectedDocketId}
              currentDocumentId={document.id}
              location={this.props.location}
            />
          )}
        </section>
      );
    }

    let containerFragment;
    // note that we pass in a redux action here so DocumentSummary
    // remains easy to instantiate and render into strings (for email.js
    // and pdf.js)
    const toggleOverlay = overlay => {
      if (this.props.current_view.overlay) {
        navigateSummary(this.props.location, this.context.router, document.id);
        this.props.closeOverlay();
      } else {
        const overlay_event = overlay === 'news-overlay' ? 'View Summary' : 'View PDF';
        this.props.markDocumentAsRead(document.id, true);
        navigateSummary(this.props.location, this.context.router, document.id, overlay);
        safe_analytics(
          'Doc Details – ' + overlay_event,
          'Doc Details',
          overlay_event,
          document.title
        );
      }
    };

    const relatedDocumentCount = this.props.document_details.related_count[document.id];

    const summaryFragment = (
      <DocumentSummary
        document={document}
        toggleOverlay={toggleOverlay}
        current_view={this.props.current_view}
        changeDocumentView={this.props.changeDocumentView}
        markDocumentAsRead={this.props.markDocumentAsRead}
        location={this.props.location}
        us_state={this.props.us_state}
        buildStateCodeTree={this.buildStateCodeTree}
        fetchStateCode={this.props.fetchStateCode}
        relatedDocumentCount={relatedDocumentCount}
        path={this.state.path}
      />
    );

    if (this.props.current_view.page === 'summary-with-back') {
      const handleBackClick = e => {
        e.preventDefault();
        const { query } = this.props.location;
        const overlay = query.overlay ? query.overlay : '';

        navigateSummary(
          this.props.location,
          this.context.router,
          this.props.current_view.last_id,
          overlay,
          'summary-timeline'
        );
      };
      containerFragment = (
        <div>
          <ul className="top-tab-container nav">
            <li className="top-tab">
              <a className="back-btn" onClick={handleBackClick}>
                Back to Docket Timeline
              </a>
            </li>
          </ul>
          {summaryFragment}
        </div>
      );
    } else {
      containerFragment = (
        <Tabs
          activeKey={this.getActiveTab()}
          onSelect={key => this.handleTabChange(key)}
          id="document-summary-tabs"
        >
          <Tab eventKey={'details'} title="Details" key="details">
            {this.props.location.query.overlay ? (
              <DashboardActionBar
                location={this.props.location}
                rightPanel
                documentId={this.state.documentId}
                document_details={this.props.document_details}
              />
            ) : null}
            {summaryFragment}
          </Tab>
          <Tab
            eventKey={'timeline'}
            title="Docket Timeline"
            key="timeline"
            disabled={!docketTimelineFragment}
          >
            {docketTimelineFragment}
          </Tab>
        </Tabs>
      );
    }

    return (
      <div className={`${loadingClass} loading-overlay-medium`} id="rule-container">
        {containerFragment}
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    errors: state.errors,
    us_state: state.us_state,
    document_details: state.document_details,
    docket_timeline: state.docket_timeline,
    current_user: state.current_user,
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchDocuments: id => {
      return dispatch(fetchFullDocuments({ id, doc_details: true }));
    },
    fetchStateCode: id => {
      return dispatch(fetchFullDocuments({ id, state_code: true, decorate_children: true }));
    },
    fetchDocketTimeline: params => {
      dispatch(fetchDocketTimeline(params));
    },
    fetchRelatedDocumentCount: params => {
      dispatch(fetchRelatedDocumentCount(params));
    },
    markDocumentAsRead: (ids, read_or_unread) => {
      dispatch(markDocumentAsRead(ids, read_or_unread));
    },
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    },
    addBanner: (banner_type, banner_status, content) => {
      dispatch(addBanner(banner_type, banner_status, content));
    },
    closeOverlay: () => {
      dispatch(closeOverlay());
    }
  };
};

const ReduxRule = connect(mapStateToProps, mapDispatchToProps)(Rule);

export default ReduxRule;

Rule.contextTypes = {
  router: PropTypes.object
};
