import React from 'react';
import PropTypes from 'prop-types';
import { Row, Pagination } from 'react-bootstrap';
import { connect } from 'react-redux';
import trunc from 'trunc-html';
import { get_autosuggest_term, autosuggest_name_map } from '../../shared/utils/autosuggest';
import { navigateSummary } from '../utils/navigate';
import _ from 'lodash';
import BulkDocumentSelect from './BulkDocumentSelect';

const DocumentSearchListHeader = (props, context) => {
  const { query } = props.location;

  const handlePageSelect = selectedPage => {
    const { pathname } = props.location;
    const query_args = query;
    const new_offset = props.current_view.search_params.limit * (selectedPage - 1);
    context.router.push({
      pathname,
      query: {
        ...query_args,
        offset: new_offset
      }
    });
  };

  const filter_or_relevance_key =
    query.search_sort === 'date' ? 'search_results_filter' : 'search_results_relevance';

  const resultCount = props[filter_or_relevance_key].results.count;
  let count_clarifier = null;

  if (resultCount > 10000) {
    count_clarifier = <div className="results-clarifier">(showing top 10,000)</div>;
  }

  let search_results_title;
  let search_query;

  if (query.on_saved_search) {
    const searchId = Number(query.on_saved_search);
    const search = _.find(props.saved_searches, savedSearch => savedSearch.id === searchId);

    search_results_title = 'Results for Saved Search:';
    search_query = <h4>{!_.isNil(search) ? search.name : null}</h4>;
  } else if (query.autosuggest_filter) {
    // if the value originally selected was in the short name list, parse our
    // autosuggest_mapper query argument and pull out the index, otherwise
    // use the name of the mention as the default behavior
    const value = get_autosuggest_term(query, props.filtered_mention.mention);

    let type = autosuggest_name_map[query.autosuggest_filter] || null;
    type = type[0].toUpperCase() + type.slice(1);
    search_results_title = `Results for ${type}:`;
    search_query = <h4>{value}</h4>;
  } else if (query.more_like_doc_id) {
    const related_id = parseInt(query.more_like_doc_id, 10);
    const related_doc = props.documents_full.ids[related_id];

    let related_to_frag = null;

    if (related_doc) {
      const open_doc = () => {
        navigateSummary(props.location, context.router, related_id);
      };
      const title = trunc(related_doc.title, 50).text;
      related_to_frag = (
        <span className="related-link">
          <i className="material-icons">description</i>
          <a onClick={open_doc}>{title}</a>
        </span>
      );
    }
    search_results_title = 'Results for documents related to:';
    search_query = related_to_frag;
  } else {
    search_results_title = 'Matching results for query:';
    search_query = <h4>{query.search_query}</h4>;
  }

  const limit = props.current_view.search_params.limit;
  /*
   XXX: Caps the number of results to stay under the 10,000 limit set on elasticsearch
   See: http://stackoverflow.com/questions/35206409/elasticsearch-2-1-result-window-is-too-large-index-max-result-window/35223055
  */
  const capped_count = resultCount < 10000 ? resultCount : 10000;
  const numberOfPages = Math.ceil(capped_count / limit);

  const numberWithCommas = x => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  const decorated_count = !_.isNil(resultCount) ? numberWithCommas(resultCount) : null;
  return (
    <div>
      <Row className="search-results-header">
        <div className="header-text-container">
          <div className="results-header-container">
            <h4>{search_results_title}</h4>
            {search_query}
            <BulkDocumentSelect bulk="search" />
          </div>
          <div className="query-clarifier-container">
            <h4>{decorated_count} documents from Compliance.ai</h4>
            {count_clarifier}
          </div>
        </div>
        {numberOfPages > 1 ? (
          <Pagination
            bsClass="pagination-bar"
            bsSize="medium"
            ellipsis
            next
            prev
            boundaryLinks
            maxButtons={10}
            items={numberOfPages}
            activePage={props.handleActivePage()}
            onSelect={handlePageSelect}
          />
        ) : null}
      </Row>
    </div>
  );
};

DocumentSearchListHeader.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    search_results_relevance: state.search_results_relevance,
    search_results_filter: state.search_results_filter,
    documents_full: state.documents_full,
    filtered_mention: state.filtered_mention,
    current_view: state.current_view,
    saved_searches: state.saved_searches.saved_searches
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxDocumentSearchListHeader = connect(mapStateToProps, mapDispatchToProps)(
  DocumentSearchListHeader
);

export default ReduxDocumentSearchListHeader;
