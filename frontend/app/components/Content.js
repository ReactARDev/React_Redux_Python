import React from 'react';
import PropTypes from 'prop-types';
import Timeline from './Timeline';
import SearchResults from './SearchResults';
import d3 from 'd3';
import SavedSearchesList from './SavedSearchesList';
import { submit_timing, safe_mixpanel_track, safe_analytics } from '../../shared/utils/analytics';
import { connect } from 'react-redux';
import { navigateSummary } from '../utils/navigate';
import { autosuggest_filter_mapping } from '../../shared/utils/autosuggest';
import { agencies_skipped_on_timeline } from '../utils/agency';
import { clearSelectedDocsAndReset } from '../utils/getSelected';
import { examine_error } from '../utils/errors';
import {
  categories_skipped_on_timeline,
  categories_skipped_on_search
} from '../../shared/utils/category';
import { get_search_view } from '../utils/search';
import _ from 'lodash';
import classnames from 'classnames';
import moment from 'moment';
import { diff } from 'lo-diff';
import {
  fetchDocuments,
  fetchDocumentsBefore,
  fetchDocumentsAfter,
  fetchFullDocuments,
  fetchCategories,
  setFirstTimelineView,
  changeSearchParams,
  changeExpandStatus,
  fetchSearchResults,
  changeDocumentView,
  openOverlay,
  closeOverlay,
  fetchMention,
  insightsStatusChange,
  hideEmptyTimeline,
  fetchFolders,
  fetchAgencies,
  fetchFollowedEntities,
  addContributorPoints,
  clearErrors,
  postSearchQuery,
  addBanner,
  clearSelectedItems,
  clearDocuments
} from '../../shared/actions';

// parameters that shouldn't be included in the search api calls
const NON_SEARCH_PARAMS = ['summary_id', 'summary_page', 'overlay', 'state_code_id'];

class Content extends React.Component {
  constructor(props) {
    super(props);

    this.load_start = Date.now();
    this.query_start = Date.now();

    this.state = {
      // FIXME: most of these should be moved to the store
      ...this.getDefaultScrollParams(),
      showTimeline: true
    };
  }

  componentWillMount() {
    const { query } = this.props.location;
    const query_params = this.getQueryParams(query, true);
    this.props.changeSearchParams(query_params);
    this.doInitialFetch(query_params);
  }

  componentWillReceiveProps(nextProps) {
    const { query: unfiltered_query, pathname, state } = nextProps.location;
    const query_params = this.getQueryParams(unfiltered_query, true);
    const isFetching =
      nextProps.documents.isFetching ||
      nextProps.search_results_filter.isFetching ||
      nextProps.search_results_relevance.isFetching;

    const next_filter_or_relevance =
      query_params.search_sort === 'date' ? 'search_results_filter' : 'search_results_relevance';
    // detect whether search and document calls will complete on the next cycle
    // this is the case if the current props has isFetching, but next props do not
    const searchFinished =
      this.props[next_filter_or_relevance].isFetching &&
      !nextProps[next_filter_or_relevance].isFetching;
    const documentsFinished = this.props.documents.isFetching && !nextProps.documents.isFetching;

    // initial fetch on page load or on filter change
    // do not include page change for search results
    const initialFetch =
      this.state.offset_before === 0 &&
      this.state.offset_after === 0 &&
      nextProps.current_view.search_params.offset === 0;

    const searchResults = query_params.search_sort ? nextProps[next_filter_or_relevance] : null;

    if (initialFetch) {
      this.doAnalytics(nextProps, searchFinished, documentsFinished, searchResults);
    }

    this.checkDocumentView(
      nextProps,
      initialFetch,
      documentsFinished,
      searchFinished,
      searchResults,
      query_params,
      state
    );
    this.detectChangeAndFetch(nextProps, query_params, pathname, isFetching, unfiltered_query);
    if (nextProps.location !== this.props.location) {
      if (!_.isNil(unfiltered_query.category) && unfiltered_query.category === 'News') {
        this.props.addContributorPoints('firstnewstab');
      } else {
        this.props.addContributorPoints('firsttimeline');
      }
    }
    //check for errors
    const errors = nextProps.errors;
    const error_banner_in_view =
      this.props.current_view.banner.type === 'error' && this.props.current_view.banner.display;

    if (errors.documents && errors.documents.length > 0 && !error_banner_in_view) {
      const err = errors.documents[0];
      const err_msg = (
        <div className="banner-alert-container">
          <h4 className="banner-text">{examine_error(err, 'documents').text}</h4>
        </div>
      );
      this.props.addBanner('error', true, err_msg);
    }
  }

