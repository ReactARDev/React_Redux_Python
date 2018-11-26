import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import TopicsListItem from './TopicsListItem';
import moment from 'moment';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import { publication_to_spider } from '../utils/publications';
import {
  changeSelectedItem,
  markDocumentAsRead,
  markDocumentAsBookmarked,
  saveUnBookmarkedDocument
} from '../../shared/actions';
import { category_from_api } from '../../shared/utils/category';
import { navigateSummary } from '../utils/navigate';
import { safe_analytics } from '../../shared/utils/analytics';
import KeyDates from './KeyDates';

const MAX_TITLE_LENGTH = 330;

export class DocumentListItem extends React.Component {
  constructor(props) {
    super(props);
  }

  navigateSummary(id, overlay = '') {
    navigateSummary(this.props.location, this.context.router, id, overlay);
  }

  handleClick(event) {
    if (
      event.target &&
      (event.target.classList.contains('clickable') || event.target.tagName === 'INPUT')
    ) {
      return;
    }

    event.preventDefault();
    const document = this.props.document;

    if (event.type === 'click') {
      this.navigateSummary(document.id);
    } else {
      // double click
      this.props.markDocumentAsRead(document.id, true);
      const overlay = document.category === 'Mainstream News' ? 'news-overlay' : 'pdf-overlay';
      this.navigateSummary(document.id, overlay);
    }
  }

  renderAgencyNames(document) {
    let text = null;
    if (document.agencies) {
      text = document.agencies
        .map(a => {
          return a.short_name || a.name;
        })
        .sort()
        .join(', ');
    }

    if (document.category === 'Mainstream News') {
      text = publication_to_spider(document.spider_name);
    }
    return text;
  }

  render() {
    const { query } = this.props.location;

    const document = this.props.document;

    //if the document has NOT been read and the read filter is on return null
    if (!document.read && query.read === true) {
      return null;
    }
    //if the document has been read and the unread filter is on return null
    if (document.read && query.read === false) {
      return null;
    }
    // XXX clean up and remove unnecessary features
    const row_classes = {
      read_document: document.read,
      'document-row': true,
      selected: this.props.current_view.id === this.props.document.id,
      today: this.props.today
    };

    const bookmark_icon = document.bookmarked ? 'bookmark' : 'bookmark_border';

    const handleCheck = e => {
      const value = !!e.target.checked;

      if (!this.props.current_view.selected_items[document.id]) {
        this.navigateSummary(document.id);
      }
      this.props.changeSelectedItem(document.id, value);
    };

    let title = document.title;

    const handleBookmarked = e => {
      if (document.bookmarked) {
        safe_analytics(
          'Doc Action – Unbookmark document',
          'Doc Action',
          'Unbookmark document',
          title
        );

        if (query.bookmarked === 'true') {
          this.props.saveUnBookmarkedDocument(document.id);
        }
      } else {
        safe_analytics('Doc Action – Bookmark document', 'Doc Action', 'Bookmark document', title);
      }
      this.props.markDocumentAsBookmarked(document.id, !document.bookmarked);
    };

    if (title.length > MAX_TITLE_LENGTH) {
      title = title.substr(0, MAX_TITLE_LENGTH) + '…';
    }

    const topics_list = document.topics.map(topic => (
      <TopicsListItem key={topic.id} topic={topic} location={this.props.location} />
    ));

    return (
      <tr
        className={classNames(row_classes, this.props.extra_classes)}
        onClick={e => this.handleClick(e)}
        onDoubleClick={e => this.handleClick(e)}
      >
        <td>
          <div className="controls">
            <div>
              <Checkbox
                className="text-center"
                onChange={handleCheck}
                checked={this.props.current_view.selected_items[document.id]}
                inline
              >
                <i className="material-icons unchecked clickable">check_box_outline_blank</i>
                <i className="material-icons checked clickable">check_box</i>
              </Checkbox>
            </div>
            <a
              className="bookmark material-icons clickable"
              aria-hidden="true"
              onClick={handleBookmarked}
            >
              {bookmark_icon}
            </a>
          </div>
        </td>
        {this.props.app_view.section !== 'news' ? (
          <td>
            <KeyDates document={document} />
          </td>
        ) : null}
        <td>{moment(document.publication_date).format('MM/DD/YYYY')}</td>
        <td className="title">
          <span>{title}</span>
          <div className="document-topics-list">{topics_list}</div>
        </td>
        <td>
          <div className="type label">{category_from_api(document.category)}</div>
        </td>
        <td>
          <span className="agencies">{this.renderAgencyNames(document)}</span>
        </td>
      </tr>
    );
  }
}

DocumentListItem.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    documents: state.documents,
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeSelectedItem: (id, value) => {
      dispatch(changeSelectedItem(id, value));
    },
    markDocumentAsRead: (ids, read_or_unread) => {
      dispatch(markDocumentAsRead(ids, read_or_unread));
    },
    markDocumentAsBookmarked: (ids, bookmarked_status) => {
      dispatch(markDocumentAsBookmarked(ids, bookmarked_status));
    },
    saveUnBookmarkedDocument: id => {
      dispatch(saveUnBookmarkedDocument(id));
    }
  };
};

const ReduxDocumentListItem = connect(mapStateToProps, mapDispatchToProps)(DocumentListItem);

export default ReduxDocumentListItem;
