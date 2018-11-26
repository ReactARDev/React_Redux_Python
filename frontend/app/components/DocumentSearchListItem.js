import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import moment from 'moment';
import _ from 'lodash';
import { connect } from 'react-redux';
import TopicsListItem from './TopicsListItem';
import { Checkbox, Row, Col } from 'react-bootstrap';
import {
  markDocumentAsRead,
  changeSelectedItem,
  markDocumentAsBookmarked,
  rateSearchResult,
  addContributorPoints
} from '../../shared/actions';
import { category_from_api } from '../../shared/utils/category';
import { navigateSummary } from '../utils/navigate';
import NewFeatureTooltip from './NewFeatureTooltip';
import { safe_highlight_and_truncate, get_highlighted_string_fragments } from '../utils/string';
import { safe_analytics } from '../../shared/utils/analytics';
import KeyDates from './KeyDates';
import { publication_to_spider } from '../utils/publications';
import { apiUrl } from '../../shared/config';

const MAX_EXCERPT_LENGTH = 175;

export class DocumentSearchListItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      relevant: null
    };
  }

  componentWillReceiveProps(nextProps) {
    /*
      If the document has already been rated relevant by the user using the same
      search parameters, surface the last vote cast, otherwise show as if not voted.
    */
    const document = nextProps.document;
    if (nextProps.user_vote.voted_docs[document.id]) {
      if (
        _.isEqual(
          nextProps.user_vote.voted_docs[document.id].search_args,
          nextProps.user_vote.search_args
        )
      ) {
        if (nextProps.user_vote.voted_docs[document.id].relevance) {
          if (this.state.relevant !== true) {
            this.setState({ relevant: true });
          }
        } else if (nextProps.user_vote.voted_docs[document.id].relevance === false) {
          if (this.state.relevant !== false) {
            this.setState({ relevant: false });
          }
        }
      }
    }
  }

  getSearchTerms() {
    const search_terms = [];
    const filtered_item = this.props.filtered_mention.mention;

    // make sure the name, short_name, id for the filtered item all get highlighted
    if (filtered_item) {
      if (filtered_item.name) {
        // n.b. dockets have no name
        search_terms.push(filtered_item.name);
      }
      if (filtered_item.short_name) {
        search_terms.push(filtered_item.short_name);
      }
      if (filtered_item.nicknames && filtered_item.nicknames.constructor === Array) {
        for (const nickname of filtered_item.nicknames) {
          search_terms.push(nickname);
        }
      }
    }

    return search_terms;
  }

  handleVoting(is_relevant) {
    this.setState({ relevant: is_relevant });

    const vote = is_relevant ? 'Yes' : 'No';
    safe_analytics('default', 'Feedback', 'Relevant Result', vote);

    const document = this.props.document;
    const search_args = this.props.user_vote.search_args;

    this.props.rateSearchResult(document.id, is_relevant, search_args).then(() => {
      //only attribute points if vote successful
      this.props.addContributorPoints('rateresult');
    });
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
      const search_query = this.props.current_view.search_params.search_query;
      safe_analytics(
        'Search – Search Results Click',
        'Search',
        'Search Results Click',
        search_query
      );

      this.navigateSummary(document.id);
    } else {
      // double click
      this.props.markDocumentAsRead(document.id, true);
      if (category_from_api(document.category) === 'Mainstream News') {
        window.open(document.web_url, '_blank');
        return;
      }
      this.navigateSummary(document.id, 'pdf-overlay');
    }
  }

  handleBookmarked = () => {
    const document = this.props.document;
    const title = document.title;

    if (document.bookmarked) {
      safe_analytics(
        'Doc Action – Unbookmark document',
        'Doc Action',
        'Unbookmark document',
        title
      );
    } else {
      safe_analytics('Doc Action – Bookmark document', 'Doc Action', 'Bookmark document', title);
    }

    this.props.markDocumentAsBookmarked(document.id, !document.bookmarked);
  };

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

    return text;
  }

  render() {
    const { query } = this.props.location;

    const document = this.props.document;

    const autosuggest_filter_results = query.autosuggest_filter;

    if (!(document.highlights || autosuggest_filter_results || query.more_like_doc_id)) {
      //handle delay with getting highlighted terms
      return null;
    }

    const title = document.title;

    const handleCheck = e => {
      const value = !!e.target.checked;

      if (!this.props.current_view.selected_items[document.id + document.sort_basis]) {
        this.navigateSummary(document.id);
      }
      this.props.changeSelectedItem(document.id, value);
    };

    const results_classes = {
      read_document: document.read,
      selected: this.props.current_view.id === this.props.document.id,
      'document-result': true
    };

    const bookmark_icon = document.bookmarked ? 'bookmark' : 'bookmark_border';

    // FIXME: we should extract the search terms once at the list level
    let search_terms = [];

    if (query.search_sort === 'relevance') {
      search_terms.push(this.props.current_view.search_params.search_query);
    } else if (query.search_sort === 'date') {
      const mentions_for_filter = document.mentions_for_filter || [];
      search_terms = this.getSearchTerms().concat(mentions_for_filter);
    }

    const summary_text = [];

    let full_texts;

    // FIXME: using the summary text here for highlighting doesn't make sense -
    // there are no search terms.
    if (query.more_like_doc_id) {
      full_texts = [_.get(document, 'summary_text')];
    } else if (query.search_sort === 'date') {
      // FIXME: this means we are running our highlighting code twice, we should allow it to skip
      // highlighting when we've already ran it once locally
      full_texts = _.get(document, 'full_text')
        ? get_highlighted_string_fragments(_.get(document, 'full_text'), search_terms, 'em')
        : '';
    } else {
      full_texts = _.get(document, 'highlights.full_text');
    }

    if (full_texts) {
      let i = 0;
      for (const full_text of full_texts) {
        if (full_text) {
          const highlighted = safe_highlight_and_truncate(
            full_text,
            search_terms,
            'em',
            MAX_EXCERPT_LENGTH
          );
          const key = `${document.id}-${i}`;

          const initial = i === 0 ? '…' : '';

          summary_text.push(
            <span
              key={key}
              dangerouslySetInnerHTML={{
                __html: `${initial} ${highlighted} …`
              }}
            />
          );

          i++;
        }
      }
    }
    // results look better if we do highlighting on our side:
    const highlighted_title = safe_highlight_and_truncate(
      title,
      search_terms,
      'em',
      MAX_EXCERPT_LENGTH
    );

    /*
      Check to make sure the save search button tooltip isn't displayed at the same time
      as the relevance voting tootip to avoid overlapping
    */
    const saved_search_tip_selected =
      this.props.current_user.user.properties &&
      this.props.current_user.user.properties.read_new_feature_tip
        ? this.props.current_user.user.properties.read_new_feature_tip['2']
        : false;

    const relevanceVoteClasses = {
      'relevant-vote': true,
      relevant: this.state.relevant === true
    };
    const notRelevanceVoteClasses = {
      'not-relevant-vote': true,
      'not-relevant': this.state.relevant === false
    };

    const topics_list = document.topics.map(topic => (
      <TopicsListItem key={topic.id} topic={topic} location={this.props.location} />
    ));

    const image_present =
      !_.isNil(document.mainstream_news) && !_.isNil(document.mainstream_news.image_url);

    const publication_name =
      category_from_api(document.category) === 'Mainstream News'
        ? publication_to_spider(document.spider_name)
        : '';

    return (
      <li
        className={classNames(results_classes, this.props.extra_classes)}
        onClick={e => this.handleClick(e)}
        onDoubleClick={e => this.handleClick(e)}
      >
        <div className="document-result-content">
          <Row className="document-result-row header">
            <div className="title-topic-img-container">
              <div className="title-topic-btns">
                <div
                  className="document-result-title"
                  dangerouslySetInnerHTML={{ __html: highlighted_title }}
                />
                <div className="document-topics-list">{topics_list}</div>
              </div>
              {image_present ? (
                <img
                  className="mainstream-news-img"
                  src={apiUrl + `/document_image/` + this.props.document.id + '?access_token=' + localStorage.token}
                  alt="news_img"
                />
              ) : null}
            </div>
            <div id="vote-container">
              <h5>Relevant Result?</h5>
              <div className="relevance-vote-icons">
                <span
                  className={classNames(relevanceVoteClasses)}
                  title="Relevant"
                  onClick={() => this.handleVoting(true)}
                >
                  Y
                </span>
                <span
                  className={classNames(notRelevanceVoteClasses)}
                  title="Not Relevant"
                  onClick={() => this.handleVoting(false)}
                >
                  N
                </span>
              </div>
            </div>
            {this.props.index === 0 ? (
              <NewFeatureTooltip
                targetId={'vote-container'}
                content="Select 'Y' when you see a relevant document in the results provided.
                  Select 'N' for documents that are not relevant. Your feedback helps
                  us improve results for all users."
                readyToDisplay={!_.isNil(saved_search_tip_selected)}
                featureId="5"
              />
            ) : null}
          </Row>
          <Row className="document-result-row dates">
            <span>Publication Date:</span>
            <span>{moment(document.publication_date).format('MM/DD/YYYY')}</span>
            <KeyDates document={document} labelFirst labelSuffix={':'} />
          </Row>
          <Row className="document-result-row">
            {!_.isEmpty(document.agencies) ? (
              <span className="document-result-agency">{this.renderAgencyNames(document)}</span>
            ) : null}
            <span className="document-result-category">
              {publication_name + ' ' + category_from_api(document.category)}
            </span>
          </Row>
          <Row className="document-result-row">
            <Col xs={1} className="document-result-controls">
              <div>
                <Checkbox
                  onChange={handleCheck}
                  checked={this.props.current_view.selected_items[document.id]}
                  inline
                >
                  <i className="material-icons unchecked clickable">check_box_outline_blank</i>
                  <i className="material-icons checked clickable">check_box</i>
                </Checkbox>
              </div>
              <a
                className="material-icons bookmark"
                onClick={() => this.handleBookmarked()}
                aria-hidden="true"
              >
                {bookmark_icon}
              </a>
            </Col>
            <Col xs={11} className="document-result-summary-text">
              {summary_text}
            </Col>
          </Row>
        </div>
      </li>
    );
  }
}

DocumentSearchListItem.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view,
    filtered_mention: state.filtered_mention,
    user_vote: state.user_vote,
    current_user: state.current_user
  };
};

const mapDispatchToProps = dispatch => {
  return {
    markDocumentAsRead: (ids, read_or_unread) => {
      dispatch(markDocumentAsRead(ids, read_or_unread));
    },
    changeSelectedItem: (id, value) => {
      dispatch(changeSelectedItem(id, value));
    },
    markDocumentAsBookmarked: (ids, bookmarked_status) => {
      dispatch(markDocumentAsBookmarked(ids, bookmarked_status));
    },
    rateSearchResult: (doc_id, is_relevant, search_args) => {
      return dispatch(rateSearchResult(doc_id, is_relevant, search_args));
    },
    addContributorPoints: short_name => {
      dispatch(addContributorPoints(short_name));
    }
  };
};

const ReduxDocumentSearchListItem = connect(mapStateToProps, mapDispatchToProps)(
  DocumentSearchListItem
);

export default ReduxDocumentSearchListItem;