  // normalize the query parameters
  // page_load=true for special handling of published_from
  getQueryParams(query, page_load = false) {
    const agency = query && query.agency ? query.agency : null;
    const category = query && query.category ? query.category : null;
    const read = query && query.read ? query.read : null;
    const read_folder_view = query && query.read_folder_view ? query.read_folder_view : null;
    const saved_searches_view =
      query && query.saved_searches_view ? query.saved_searches_view : null;
    const insights_view = query && query.insights_view ? query.insights_view : null;
    const bookmarked = query && query.bookmarked ? query.bookmarked : null;
    const key_date_to = query && query.key_date_to ? query.key_date_to : null;
    const key_date_from = query && query.key_date_from ? query.key_date_from : null;
    const published_to = query && query.published_to ? query.published_to : null;
    const published_from = query && query.published_from ? query.published_from : null;
    const compliance_to = query && query.compliance_to ? query.compliance_to : null;
    const compliance_from = query && query.compliance_from ? query.compliance_from : null;
    const comments_close_to = query && query.comments_close_to ? query.comments_close_to : null;
    const comments_close_from =
      query && query.comments_close_from ? query.comments_close_from : null;
    const search_query = query && query.search_query ? query.search_query : null;
    //special handling for folder view, there should be no limit on amount of
    //documents that should be returned
    let limit = parseInt(query && query.limit ? query.limit : 20, 10);
    if (query.folder_id) {
      limit = null;
    }
    const offset = parseInt(query && query.offset ? query.offset : 0, 10);
    const summary_id = query && query.summary_id ? parseInt(query.summary_id, 10) : null;
    const summary_page = query && query.summary_page ? query.summary_page : 'summary';
    const overlay = query && query.overlay ? query.overlay : null;

    // additional filters available via autocomplete
    const autosuggest_filter = query && query.autosuggest_filter ? query.autosuggest_filter : null;
    const autosuggest_mapper = query && query.autosuggest_mapper ? query.autosuggest_mapper : null;
    const regulation_id = query && query.regulation_id ? query.regulation_id : null;
    const act_id = query && query.act_id ? query.act_id : null;
    const docket_id = query && query.docket_id ? query.docket_id : null;
    const concept_id = query && query.concept_id ? query.concept_id : null;
    const citation_id = query && query.citation_id ? query.citation_id : null;
    const bank_id = query && query.bank_id ? query.bank_id : null;
    const more_like_doc_id = query && query.more_like_doc_id ? query.more_like_doc_id : null;
    const folder_id = query && query.folder_id ? query.folder_id : null;
    const folderTimelineView = query && query.folderTimelineView ? query.folderTimelineView : null;
    const search_sort = query && query.search_sort ? query.search_sort : null;
    const no_skipping = query && query.no_skipping ? query.no_skipping : null;
    const citation_selected_id =
      query && query.citation_selected_id ? query.citation_selected_id : null;
    const location_crumb_selected =
      query && query.location_crumb_selected ? query.location_crumb_selected : null;
    const topic_id = query && query.topic_id ? query.topic_id : null;
    const followed_sources = query && query.followed_sources ? query.followed_sources : null;
    const recent_activity_view =
      query && query.recent_activity_view ? query.recent_activity_view : null;
    return {
      agency,
      category,
      read,
      read_folder_view,
      bookmarked,
      published_to,
      published_from,
      compliance_to,
      compliance_from,
      comments_close_to,
      comments_close_from,
      key_date_to,
      key_date_from,
      search_query,
      limit,
      offset,
      summary_id,
      summary_page,
      overlay,
      autosuggest_filter,
      regulation_id,
      act_id,
      docket_id,
      concept_id,
      citation_id,
      bank_id,
      search_sort,
      more_like_doc_id,
      folder_id,
      folderTimelineView,
      autosuggest_mapper,
      no_skipping,
      citation_selected_id,
      location_crumb_selected,
      insights_view,
      saved_searches_view,
      topic_id,
      followed_sources,
      recent_activity_view
    };
  }

  getDefaultScrollParams() {
    return {
      offset_after: 0,
      offset_before: 0,
      expand_before_compliance_from: null
    };
  }

