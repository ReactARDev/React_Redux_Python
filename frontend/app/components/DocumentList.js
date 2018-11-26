import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import classnames from 'classnames';
import { connect } from 'react-redux';
import moment from 'moment';
import _ from 'lodash';
import DocumentListItem from './DocumentListItem';
import { skippedAgencyOnly } from '../utils/agency';
import { get_search_view } from '../utils/search';
import {
  clearDocRef,
  fetchFullDocuments,
  setDocsToSelect,
  clearSelectedItems
} from '../../shared/actions';
import { sameDocsToSelect } from '../utils/getSelected';
import BulkDocumentSelect from './BulkDocumentSelect';

class DocumentList extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
    if (!this.props.documents.isFetching) {
      if (this.props.last_doc_ref) {
        // n.b. takes the last document from the list before expanding downwards and scrolls to it
        const last_document_node = ReactDOM.findDOMNode(this.refs[this.props.last_doc_ref]);
        if (last_document_node) {
          last_document_node.scrollTop = last_document_node.offsetTop;
          this.props.clearDocRef(); // clearing prevents unwanted scrolling on bookmarking
        }
      } else if (this.props.first_doc_ref) {
        // takes the first document from the list before expanding upwards and scrolls to it
        const first_document_node = ReactDOM.findDOMNode(this.refs[this.props.first_doc_ref]);
        if (first_document_node) {
          first_document_node.scrollTop = first_document_node.offsetTop;
          this.props.clearDocRef(); // clearing prevents unwanted scrolling on bookmarking
        }
      }
      if (sameDocsToSelect(this.props.current_view.docs_to_select, this.props.documents)
      ) {
        return;
      }
      this.props.clearSelectedItems();
      this.props.setDocsToSelect(this.props.documents);
    }
  }

  render() {
    if (!this.props.documents) {
      return null;
    }

    let blkSlct = <div><BulkDocumentSelect bulk='timeline' /></div>;

    const { query } = this.props.location;
    const app_view = get_search_view(this.props.current_view.search_params, this.props.location);

    let last_month = null;
    const list_items = [];

    const today = moment();
    let found_today = false;

    const selections = {};
    if (this.props.agencies.isReady) {
      this.props.agencies.followed_agencies.forEach(agency => {
        selections[agency.id] = true;
      });
    }
    /*
      display empty timeline if:
        -User followed sources are all skipped agencies
        -Doc count is 0
        -Fed/State agency tab has been selected and they are not following either
      whitelist from source check, user folder view, bookmark, and read as these features
      are source agnostic
      whitelist from doc count reg timeline view as it updates with infinite scroll
    */
    if (
      (skippedAgencyOnly(selections) && !query.folder_id && !query.bookmarked && !query.read) ||
      (this.props.count < 1 && !this.props.current_view.expanding_list) ||
      this.props.current_view.empty_timeline_view
    ) {
      blkSlct = null;
      let empty_timeline_msg = null;

      if (query.bookmarked) {
        //empty bookmark folder
        empty_timeline_msg = (
          <div className="empty-timeline-msg">
            <h1>You have no bookmarked documents.</h1>
          </div>
        );
      } else if (query.read && query.read_folder_view) {
        //empty read folder
        empty_timeline_msg = (
          <div className="empty-timeline-msg">
            <h1>You have no read documents.</h1>
          </div>
        );
      } else if (query.folder_id) {
        //empty custom folder
        empty_timeline_msg = (
          <div className="empty-timeline-msg">
            <h1>You have no documents in this folder.</h1>
          </div>
        );
      } else {
        empty_timeline_msg = (
          <div className="empty-timeline-msg">
            <h1>Your Timeline is Empty</h1>
            <h3>Suggestions:</h3>
            <ul>
              <li>Open Filters, and expand your date range, or</li>
              <li>Open Filters, and select more/different sources of data, or</li>
              <li>Open Filters, and select more/different document types, or</li>
              <li>Click on the Sources tab to follow agencies that have timeline documents</li>
            </ul>
          </div>
        );
      }
      list_items.push(
        <tr key="no-doc-msg">
          <td className="empty-timeline-data">{empty_timeline_msg}</td>
        </tr>
      );
    } else {
      const documents = this.props.documents;

      documents.items.forEach(document => {
        const doc_date = moment(document.sort_date);
        const month = doc_date.format('MMMM YYYY');
        let is_today = false;

        if (!found_today && doc_date.isSameOrBefore(today, 'day')) {
          is_today = true;
          found_today = true;
        }

        if (is_today && _.isNil(query.folder_id)) {
          list_items.push(
            <tr key={today}>
              <td className="month" colSpan="12">
                Today
              </td>
            </tr>
          );
        }

        if (month !== last_month && _.isNil(query.folder_id)) {
          list_items.push(
            <tr key={month}>
              <td className="month" colSpan="12">
                {month}
              </td>
            </tr>
          );
        }

        const unique_key = document.id * Math.random();
        list_items.push(
          <DocumentListItem
            ref={document.id + document.sort_basis + document.sort_date}
            key={unique_key}
            document={document}
            today={is_today}
            location={this.props.location}
            app_view={app_view}
          />
        );
        last_month = month;
      });
    }
    return (
      <div className="document-list">
        <div className="header-line" />
        <table className="table table-hover">
          <thead>
            <tr>
              {/*the table header needs to be in this format so the top row text
              of the table doesn't get cutt off*/}
              <th className={classnames({ bulk_select: true })}>
                {blkSlct}
              </th>
              {app_view.section !== 'news' ? (
                <th>
                  Key Date<div>Key Date</div>
                </th>
              ) : null}
              <th>
                Pub. Date<div>Pub. Date</div>
              </th>
              <th className={classnames({ title: true, news: app_view.section === 'news' })}>
                Title<div>Title</div>
              </th>
              <th className={classnames({ doc_type_in_news: app_view.section === 'news' })}>
                Doc Type<div>Doc Type</div>
              </th>
              <th>
                Source<div>Source</div>
              </th>
            </tr>
          </thead>
          <tbody>{list_items}</tbody>
        </table>
      </div>
    );
  }
}

DocumentList.contextTypes = {
  router: PropTypes.object
};

const mapStateToprops = state => ({
  current_view: state.current_view
});

const mapDispatchToProps = dispatch => {
  return {
    clearDocRef: () => {
      dispatch(clearDocRef());
    },
    fetchFullDocuments: id => {
      dispatch(fetchFullDocuments({ id }));
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    setDocsToSelect: (docs) => {
      dispatch(setDocsToSelect(docs));
    }
  };
};

export default connect(mapStateToprops, mapDispatchToProps)(DocumentList);