  detectChangeAndFetch(nextProps, query_params, pathname, isFetching, unfiltered_query) {
    if (isFetching) {
      return;
    }

    const showTimeline = !(
      query_params.search_sort ||
      query_params.autosuggest_filter ||
      query_params.more_like_doc_id
    );
    this.setState({ showTimeline });

    const { diff: changed } = diff(nextProps.current_view.search_params, query_params);
    // user changed data source, make sure we trigger a new api call
    // FIXME this should be replaced with batch agency updates
    const dataSourceChange =
      this.props.agencies.pending_updates > 0 && nextProps.agencies.pending_updates === 0;

    // now remove a few params that aren't related to the search call
    // this prevents unnecessary reloads
    for (const p of NON_SEARCH_PARAMS) {
      delete changed[p];
    }

    // NB: this check is crucial in context.router.push based state based updates
    if (_.size(changed) > 0 || dataSourceChange) {
      this.query_start = Date.now();

      //set insights graph state to current state.
      if (changed.insights_view) {
        const insights_status = !_.isNil(query_params.insights_view);
        this.props.insightsStatusChange(insights_status);
      }

      if (!query_params.search_sort) {
        // reset the timeline state
        this.setState(this.getDefaultScrollParams());
      }
      //check doc count and hide empty timeline as appropriate
      const doc_count = _.get(this.props.documents, 'count', 0);
      if (this.props.current_view.empty_timeline_view && doc_count > 0) {
        this.props.hideEmptyTimeline();
      }
      this.props.changeSearchParams(query_params);
      this.doInitialFetch(query_params);

      // reset scroll position to top in preparation of results loading
      // FIXME maybe should be handled separately in timeline and search results
      const resultsContainer = document.getElementsByClassName('document-search-list-container')[0];
      if (resultsContainer) {
        resultsContainer.scrollTop = 0;
      }
    } else if (nextProps.current_view.expand_list) {
      // scroll past upper or lower limits
      this.doExpandListFetch(nextProps, query_params);
    }
  }

  doAnalytics(nextProps, searchFinished, documentsFinished, searchResults) {
    if (documentsFinished || searchFinished) {
      if (this.load_start) {
        submit_timing(this.load_start, 'Dashboard', 'page_load', 'Page load time');
        safe_mixpanel_track('Dashboard – page_load – Page load time', {
          hitType: 'timing',
          timingCategory: 'Dashboard',
          timingVar: 'page_load',
          $duration: Date.now() - this.load_start,
          timingLabel: 'Page load time'
        });

        this.load_start = null;
      }
      submit_timing(this.query_start, 'Dashboard', 'query', 'Query time');
      safe_mixpanel_track('Dashboard – query – Query time', {
        hitType: 'timing',
        timingCategory: 'Dashboard',
        timingVar: 'query',
        $duration: Date.now() - this.query_start,
        timingLabel: 'Page load time'
      });
    }

    // send search results stats
    if (searchFinished) {
      const count = _.get(searchResults, 'results.count', 0);

      // TODO add reasonable switch here for filter-based results
      const query = nextProps.current_view.search_params.search_query;

      if (count > 0) {
        safe_analytics(
          'Search – Received Search Results',
          'Search',
          'Received Search Results',
          query
        );
      } else {
        safe_analytics('Search – Empty Search Results', 'Search', 'Empty Search Results', query);
      }

      // postSearchQuery keeps track of search term count
      if (!_.isNil(query)) {
        this.props.postSearchQuery({ search_args: { query } });
        return;
      }

      const params = nextProps.current_view.search_params;
      const entities = [
        'agency_id',
        'act_id',
        'regulation_id',
        'citation_id',
        'concept_id',
        'bank_id',
        'topic_id'
      ];
      for (const entity of entities) {
        if (!_.isNil(params[entity]) && typeof params[entity] !== 'object') {
          const searchQuery = {
            search_args: { [entity]: params[entity] }
          };
          this.props.postSearchQuery(searchQuery);
          return;
        }
      }
    }
    return;
  }

  // Resets application to its default state: Default right panel view (recent_activity),
  // empty search input (NO autosuggest dropdown), and NO selected items/doc action icons
  checkDocumentView(
    nextProps,
    initialFetch,
    documentsFinished,
    searchFinished,
    searchResults,
    query_params,
    state
  ) {
    const left_nav_view_update = nextProps.location.state
      ? nextProps.location.state.fromLeftNav
      : null;

    if (left_nav_view_update) {
      this.props.changeDocumentView('', null);
      navigateSummary(nextProps.location, this.context.router, null, '');
      clearSelectedDocsAndReset(nextProps, this.context.router);
      //clear Errors on view change
      if (!_.isEmpty(nextProps.location.errors)) {
        this.props.clearErrors(null);
      }

      return; // prevent updating a second time
    }

    //remove dashbaord graph tooltip if not in dashboard view
    if (this.props.location.pathname !== '/dashboard') {
      d3.selectAll('.nvtooltip').remove();
    }

    // search: this resets the document summary panel to its default state
    // if the document is not currently visible
    // do not remove the document if a "more like this" parameter is present
    // and the document summary view is showing the same document.

    // not limited to initial fetch because this is needed on changing page
    if (
      searchFinished &&
      (!nextProps.current_view.search_params.more_like_doc_id ||
        String(nextProps.current_view.search_params.more_like_doc_id) !==
          String(nextProps.current_view.id))
    ) {
      const documents = _.get(searchResults, 'results.documents', []);

      const hasDocument = _.some(documents, { id: nextProps.current_view.id });

      if (!hasDocument) {
        this.props.changeDocumentView('', null);
        navigateSummary(this.props.location, this.context.router, null, '');

        return; // prevent updating a second time
      }
    }

    // if a document summary id is in the url, set in the store EXCEPT if section changed
    if (
      query_params.summary_id !== nextProps.current_view.id ||
      query_params.summary_page !== nextProps.current_view.page
    ) {
      if (query_params.summary_id) {
        const page = query_params.summary_page || 'summary';
        this.props.changeDocumentView(page, query_params.summary_id);
      }
    }

    // open or close the overlay if it is in the URL
    if (query_params.overlay !== _.get(nextProps.current_view, 'overlay.name', null)) {
      if (query_params.overlay && nextProps.current_view.id) {
        this.props.openOverlay({
          name: query_params.overlay
        });
      } else if (nextProps.current_view.overlay) {
        // prevent loop
        this.props.closeOverlay();
      }
    }
  }

  // execute initial fetch on page load or filter change
  doInitialFetch(query_params) {
    if (query_params.bookmarked) {
      // default limit is 20 so arbitrarily high limit (500) is set.
      // TODO: make this dynamic
      query_params.limit = 500;
    }
    if (query_params.search_sort) {
      query_params.skip_category = categories_skipped_on_search;
      // search view
      this.props.fetchSearchResults(query_params);
      if (query_params.autosuggest_filter) {
        const filter = autosuggest_filter_mapping[query_params.autosuggest_filter].filter;
        if (!_.isNil(query_params[filter])) {
          this.props.fetchMention(query_params.autosuggest_filter, query_params[filter]);
        }
      } else if (query_params.more_like_doc_id) {
        // fetch the related document so we can populate the title
        // should only be necessary on initial page load
        // always do this for simplicity
        this.props.fetchFullDocuments({ id: query_params.more_like_doc_id }, true);
      }
    } else if (query_params.no_skipping) {
      //folder view and right panel card view
      this.props.fetchDocuments(query_params);
    } else {
      if (!this.props.user_folder.isFetching && !this.props.user_folder.open_folder_menu) {
        this.props.fetchFolders();
      }
      query_params.skip_agency = agencies_skipped_on_timeline;
      query_params.skip_category = categories_skipped_on_timeline;
      // timeline view
      this.props.fetchDocuments(query_params);
    }
    //makes sure we only fetch agencies and categories once, since they never change
    if (!this.props.agencies.isFetching && this.props.agencies.items.length === 0) {
      this.props.fetchAgencies(); // to populate list of agencies
      this.props.fetchAgencies(true); // fetch user followed agencies
      this.props.fetchAgencies(false, true); // fetch search_filter agencies
      // fetch user followed states
      this.props.fetchFollowedEntities({ entity_type: 'jurisdictions' });
    }
  }

  doExpandListFetch(nextProps, query_params) {
    const expand_list = nextProps.current_view.expand_list;
    const doc_list = nextProps.documents.combined_list;

    this.props.changeExpandStatus(null);
    const base_params = _.cloneDeep(query_params);

    /* short-circuit if scrolling on an empty doc list or in folder, read folder,
      or bookmarked folder view */
    if (
      doc_list.length === 0 ||
      query_params.folder_id ||
      query_params.bookmarked ||
      query_params.read_folder_view
    ) {
      return;
    }

    if (expand_list === 'after') {
      // handle older docs. here we need to figure out what the first date
      const compliance_to_str = nextProps.documents.oldest_dates['rule.effective_on'];
      const comments_close_to_str = nextProps.documents.oldest_dates['rule.comments_close_on'];
      let compliance_to = moment(compliance_to_str);
      let comments_close_to = moment(comments_close_to_str);

      // make sure that the compliance_to/comments_close_to values respect values
      // configured in key_date_to (if any)
      if (base_params.key_date_to) {
        const key_date_to = moment(base_params.key_date_to);
        if (compliance_to.isAfter(key_date_to)) {
          compliance_to = key_date_to;
        }
        if (comments_close_to.isAfter(key_date_to)) {
          comments_close_to = key_date_to;
        }
      }

      // if there was a key_date_from value configured, we need to ensure it gets passed to
      // the api here, otherwise it will get overriden
      let compliance_from = null;
      let comments_close_from = null;
      if (base_params.key_date_from) {
        compliance_from = moment(base_params.key_date_from).format('MM/DD/YYYY');
        comments_close_from = moment(base_params.key_date_from).format('MM/DD/YYYY');
      }

      // for published date, just keep following the offset
      const new_offset = this.state.offset_after + nextProps.current_view.search_params.limit;

      const extra_param_list = [
        { sort: 'publication_date', offset: new_offset },
        {
          sort: 'rule.effective_on',
          compliance_to: compliance_to.format('MM/DD/YYYY'),
          compliance_from
        },
        {
          sort: 'rule.comments_close_on',
          comments_close_to: comments_close_to.format('MM/DD/YYYY'),
          comments_close_from
        }
      ];

      this.setState({ offset_after: new_offset });
      base_params.skip_agency = agencies_skipped_on_timeline;
      base_params.skip_category = categories_skipped_on_timeline;
      this.props.fetchDocumentsAfter(base_params, extra_param_list);
    } else if (expand_list === 'before') {
      // handle newer docs. here we need to figure out what the last date
      const compliance_from_str = nextProps.documents.newest_dates['rule.effective_on'];
      const comments_close_to_str = nextProps.documents.newest_dates['rule.comments_close_on'];
      let compliance_from = moment(compliance_from_str);
      let comments_close_from = moment(comments_close_to_str);

      // make sure that the compliance_from/comments_close_from values respect values
      // configured in key_date_from (if any)
      if (base_params.key_date_from) {
        const key_date_from = moment(base_params.key_date_from);
        if (compliance_from.isBefore(key_date_from)) {
          compliance_from = key_date_from;
        }
        if (comments_close_from.isBefore(key_date_from)) {
          comments_close_from = key_date_from;
        }
      }

      // if there was a key_date_to value configured, we need to ensure it gets passed to
      // the api here, otherwise it will get overriden
      let compliance_to = null;
      let comments_close_to = null;
      if (base_params.key_date_to) {
        compliance_to = moment(base_params.key_date_to).format('MM/DD/YYYY');
        comments_close_to = moment(base_params.key_date_to).format('MM/DD/YYYY');
      }

      const new_offset = this.state.offset_before + nextProps.current_view.search_params.limit;
      this.setState({ offset_before: new_offset });

      const extra_param_list = [
        {
          compliance_from: compliance_from.format('MM/DD/YYYY'),
          compliance_to,
          order: 'asc',
          offset: new_offset,
          sort: 'rule.effective_on'
        },
        {
          comments_close_from: comments_close_from.format('MM/DD/YYYY'),
          comments_close_to,
          order: 'asc',
          offset: new_offset,
          sort: 'rule.comments_close_on'
        }
      ];

      base_params.skip_agency = agencies_skipped_on_timeline;
      base_params.skip_category = categories_skipped_on_timeline;
      // n.b. send before requests for each type of date so we can get upcoming deadlines for both
      this.props.fetchDocumentsBefore(base_params, extra_param_list);
    }
  }

  render() {
    const docsReady = !this.props.current_view.search_loading;
    let isLoading = false;

    const updatingSourceSelection = this.props.entities.pending_updates > 0;
    const updatingAgencySelection = this.props.agencies.pending_updates > 0;

    // show the loading overlay if documents or agencies are not ready
    if (
      !docsReady ||
      !this.props.agencies ||
      this.props.agencies.items.length === 0 ||
      updatingSourceSelection ||
      updatingAgencySelection
    ) {
      isLoading = true;
    }

    const timelineClasses = {
      'dashboard-timeline-container': true,
      'loading-overlay-light': true,
      'loading-active': isLoading,
      scroll: this.props.insights_graphs.insights_open
    };

    const { query } = this.props.location;

    const documentContainerClasses = {
      'document-list-container': true,
      'folder-view': query.folderTimelineView
    };
    /*

    Application dashboard view manager

    */
    const app_view = get_search_view(this.props.current_view.search_params);
    let timelineView = null;

    if (app_view.section === 'saved_searches') {
      timelineView = <SavedSearchesList location={this.props.location} />;
    } else if (app_view.section === 'search') {
      timelineView = <SearchResults location={this.props.location} isLoading={isLoading} />;
    } else {
      timelineView = ( //default timeline view
        <div className={classnames(timelineClasses)}>
          <div className={classnames(documentContainerClasses)}>
            <Timeline
              location={this.props.location}
              setFirstTimelineView={this.props.setFirstTimelineView}
              changeExpandStatus={this.props.changeExpandStatus}
              last_doc_ref={this.props.current_view.last_doc_ref}
              first_doc_ref={this.props.current_view.first_doc_ref}
            />
            {this.props.documents.isFetching && !isLoading ? <div className="loadingDocs" /> : null}
          </div>
        </div>
      );
    }

    return (
      <div className="dashboard-container" id={this.props.displayFilters ? 'disabled' : ''}>
        {timelineView}
      </div>
    );
  }
}

// classname to apply to top level container
Content.className = 'dashboard';

Content.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    documents: state.documents,
    documents_full: state.documents_full,
    agencies: state.agencies,
    entities: state.entities,
    user_folder: state.user_folder,
    categories: state.categories,
    errors: state.errors,
    current_view: state.current_view,
    search_results_relevance: state.search_results_relevance,
    search_results_filter: state.search_results_filter,
    insights_graphs: state.insights_graphs,
    displayFilters: state.current_view.displayFilters
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchDocuments: params => {
      return dispatch(fetchDocuments(params));
    },
    fetchFolders: () => {
      dispatch(fetchFolders());
    },
    fetchAgencies: (following, search_filter) => {
      dispatch(fetchAgencies(following, search_filter));
    },
    fetchFollowedEntities: params => {
      dispatch(fetchFollowedEntities(params));
    },
    fetchFullDocuments: (params, no_ready_update) => {
      dispatch(fetchFullDocuments(params, no_ready_update));
    },
    fetchSearchResults: (params, type) => {
      dispatch(fetchSearchResults(params, type));
    },
    fetchMention: (type, id_or_name) => {
      dispatch(fetchMention(type, id_or_name));
    },
    fetchDocumentsAfter: (params, extra_params) => {
      return dispatch(fetchDocumentsAfter(params, extra_params));
    },
    fetchDocumentsBefore: (params, extra_param_list) => {
      return dispatch(fetchDocumentsBefore(params, extra_param_list));
    },
    fetchCategories: () => {
      dispatch(fetchCategories());
    },
    setFirstTimelineView: value => {
      dispatch(setFirstTimelineView(value));
    },
    insightsStatusChange: status => {
      dispatch(insightsStatusChange(status));
    },
    changeSearchParams: params => {
      dispatch(changeSearchParams(params));
    },
    changeExpandStatus: (dir, refs) => {
      dispatch(changeExpandStatus(dir, refs));
    },
    openOverlay: data => {
      dispatch(openOverlay(data));
    },
    closeOverlay: () => {
      dispatch(closeOverlay());
    },
    clearErrors: component => {
      dispatch(clearErrors(component));
    },
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    hideEmptyTimeline: () => {
      dispatch(hideEmptyTimeline());
    },
    addContributorPoints: short_name => {
      dispatch(addContributorPoints(short_name));
    },
    postSearchQuery: query => {
      dispatch(postSearchQuery(query));
    },
    addBanner: (banner_type, banner_status, content) => {
      dispatch(addBanner(banner_type, banner_status, content));
    },
    clearDocuments: () => {
      dispatch(clearDocuments());
    }
  };
};

const ReduxContent = connect(mapStateToProps, mapDispatchToProps)(Content);

export default ReduxContent;
