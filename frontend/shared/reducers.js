import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import {
  CLEAR_DOCUMENTS,
  CHANGE_DOCUMENT_VIEW,
  SET_FIRST_TIMELINE_VIEW,
  CHANGE_SEARCH_PARAMS,
  CHANGE_SELECTED_ITEM,
  CHANGE_BULK_SELECTED_ITEM,
  SET_DOCS_TO_SELECT,
  CLEAR_SELECTED_ITEMS,
  CLEAR_BULK_SELECTED_ITEMS,
  INITIATE_PENDING_ACTION,
  COMPLETE_PENDING_ACTION,
  OPEN_OVERLAY,
  CLOSE_OVERLAY,
  REQUEST_DOCUMENTS,
  RECEIVE_DOCUMENTS,
  REQUEST_DOCUMENTS_AFTER,
  RECEIVE_DOCUMENTS_AFTER,
  REQUEST_DOCUMENTS_BEFORE,
  RECEIVE_DOCUMENTS_BEFORE,
  REQUEST_FULL_DOCUMENTS,
  RECEIVE_FULL_DOCUMENTS,
  ADD_ERROR,
  CLEAR_ERRORS,
  MARK_DOCUMENT_READ,
  MARK_DOCUMENT_BOOKMARKED,
  FOLLOW_AGENCIES,
  FOLLOWED_AGENCIES,
  REQUEST_ALL_USERS,
  RECEIVE_ALL_USERS,
  REQUEST_CURRENT_USER,
  RECEIVE_CURRENT_USER,
  MODIFY_CURRENT_USER,
  MODIFIED_CURRENT_USER,
  CLEAR_CURRENT_USER_UPDATED_STATE,
  REQUEST_AGENCIES,
  RECEIVE_AGENCIES,
  REQUEST_CATEGORIES,
  RECEIVE_CATEGORIES,
  REQUEST_INSIGHTS_GRAPH_DATA,
  RECEIVE_INSIGHTS_GRAPH_DATA,
  REQUEST_DOCKET_TIMELINE,
  RECEIVE_DOCKET_TIMELINE,
  REQUEST_RECENT_ACTIVITY,
  RECEIVE_RECENT_ACTIVITY,
  REQUEST_AUTO_COMPLETE,
  RECEIVE_AUTO_COMPLETE,
  CHANGE_EXPAND_STATUS,
  RECEIVE_SEARCH_RESULTS_RELEVANCE,
  REQUEST_SEARCH_RESULTS_RELEVANCE,
  SAVE_UNBOOKMARKED_DOCUMENT,
  REQUEST_SPECIFIED_USER,
  RECEIVE_SPECIFIED_USER,
  MODIFY_SPECIFIED_USER,
  MODIFIED_SPECIFIED_USER,
  CLEAR_AUTO_COMPLETE,
  REQUEST_SEARCH_RESULTS_FILTER,
  RECEIVE_SEARCH_RESULTS_FILTER,
  REQUEST_MENTION,
  RECEIVE_MENTION,
  REQUEST_FOLDERS,
  RECEIVE_FOLDERS,
  CHANGE_SELECTED_FOLDER,
  CLEAR_SELECTED_FOLDER,
  REQUEST_RELATED_DOCUMENT_COUNT,
  RECEIVE_RELATED_DOCUMENT_COUNT,
  REQUEST_FOLDER_DOCUMENTS,
  RECEIVE_FOLDER_DOCUMENTS,
  OPEN_FOLDER_MENU,
  CLOSE_FOLDER_MENU,
  REQUEST_TAGS,
  RECEIVE_TAGS,
  UPDATE_DOCUMENT_TAG,
  UPDATED_DOCUMENT_TAG,
  CLEAR_FOLDER_DOCUMENTS,
  REQUEST_STATISTICS,
  RECEIVE_STATISTICS,
  UPDATE_FOLDER_MODAL_STATUS,
  REQUEST_ALL_DOCUMENTS,
  RECEIVE_ALL_DOCUMENTS,
  FLAG_DOCUMENT,
  FLAGGED_DOCUMENT,
  REQUEST_SPIDER_NAMES,
  RECEIVE_SPIDER_NAMES,
  REQUEST_PROVENANCES,
  RECEIVE_PROVENANCES,
  CLEAR_STATE_CODE,
  UPDATE_DOCUMENT,
  DOCUMENT_UPDATED,
  REQUEST_GOOGLE_ANALYTICS_REPORTS,
  RECEIVE_GOOGLE_ANALYTICS_REPORTS,
  OPEN_SOURCE_SELECTION,
  CLOSE_SOURCE_SELECTION,
  REQUEST_FOLLOWED_ENTITIES,
  RECIEVE_FOLLOWED_ENTITIES,
  REQUEST_INCOMPLETE_DOCUMENTS,
  RECEIVE_INCOMPLETE_DOCUMENTS,
  SHOW_EMPTY_TIMELINE,
  HIDE_EMPTY_TIMELINE,
  REQUEST_USER_CREATED_DOCUMENTS,
  RECEIVE_USER_CREATED_DOCUMENTS,
  CREATE_DOCUMENT,
  DOCUMENT_CREATED,
  REQUEST_NEW_DOCUMENT_URL_HEADERS,
  RECEIVE_NEW_DOCUMENT_URL_HEADERS,
  REQUEST_MARKETING_CAMPAIGNS,
  RECIEVE_MARKETING_CAMPAIGNS,
  REQUEST_CAMPAIGN_DETAILS,
  RECIEVE_CAMPAIGN_DETAILS,
  REQUEST_SAVED_SEARCHES,
  RECEIVE_SAVED_SEARCHES,
  OPEN_WARNING_MODAL,
  CLOSE_WARNING_MODAL,
  REQUEST_ALL_ANNOTATION_TASKS,
  RECEIVE_ALL_ANNOTATION_TASKS,
  CREATE_ANNOTATION_TASK,
  ANNOTATION_TASK_CREATED,
  ANNOTATION_TASK_UPDATED,
  ANNOTATION_TASK_DELETED,
  DELETE_ANNOTATION_TASK,
  UPDATE_ANNOTATION_TASK,
  CLEAR_DOC_REF,
  ADD_NEW_FOLDER,
  NEW_FOLDER_ADDED,
  DISPLAY_FILTERS,
  HIDE_FILTERS,
  TOGGLE_FILTERS,
  REQUEST_ALL_PUBLICATIONS,
  RECEIVE_ALL_PUBLICATIONS,
  UPDATE_PUBLICATION,
  PUBLICATION_UPDATED,
  CLEAR_SAVED_SEARCHES,
  REQUEST_JURISDICTIONS,
  RECEIVE_JURISDICTIONS,
  CHANGE_SUBMENU_TARGET,
  REQUEST_SEARCH_QUERIES,
  RECEIVE_SEARCH_QUERIES,
  REQUEST_POPULAR_DOCS,
  RECEIVE_POPULAR_DOCS,
  REQUEST_POPULAR_SOURCES,
  RECEIVE_POPULAR_SOURCES,
  REQUEST_SIMPLE_DOCUMENTS,
  RECEIVE_SIMPLE_DOCUMENTS,
  SET_MOBILE,
  REQUEST_STATE_CODE,
  RECEIVE_STATE_CODE,
  REQUEST_CONTRIBUTOR_POINTS,
  RECEIVE_CONTRIBUTOR_POINTS,
  CREATE_SEARCH_QUERY,
  SEARCH_RESULT_RATED,
  HIGHLIGHT_SEARCH,
  REQUEST_HIDDEN_DOCUMENTS,
  RECEIVE_HIDDEN_DOCUMENTS,
  REQUEST_ANNOTATION_JOBS,
  RECEIVE_ANNOTATION_JOBS,
  CREATE_ANNOTATIONS_FOR_JOB,
  ANNOTATIONS_FOR_JOB_CREATED,
  REQUEST_TERM_SAMPLING_GROUPS,
  RECEIVE_TERM_SAMPLING_GROUPS,
  REQUEST_DOCUMENT_DETAILS,
  RECEIVE_DOCUMENT_DETAILS,
  CREATE_TERM_SAMPLING_GROUP,
  TERM_SAMPLING_GROUP_CREATED,
  UPDATE_TERM_SAMPLING_GROUP,
  TERM_SAMPLING_GROUP_UPDATED,
  REQUEST_ANNOTATION_STATISTICS,
  RECEIVE_ANNOTATION_STATISTICS,
  REQUEST_ALL_ANNOTATION_JOBS,
  RECEIVE_ALL_ANNOTATION_JOBS,
  REQUEST_SUBSCRIPTIONS,
  RECEIVE_SUBSCRIPTIONS,
  REQUEST_INSIGHTS_CSV,
  RECEIVE_INSIGHTS_CSV,
  REQUEST_ANNOTATION_JOB_BY_ID,
  RECEIVE_ANNOTATION_JOB_BY_ID,
  NEW_NOTIFICATIONS_STATUS,
  REQUEST_TOPICS,
  RECEIVE_TOPICS,
  REQUEST_CONTRIBUTOR_STATISTICS,
  RECEIVE_CONTRIBUTOR_STATISTICS,
  ADD_BANNER,
  REQUEST_CONTRIBUTOR_REVIEWS_COUNT,
  RECEIVE_CONTRIBUTOR_REVIEWS_COUNT,
  REQUEST_All_SKIPPED_ANNOTATIONS,
  RECEIVE_All_SKIPPED_ANNOTATIONS,
  REQUEST_ALL_SUBSCRIPTIONS,
  RECEIVE_ALL_SUBSCRIPTIONS,
  REQUEST_ALL_PLANS,
  RECEIVE_ALL_PLANS,
  REQUEST_ALL_TOPICS,
  RECEIVE_ALL_TOPICS,
  REQUEST_TOPICS_STATS,
  RECEIVE_TOPICS_STATS,
  REQUEST_TEAMS,
  RECEIVE_TEAMS,
  REQUEST_ALL_SHARED_FOLDER_DETAILS,
  RECEIVE_ALL_SHARED_FOLDER_DETAILS,
  DELETE_CONFIRM_FOLDER_OPEN,
  DELETE_CONFIRM_FOLDER_CLOSE,
  SHARE_FOLDER_MENU_OPEN,
  SHARE_FOLDER_MENU_CLOSE,
  COPY_FOLDER_MENU_OPEN,
  COPY_FOLDER_MENU_CLOSE,
  REQUEST_ALL_TEAM_MEMBERS,
  RECEIVE_ALL_TEAM_MEMBERS,
  REQUEST_ALL_SHARED_FOLDERS,
  RECEIVE_ALL_SHARED_FOLDERS,
  REQUEST_SEARCH_FILTER_AGENCIES,
  RECIEVE_SEARCH_FILTER_AGENCIES,
  SKIP_ONBOARDING,
  CLEAR_SKIP_ONBOARDING,
  REQUEST_ANNOTATION_TASK_TOPIC_GROUPS,
  RECEIVE_ANNOTATION_TASK_TOPIC_GROUPS,
  REQUEST_AGGREGATED_ANNOTATIONS,
  RECEIVE_AGGREGATED_ANNOTATIONS,
  OPEN_ADD_FOLDER_MENU,
  REQUEST_SOURCES,
  RECEIVE_SOURCES,
  CLOSE_ADD_FOLDER_MENU,
  REQUEST_SLOT_INFO_FOR_DOC,
  RECEIVE_SLOT_INFO_FOR_DOC
} from './actions';

const documents_initial_state = {
  isFetching: false,
  isReady: false,
  count: 0,
  combined_list: [],
  document_index: {},
  offset: 0,
  newest_dates: {},
  oldest_dates: {}
};

// store for timeline view
function documents(state = documents_initial_state, action) {
  const process_combined_documents = clear_current => {
    const metadata = {
      isReady: true,
      isFetching: false,
      newest_dates: {
        ...state.newest_dates
      },
      oldest_dates: {
        ...state.oldest_dates
      }
    };

    const combined_list = clear_current ? [] : state.combined_list;

    let combined_count = 0;

    const new_data = action.data;
    const sort_params = Object.keys(action.data);

    let document_index;

    if (clear_current) {
      document_index = {};

      for (const sort of sort_params) {
        document_index[sort] = {};
      }
    } else {
      document_index = _.cloneDeep(state.document_index);
    }

    // handles the publication_date sorted documents first, because we need various
    // values populated based on the entire set before making decisions about documents
    // sorted on other fields
    // TODO: can this be re-factored a so more code can be shared?
    const has_publication_date = sort_params.indexOf('publication_date') !== -1;
    let newest_publication_date = moment(state.newest_dates.publication_date || -10e9);
    let oldest_publication_date = state.oldest_dates.publication_date
      ? moment(state.oldest_dates.publication_date)
      : moment();
    let publication_doc_count = 0;

    // hash that keeps track of which doc id and sort date pairs we've already added to
    // our list, so that when a document has effective / comments / publication dates
    // that are the same, we don't display it more than once on that specific date
    const doc_id_sort_date_mapping = {};

    // requestDocumentBefore uses this combiner too, and does not use publication_date as a sort
    // field, so we need to skip it here
    if (has_publication_date) {
      for (const doc of action.data.publication_date.documents) {
        publication_doc_count += 1;

        // kind of weird, get doc.publication_date
        const sort_date = _.get(doc, 'publication_date');

        // occasionally the API returns documents that are missing the requested sort_date.
        // Usually happens with rule.effecitive_on
        if (!sort_date) {
          continue;
        }

        // skip duplicate documents
        if (document_index.publication_date[doc.id]) {
          continue;
        }

        const sort_date_moment = moment(sort_date);
        const doc_id_sort_date_key = doc.id + sort_date_moment.format('YYYY-MM-DD');

        // for publication date only, we need to make sure we track the oldest date
        // since for the other sort fields, we don't want to show any of these values (unless
        // there were no results for publication_date, i.e. this is the end)
        if (sort_date && sort_date_moment.isBefore(oldest_publication_date)) {
          oldest_publication_date = sort_date_moment;
          metadata.oldest_dates.publication_date = sort_date;
        }

        if (sort_date && sort_date_moment.isAfter(newest_publication_date)) {
          newest_publication_date = sort_date_moment;
          metadata.newest_dates.publication_date = sort_date;
        }

        doc.sort_date = sort_date;
        doc.sort_basis = 'publication_date';
        document_index.publication_date[doc.id] = true;
        combined_list.push(doc);
        combined_count++;
        doc_id_sort_date_mapping[doc_id_sort_date_key] = true;
      }
    }

    for (const sort of sort_params) {
      // publication_date handled specially first above
      if (sort === 'publication_date') {
        continue;
      }

      const cur_docs = action.data[sort].documents;
      let newest_date = moment(state.newest_dates[sort] || -10e9);
      let oldest_date = state.oldest_dates[sort] ? moment(state.oldest_dates[sort]) : moment();

      for (const doc of cur_docs) {
        // kind of weird, get doc.publication_date, doc.rule.effective_on, etc
        const sort_date = _.get(doc, sort);

        // occasionally the API returns documents that are missing the requested sort_date.
        // Usually happens with rule.effecitive_on
        if (!sort_date) {
          continue;
        }

        // skip duplicate documents
        if (document_index[sort][doc.id]) {
          continue;
        }

        const sort_date_moment = moment(sort_date);
        const doc_id_sort_date_key = doc.id + sort_date_moment.format('YYYY-MM-DD');

        // if any document retrieved on a query sorted by compliance_date or comments_close_date
        // has a document older than the oldest document sorted by publication_date, skip it
        // otherwise the user might see dates that diverge greatly from the timeline ordering
        // the oldest one that we do get gets marked below so we will always come back to these
        // everytime a user scrolls downwards, re-checking if they are in the range we care about
        // at that point.
        // n.b. the one exception being if there are no documents in the bottom-most scrolled
        // list of publication_date sorted documents, then we can just tack everything else
        // on the end
        if (
          sort_date &&
          sort_date_moment.isBefore(oldest_publication_date) &&
          publication_doc_count > 0
        ) {
          continue;
        }

        // if we have already seen this doc on this same sort date, we don't need to add it to the
        // list again, otherwise we'd end up with duplicates in the display
        if (doc_id_sort_date_mapping[doc_id_sort_date_key]) {
          continue;
        }

        if (sort_date && sort_date_moment.isAfter(newest_date)) {
          newest_date = sort_date_moment;
          metadata.newest_dates[sort] = sort_date;
        }

        // track the oldest dates so we can send date_to queries to the api to limit what we show
        if (sort_date && sort_date_moment.isBefore(oldest_date)) {
          oldest_date = sort_date_moment;
          metadata.oldest_dates[sort] = sort_date;
        }

        doc.sort_date = sort_date;
        doc.sort_basis = sort;

        document_index[sort][doc.id] = true;

        combined_list.push(doc);
        combined_count++;
        doc_id_sort_date_mapping[doc_id_sort_date_key] = true;
      }
    }

    // TODO potential optimization:
    // we can rely on the fact that each document list that we
    // receive from the api is already sorted. Instead of doing a O(N lgN)
    // sort after merging the arrays, we could do a O(N) merge operation.
    // Essentially this is half of a merge sort

    return _.assign({}, state, metadata, new_data, {
      count: combined_count,
      combined_list: _.orderBy(combined_list, 'sort_date', 'desc'),
      document_index
    });
  };

  switch (action.type) {
    case REQUEST_DOCUMENTS:
    case REQUEST_DOCUMENTS_AFTER:
    case REQUEST_DOCUMENTS_BEFORE: {
      return {
        ...state,
        offset: action.params.offset || 0,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_DOCUMENTS: {
      return process_combined_documents(true);
    }
    case RECEIVE_DOCUMENTS_BEFORE:
    case RECEIVE_DOCUMENTS_AFTER: {
      return process_combined_documents(false);
    }
    case CLEAR_DOCUMENTS: {
      // XXX make more targeted
      return _.cloneDeep(documents_initial_state);
    }
    case MARK_DOCUMENT_READ: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.combined_list, doc => {
        return _.includes(action.ids, doc.id);
      });

      for (const doc of my_docs) {
        doc.read = action.read_or_unread;
      }
      return new_state;
    }
    case MARK_DOCUMENT_BOOKMARKED: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.combined_list, doc => {
        return _.includes(action.ids, doc.id);
      });

      for (const doc of my_docs) {
        doc.bookmarked = action.bookmarked_status;
      }
      return new_state;
    }
    case UPDATE_DOCUMENT_TAG: // XXX add these when we support tag filtering
    case UPDATED_DOCUMENT_TAG:
    default: {
      return state;
    }
  }
}

// store for document details/summary view
const documents_full = (
  state = {
    isFetching: false,
    isReady: false,
    ids: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_FULL_DOCUMENTS: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_FULL_DOCUMENTS: {
      const new_ids = {};
      for (const document of action.documents) {
        new_ids[document.id] = document;
      }
      const new_state = {
        ...state,
        ids: {
          ...state.ids,
          ...new_ids
        }
      };

      if (!action.no_ready_update) {
        new_state.isFetching = false;
        new_state.isReady = true;
      }

      return new_state;
    }
    default: {
      return state;
    }
  }
};

// store for relevance-based search results
const search_results_relevance = (
  state = {
    isFetching: false,
    isReady: false,
    results: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SEARCH_RESULTS_RELEVANCE: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_SEARCH_RESULTS_RELEVANCE: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        results: action.data
      };
    }
    case MARK_DOCUMENT_READ: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.results.documents, doc => {
        return _.includes(action.ids, doc.id);
      });
      for (const doc of my_docs) {
        doc.read = action.read_or_unread;
      }
      return new_state;
    }
    case MARK_DOCUMENT_BOOKMARKED: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.results.documents, doc => {
        return _.includes(action.ids, doc.id);
      });
      for (const doc of my_docs) {
        doc.bookmarked = action.bookmarked_status;
      }
      return new_state;
    }
    default: {
      return state;
    }
  }
};

// store for date sorted filter-based search results
const search_results_filter = (
  state = {
    isFetching: false,
    isReady: false,
    results: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SEARCH_RESULTS_FILTER: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_SEARCH_RESULTS_FILTER: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        results: action.data
      };
    }
    case MARK_DOCUMENT_READ: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.results.documents, doc => {
        return _.includes(action.ids, doc.id);
      });
      for (const doc of my_docs) {
        doc.read = action.read_or_unread;
      }
      return new_state;
    }
    case MARK_DOCUMENT_BOOKMARKED: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.results.documents, doc => {
        return _.includes(action.ids, doc.id);
      });
      for (const doc of my_docs) {
        doc.bookmarked = action.bookmarked_status;
      }
      return new_state;
    }
    default: {
      return state;
    }
  }
};

const current_view = (
  state = {
    page: '',
    id: null,
    first_timeline_view: true,
    empty_timeline_view: false,
    open_search: false,
    expand_list: null,
    pending_action: {},
    overlay: null,
    folder_modal_status: false,
    source_modal_status: false,
    warning_modal: '',
    submenu_target: null,
    expanding_list: false,
    banner: {
      type: '',
      display: false,
      content: {},
      suppressCloseButton: false,
      err_type: ''
    },
    search_params: {
      agency: '',
      category: '',
      read: null,
      read_folder_view: null,
      saved_searches_view: null,
      no_skipping: null,
      bookmarked: null,
      //Date-picker react library requires the default state of these inputs to be an empty object
      compliance_from: {},
      compliance_to: {},
      comments_close_from: {},
      comments_close_to: {},
      published_from: {},
      published_to: {},
      //Date-picker react library requires the default state of these inputs to be an empty object
      search_query: null,
      autosuggest_filter: null,
      search_sort: null,
      limit: 20,
      offset: 0,
      folder_id: null,
      folderTimelineView: null,
      state_code_id: null,
      citation_selected_id: null,
      location_crumb_selected: null,
      insights_view: null,
      followed_sources: null,
      recent_activity_view: null
    },
    search_loading: false,
    selected_items: {},
    bulk_docs_selected: false,
    bulk: '',
    docs_to_select: {},
    unBookmarkedDocuments: {},
    displayFilters: false,
    inMobile: false,
    hightlightSearch: false,
    skipOnboarding: false
  },
  action
) => {
  switch (action.type) {
    case CHANGE_DOCUMENT_VIEW: {
      return {
        ...state,
        page: action.page,
        id: action.id,
        last_id: state.id,
        last_doc_ref: null,
        first_doc_ref: null
      };
    }
    case CHANGE_SEARCH_PARAMS: {
      const old_search_params = state.search_params;
      const new_search_params = {
        ...old_search_params,
        ...action.params
      };

      return {
        ...state,
        search_params: new_search_params,
        last_doc_ref: null,
        first_doc_ref: null,
        search_loading: true
      };
    }
    case CLEAR_DOC_REF: {
      return {
        ...state,
        first_doc_ref: null,
        last_doc_ref: null
      };
    }
    case CHANGE_EXPAND_STATUS: {
      const updated_state = {
        ...state,
        expand_list: action.dir
      };
      if (action.last_doc_ref) {
        updated_state.last_doc_ref = action.last_doc_ref;
        updated_state.first_doc_ref = null;
      } else if (action.first_doc_ref) {
        updated_state.first_doc_ref = action.first_doc_ref;
        updated_state.last_doc_ref = null;
      }
      return updated_state;
    }
    case SET_FIRST_TIMELINE_VIEW: {
      return {
        ...state,
        first_timeline_view: action.value
      };
    }
    case CHANGE_BULK_SELECTED_ITEM: {
      let selected_items = { ...state.selected_items };
      const docs_to_select_items = state.docs_to_select.items;
      if (action.value) {
        docs_to_select_items.forEach(x => {
          selected_items[x.id] = true;
        });
      } else {
        selected_items = {};
      }

      return {
        ...state,
        bulk_docs_selected: action.value,
        bulk: action.bulk,
        selected_items
      };
    }
    case SET_DOCS_TO_SELECT: {
      return {
        ...state,
        docs_to_select: action.docs_to_select
      };
    }
    case CHANGE_SELECTED_ITEM: {
      const selected_items = { ...state.selected_items };
      if (action.value) {
        selected_items[action.id] = true;
      } else {
        delete selected_items[action.id];
      }
      return {
        ...state,
        selected_items
      };
    }
    case CLEAR_BULK_SELECTED_ITEMS: {
      return {
        ...state,
        bulk_docs_selected: false,
        bulk: '',
        selected_items: {}
      };
    }
    case CLEAR_SELECTED_ITEMS: {
      return {
        ...state,
        bulk_docs_selected: false,
        bulk: '',
        selected_items: {}
      };
    }
    case INITIATE_PENDING_ACTION: {
      return {
        ...state,
        pending_action: {
          ...action.data
        }
      };
    }
    case COMPLETE_PENDING_ACTION: {
      return {
        ...state,
        pending_action: {}
      };
    }
    case OPEN_OVERLAY: {
      return {
        ...state,
        overlay: {
          ...action.data
        }
      };
    }
    case CLOSE_OVERLAY: {
      return {
        ...state,
        overlay: null
      };
    }
    case SAVE_UNBOOKMARKED_DOCUMENT: {
      const unBookmarkedDocuments = { ...state.unBookmarkedDocuments };
      unBookmarkedDocuments[action.id] = true;
      return {
        ...state,
        unBookmarkedDocuments
      };
    }
    case OPEN_SOURCE_SELECTION: {
      return {
        ...state,
        source_modal_status: true
      };
    }
    case CLOSE_SOURCE_SELECTION: {
      return {
        ...state,
        source_modal_status: false
      };
    }
    case OPEN_WARNING_MODAL: {
      return {
        ...state,
        warning_modal: action.modal
      };
    }
    case CLOSE_WARNING_MODAL: {
      return {
        ...state,
        warning_modal: ''
      };
    }
    case RECEIVE_SEARCH_RESULTS_RELEVANCE:
    case RECEIVE_SEARCH_RESULTS_FILTER:
    case RECEIVE_DOCUMENTS:
    case RECEIVE_STATE_CODE: {
      return {
        ...state,
        search_loading: false
      };
    }
    case UPDATE_FOLDER_MODAL_STATUS: {
      return {
        ...state,
        folder_modal_status: action.status
      };
    }
    case SHOW_EMPTY_TIMELINE: {
      return {
        ...state,
        empty_timeline_view: true
      };
    }
    case HIDE_EMPTY_TIMELINE: {
      return {
        ...state,
        empty_timeline_view: false
      };
    }
    case REQUEST_DOCUMENTS: {
      return {
        ...state,
        expanding_list: false
      };
    }
    case REQUEST_DOCUMENTS_AFTER:
    case REQUEST_DOCUMENTS_BEFORE: {
      return {
        ...state,
        expanding_list: true
      };
    }
    case DISPLAY_FILTERS: {
      return {
        ...state,
        displayFilters: true
      };
    }
    case HIDE_FILTERS: {
      return {
        ...state,
        displayFilters: false
      };
    }
    case TOGGLE_FILTERS: {
      return {
        ...state,
        displayFilters: !state.displayFilters
      };
    }
    case CHANGE_SUBMENU_TARGET: {
      return {
        ...state,
        submenu_target: action.target
      };
    }
    case SET_MOBILE: {
      return {
        ...state,
        inMobile: action.bool
      };
    }
    case HIGHLIGHT_SEARCH: {
      return {
        ...state,
        highlightSearch: !state.highlightSearch
      };
    }
    case ADD_BANNER: {
      let content = action.content;

      if (typeof action.content === 'string') {
        content = (
          <div className="banner-alert-container">
            <h4 className="banner-text">{action.content}</h4>
          </div>
        );
      }
      return {
        ...state,
        banner: {
          type: action.banner_type,
          display: action.banner_status,
          content,
          suppressCloseButton: action.suppressCloseButton
        }
      };
    }
    case SKIP_ONBOARDING: {
      return {
        ...state,
        skipOnboarding: true
      };
    }
    case CLEAR_SKIP_ONBOARDING: {
      return {
        ...state,
        skipOnboarding: false
      };
    }
    default: {
      return state;
    }
  }
};

const error = (state, action) => {
  switch (action.type) {
    case ADD_ERROR:
      state = state || [];
      return [...state, action.error];
    default:
      return state;
  }
};

const errors = (state = {}, action) => {
  switch (action.type) {
    case ADD_ERROR:
      return {
        ...state,
        [action.component]: error(state[action.component], action)
      };
    case CLEAR_ERRORS: {
      if (action.component) {
        const new_state = { ...state };
        delete new_state[action.component];

        return new_state;
      }
      return {};
    }
    default:
      return state;
  }
};

const current_user = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    user: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_CURRENT_USER:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_CURRENT_USER:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        user: action.user,
        updated: false
      };
    case MODIFY_CURRENT_USER:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case MODIFIED_CURRENT_USER:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        user: action.user || state.user // error state if action.user is null
      };
    case CLEAR_CURRENT_USER_UPDATED_STATE:
      return {
        ...state,
        updated: false
      };
    default:
      return state;
  }
};

const all_users = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    users: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_USERS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ALL_USERS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        users: action.users,
        updated: false
      };
    default:
      return state;
  }
};

const all_annotation_tasks = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    annotation_tasks: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_ANNOTATION_TASKS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ALL_ANNOTATION_TASKS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        annotation_tasks: action.annotation_tasks,
        updated: false
      };
    default:
      return state;
  }
};

const annotation_task_topic_groups = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    annotation_task_topic_groups: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ANNOTATION_TASK_TOPIC_GROUPS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_ANNOTATION_TASK_TOPIC_GROUPS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        annotation_task_topic_groups: action.annotation_task_topic_groups
      };
    default:
      return state;
  }
};

const all_publications = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    publications: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_PUBLICATIONS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ALL_PUBLICATIONS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        publications: action.publications,
        updated: false
      };
    default:
      return state;
  }
};

const all_statistics = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    statistics: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_STATISTICS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_STATISTICS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        statistics: action.statistics,
        updated: false
      };
    default:
      return state;
  }
};

//seperate documents store for admin document editing interface
const all_documents = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    alldocuments: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_DOCUMENTS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ALL_DOCUMENTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.alldocuments,
        updated: false
      };
    default:
      return state;
  }
};

//seperate documents store for admin document editing interface
const incomplete_documents = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_INCOMPLETE_DOCUMENTS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_INCOMPLETE_DOCUMENTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.incomplete_documents,
        updated: false
      };
    default:
      return state;
  }
};

const google_analytics = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    reports: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_GOOGLE_ANALYTICS_REPORTS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_GOOGLE_ANALYTICS_REPORTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        reports: action.reports,
        updated: false
      };
    default:
      return state;
  }
};

const specified_user = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    user: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SPECIFIED_USER:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_SPECIFIED_USER:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        user: action.user,
        updated: false
      };
    case MODIFY_SPECIFIED_USER:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case MODIFIED_SPECIFIED_USER:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        user: action.user || state.user // error state if action.user is null
      };
    case CLEAR_CURRENT_USER_UPDATED_STATE:
      return {
        ...state,
        updated: false
      };
    default:
      return state;
  }
};

const flagged_document = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    document: {}
  },
  action
) => {
  switch (action.type) {
    case FLAG_DOCUMENT:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case FLAGGED_DOCUMENT:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        document: action.document || state.document
      };
    default:
      return state;
  }
};

const updated_document = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    document: {}
  },
  action
) => {
  switch (action.type) {
    case UPDATE_DOCUMENT:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case DOCUMENT_UPDATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        document: action.document || state.document
      };
    default:
      return state;
  }
};

const user_folder = (
  state = {
    isFetching: false,
    isReady: false,
    personal_folders: [],
    shared_folders: [],
    selected_folder: {},
    documents: {},
    open_folder_menu: false,
    add_folder_menu_open: false,
    new_folder_being_added: false,
    shared_folder_users: [],
    shared_folder_permissions: [],
    user_shared_folders_dict: [],
    delete_confirm_open: false,
    share_folder_menu_open: false,
    copy_folder_menu_open: false,
    addSharedMenu: false,
    updateSharedFolder: false,
    shared_menu: ''
  },
  action
) => {
  switch (action.type) {
    case REQUEST_FOLDERS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_FOLDERS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        personal_folders: action.personal_folders,
        shared_folders: action.shared_folders
      };
    case REQUEST_FOLDER_DOCUMENTS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_FOLDER_DOCUMENTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        documents: action.data
      };
    case CLEAR_FOLDER_DOCUMENTS:
      return {
        ...state,
        documents: {}
      };
    case CHANGE_SELECTED_FOLDER:
      return {
        ...state,
        selected_folder: action.folder
      };
    case CLEAR_SELECTED_FOLDER:
      return {
        ...state,
        selected_folder: {}
      };
    case OPEN_FOLDER_MENU:
      return {
        ...state,
        open_folder_menu: true
      };
    case CLOSE_FOLDER_MENU:
      return {
        ...state,
        open_folder_menu: false
      };
    case OPEN_ADD_FOLDER_MENU:
      return {
        ...state,
        add_folder_menu_open: true
      };
    case CLOSE_ADD_FOLDER_MENU:
      return {
        ...state,
        add_folder_menu_open: false
      };
    case ADD_NEW_FOLDER:
      return {
        ...state,
        new_folder_being_added: true
      };
    case NEW_FOLDER_ADDED:
      return {
        ...state,
        new_folder_being_added: false
      };
    case DELETE_CONFIRM_FOLDER_OPEN:
      return {
        ...state,
        delete_confirm_open: true
      };
    case DELETE_CONFIRM_FOLDER_CLOSE:
      return {
        ...state,
        delete_confirm_open: false
      };
    case SHARE_FOLDER_MENU_OPEN:
      return {
        ...state,
        share_folder_menu_open: true,
        shared_menu: action.menu
      };
    case SHARE_FOLDER_MENU_CLOSE:
      return {
        ...state,
        share_folder_menu_open: false,
        shared_menu: action.menu
      };
    case COPY_FOLDER_MENU_OPEN:
      return {
        ...state,
        copy_folder_menu_open: true
      };
    case COPY_FOLDER_MENU_CLOSE:
      return {
        ...state,
        copy_folder_menu_open: false
      };
    case REQUEST_ALL_SHARED_FOLDER_DETAILS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_ALL_SHARED_FOLDER_DETAILS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        shared_folder_permissions: action.shared_folder_permissions,
        shared_folder_users: action.shared_folder_users
      };
    case REQUEST_ALL_SHARED_FOLDERS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_ALL_SHARED_FOLDERS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        user_shared_folders_dict: action.user_shared_folders_dict
      };
    default:
      return state;
  }
};

const agencies = (
  state = {
    isFetching: false,
    isReady: false,
    pending_updates: 0,
    items: [],
    followed_agencies: [],
    search_filter_agencies: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_AGENCIES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_AGENCIES: {
      let key = 'items';
      if (action.following) {
        key = 'followed_agencies';
      }

      return {
        ...state,
        isFetching: false,
        isReady: true,
        [key]: action.agencies
      };
    }
    case REQUEST_SEARCH_FILTER_AGENCIES: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECIEVE_SEARCH_FILTER_AGENCIES: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        search_filter_agencies: action.agencies
      };
    }
    case FOLLOW_AGENCIES: {
      return {
        ...state,
        pending_updates: state.pending_updates + 1
      };
    }
    case FOLLOWED_AGENCIES: {
      // relies on a new fetch to update store
      return {
        ...state,
        pending_updates: state.pending_updates - 1
      };
    }
    default:
      return state;
  }
};

const entities = (
  state = {
    isFetching: false,
    isReady: false,
    pending_updates: 0,
    followed_entities: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_FOLLOWED_ENTITIES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECIEVE_FOLLOWED_ENTITIES: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        followed_entities: action.followed_entities
      };
    }
    default:
      return state;
  }
};

const categories = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_CATEGORIES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_CATEGORIES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.categories
      };
    default:
      return state;
  }
};

const spider_names = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SPIDER_NAMES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_SPIDER_NAMES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.spidernames
      };
    default:
      return state;
  }
};

const provenances = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_PROVENANCES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_PROVENANCES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.provenances
      };
    default:
      return state;
  }
};

const tags = (
  state = {
    isFetching: false,
    isReady: false,
    by_id: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_TAGS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_TAGS: {
      const { user, system } = action.response;

      const by_id = {
        ..._.keyBy(user, 'id'),
        ..._.keyBy(system, 'id')
      };
      return {
        isFetching: false,
        isReady: true,
        by_id
      };
    }
    default:
      return state;
  }
};

const insights_graphs = (
  state = {
    isFetching: false,
    isReady: false,
    act_enforcement_matrix: {},
    rules_by_quarter: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_INSIGHTS_GRAPH_DATA:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_INSIGHTS_GRAPH_DATA: {
      const new_data = {};

      action.aggregations.forEach((agg, i) => {
        new_data[agg] = action.data[i];
      });

      return {
        ...state,
        ...new_data,
        isFetching: false,
        isReady: true
      };
    }
    default:
      return state;
  }
};

const autocompletes = (
  state = {
    isFetching: false,
    isReady: false,
    items: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_AUTO_COMPLETE:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_AUTO_COMPLETE:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.autocompletes
      };
    case CLEAR_AUTO_COMPLETE:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: {}
      };
    default:
      return state;
  }
};

const docket_timeline = (
  state = {
    isFetching: false,
    isReady: false,
    document_id: null,
    dockets: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_DOCKET_TIMELINE: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_DOCKET_TIMELINE: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        dockets: action.dockets
      };
    }
    default: {
      return state;
    }
  }
};

const recent_activity = (
  state = {
    isFetching: false,
    isReady: false,
    document_stats: [],
    total_updates: null
  },
  action
) => {
  switch (action.type) {
    case REQUEST_RECENT_ACTIVITY: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_RECENT_ACTIVITY: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        document_stats: action.document_stats,
        total_updates: action.total_updates
      };
    }
    default: {
      return state;
    }
  }
};

const filtered_mention = (
  state = {
    isFetching: false,
    isReady: false,
    mention: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_MENTION:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_MENTION:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        mention: action.mention
      };
    default:
      return state;
  }
};

const user_created_documents = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    user_created_documents: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_USER_CREATED_DOCUMENTS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_USER_CREATED_DOCUMENTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.user_created_documents,
        updated: false
      };
    default:
      return state;
  }
};

const create_document = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    document: {}
  },
  action
) => {
  switch (action.type) {
    case CREATE_DOCUMENT:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case DOCUMENT_CREATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        document: action.document || state.document
      };
    default:
      return state;
  }
};

const annotation_task = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    isDeleting: false,
    updated: false,
    annotation_task: {},
    statistics: {},
    contributor_statistics: {}
  },
  action
) => {
  switch (action.type) {
    case CREATE_ANNOTATION_TASK:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case ANNOTATION_TASK_CREATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        annotation_task: action.annotation_task || state.annotation_task
      };

    case UPDATE_ANNOTATION_TASK:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case ANNOTATION_TASK_UPDATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        annotation_task: action.annotation_task || state.annotation_task
      };
    case DELETE_ANNOTATION_TASK:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isDeleting: true,
        updated: false
      };
    case ANNOTATION_TASK_DELETED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isDeleting: false,
        updated: true,
        annotation_task: null
      };
    case REQUEST_ANNOTATION_STATISTICS:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case RECEIVE_ANNOTATION_STATISTICS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        statistics: action.statistics
      };
    case REQUEST_CONTRIBUTOR_STATISTICS:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case RECEIVE_CONTRIBUTOR_STATISTICS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        contributor_statistics: action.contributor_statistics
      };
    default:
      return state;
  }
};

const publication = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    annotation_task: {}
  },
  action
) => {
  switch (action.type) {
    case UPDATE_PUBLICATION:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case PUBLICATION_UPDATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        publication: action.publication || state.publication
      };
    default:
      return state;
  }
};

const new_document_url_headers = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    headers: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_NEW_DOCUMENT_URL_HEADERS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_NEW_DOCUMENT_URL_HEADERS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.headers,
        updated: false
      };
    default:
      return state;
  }
};

const marketing = (
  state = {
    isFetching: false,
    isReady: false,
    campaigns: {},
    details: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_MARKETING_CAMPAIGNS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECIEVE_MARKETING_CAMPAIGNS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        campaigns: action.campaigns
      };
    case REQUEST_CAMPAIGN_DETAILS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECIEVE_CAMPAIGN_DETAILS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        details: action.details
      };
    default:
      return state;
  }
};

const saved_searches = (
  state = {
    isFetching: false,
    isReady: false,
    saved_searches: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SAVED_SEARCHES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_SAVED_SEARCHES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        saved_searches: action.saved_searches
      };
    case CLEAR_SAVED_SEARCHES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        saved_searches: []
      };
    default:
      return state;
  }
};

const jurisdictions = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_JURISDICTIONS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_JURISDICTIONS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.jurisdictions
      };
    default:
      return state;
  }
};

const search_queries = (
  state = {
    isFetching: false,
    isReady: false,
    search_queries: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SEARCH_QUERIES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_SEARCH_QUERIES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        search_queries: action.search_queries
      };
    default:
      return state;
  }
};

const us_state = (
  state = {
    isFetching: false,
    isReady: false,
    codes: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_STATE_CODE: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_STATE_CODE: {
      const state_code_ids = {};
      for (const branch of action.branches) {
        state_code_ids[branch.id] = branch;
      }

      const new_state = {
        ...state,
        isFetching: false,
        isReady: true,
        codes: {
          ...state.codes,
          ...state_code_ids
        }
      };

      return new_state;
    }
    case MARK_DOCUMENT_READ: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.codes, code => {
        return _.includes(action.ids, code.id);
      });
      for (const doc of my_docs) {
        doc.read = action.read_or_unread;
      }

      for (const id of Object.keys(new_state.codes)) {
        const doc = new_state.codes[id];
        const my_children = _.filter(doc.children, { id: action.id });

        for (const child of my_children) {
          child.read = action.read_or_unread;
        }
      }

      return new_state;
    }
    case CLEAR_STATE_CODE: {
      return {
        ...state,
        codes: {}
      };
    }
    default:
      return state;
  }
};

const popular_docs = (
  state = {
    isFetching: false,
    isReady: false,
    popular_docs: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_POPULAR_DOCS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_POPULAR_DOCS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        popular_docs: action.popular_docs
      };
    default:
      return state;
  }
};

const popular_sources = (
  state = {
    isFetching: false,
    isReady: false,
    popular_sources: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_POPULAR_SOURCES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_POPULAR_SOURCES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        popular_sources: action.popular_sources
      };
    default:
      return state;
  }
};

const recent_documents = (
  state = {
    isFetching: false,
    isReady: false,
    recent_documents: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SIMPLE_DOCUMENTS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_SIMPLE_DOCUMENTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        recent_documents: action.recent_documents
      };
    default:
      return state;
  }
};

const user_vote = (
  state = {
    search_args: {},
    voted_docs: {}
  },
  action
) => {
  switch (action.type) {
    case CREATE_SEARCH_QUERY: {
      return {
        ...state,
        search_args: action.search_args
      };
    }
    case SEARCH_RESULT_RATED: {
      const voted_document = {};
      voted_document[action.doc_id] = {
        relevance: action.is_relevant,
        search_args: action.search_args
      };

      return {
        ...state,
        voted_docs: {
          ...state.voted_docs,
          ...voted_document
        }
      };
    }
    default:
      return state;
  }
};

const contributor_points = (
  state = {
    isFetching: false,
    isReady: false,
    scores: { onboarding: {}, anytime: {}, weekly: {} },
    contributor_point_types: [],
    contributor_points: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_CONTRIBUTOR_POINTS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_CONTRIBUTOR_POINTS: {
      // group the possible points in an object
      const contributorPointTypes = action.data.contributor_point_types;
      const scores = contributorPointTypes.reduce((mem, pointType) => {
        const group = pointType.frequency;
        if (_.isNil(mem[group])) {
          mem[group] = { possibleTotalPoints: 0, totalPoints: 0 };
        } else {
          mem[group].possibleTotalPoints += pointType.points_per_action;
        }
        const subgroup = pointType.point_group_name;
        if (_.isNil(mem[group][subgroup])) {
          mem[group][subgroup] = { possiblePoints: pointType.points_per_action, points: 0 };
        } else {
          mem[group][subgroup].possiblePoints += pointType.points_per_action;
        }
        return mem;
      }, {});

      // adds points to scores object
      // a table used to look up point type by its id
      const contributorPointTypesTable = contributorPointTypes.reduce((mem, pointType) => {
        mem[pointType.id] = pointType;
        return mem;
      }, {});
      const contributorPoints = action.data.contributor_points;
      Object.keys(contributorPoints).forEach(group => {
        contributorPoints[group].reduce((mem, point) => {
          const pointType = contributorPointTypesTable[point.contributor_point_type_id];
          mem[group].totalPoints += point.num_points;
          if (!_.isNil(mem[group][pointType.point_group_name].points)) {
            mem[group][pointType.point_group_name].points += point.num_points;
          }
          return mem;
        }, scores);
      });
      return {
        ...state,
        isFetching: false,
        isReady: true,
        ...action.data,
        scores
      };
    }
    default:
      return state;
  }
};

const hidden_documents = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    hidden_documents: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_HIDDEN_DOCUMENTS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_HIDDEN_DOCUMENTS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.hidden_documents,
        updated: false
      };
    default:
      return state;
  }
};

const annotation_jobs = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    annotation_jobs: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ANNOTATION_JOBS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ANNOTATION_JOBS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.annotation_jobs,
        updated: false
      };
    case REQUEST_ANNOTATION_JOB_BY_ID:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ANNOTATION_JOB_BY_ID:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.annotation_jobs,
        updated: false
      };
    default:
      return state;
  }
};

const annotations_for_job = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    annotations_for_job: {}
  },
  action
) => {
  switch (action.type) {
    case CREATE_ANNOTATIONS_FOR_JOB:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case ANNOTATIONS_FOR_JOB_CREATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        document: action.annotations_for_job
      };
    default:
      return state;
  }
};

const term_sampling_groups = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_TERM_SAMPLING_GROUPS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_TERM_SAMPLING_GROUPS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.term_sampling_groups
      };
    default:
      return state;
  }
};

const term_sampling_group = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    term_sampling_group: {}
  },
  action
) => {
  switch (action.type) {
    case CREATE_TERM_SAMPLING_GROUP:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case TERM_SAMPLING_GROUP_CREATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        term_sampling_group: action.term_sampling_group || state.term_sampling_group
      };

    case UPDATE_TERM_SAMPLING_GROUP:
      return {
        ...state,
        isFetching: false,
        isReady: false,
        isUpdating: true,
        updated: false
      };
    case TERM_SAMPLING_GROUP_UPDATED:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        isUpdating: false,
        updated: true,
        annotation_task: action.term_sampling_group || state.term_sampling_group
      };
    default:
      return state;
  }
};

const document_details = (
  state = {
    isFetching: false,
    isReady: false,
    documents: {},
    related_count: {} //by id
  },
  action
) => {
  switch (action.type) {
    case REQUEST_DOCUMENT_DETAILS: {
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    }
    case RECEIVE_DOCUMENT_DETAILS: {
      const new_documents = {};
      new_documents[action.document.id] = action.document;

      const new_state = {
        ...state,
        isFetching: false,
        isReady: true,
        documents: {
          ...state.documents,
          ...new_documents
        }
      };
      return new_state;
    }
    case REQUEST_RELATED_DOCUMENT_COUNT: {
      // don't hold up loading waiting for this count
      return {
        ...state
      };
    }
    case RECEIVE_RELATED_DOCUMENT_COUNT: {
      const doc_id = action.params.more_like_doc_id;
      const count = _.get(action.response, 'count', 0);

      return {
        ...state,
        related_count: {
          ...state.related_count,
          [doc_id]: count
        }
      };
    }
    case UPDATE_DOCUMENT_TAG: {
      const { doc_id, tag_id, tag_status, tag_name } = action;

      let new_tags;

      if (tag_status) {
        new_tags = [...state.documents[doc_id].tags, [tag_id, tag_name]];
      } else {
        new_tags = _.reject(state.documents[doc_id].tags, t => t[0] === tag_id);
      }

      const updated_doc = {
        ...state.documents[doc_id],
        tags: new_tags
      };

      return {
        ...state,
        documents: {
          ...state.documents,
          [doc_id]: updated_doc
        }
      };
    }
    case UPDATED_DOCUMENT_TAG: {
      // XXX optimistic update only
      return state;
    }
    case MARK_DOCUMENT_READ: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.documents, doc => {
        return _.includes(action.ids, doc.id);
      });
      for (const doc of my_docs) {
        doc.read = action.read_or_unread;
      }

      for (const id of Object.keys(new_state.documents)) {
        const doc = new_state.documents[id];
        const my_children = _.filter(doc.children, { id: action.id });

        for (const child of my_children) {
          child.read = action.read_or_unread;
        }
      }

      return new_state;
    }
    case MARK_DOCUMENT_BOOKMARKED: {
      const new_state = _.cloneDeep(state); // XXX more targeted
      const my_docs = _.filter(new_state.documents, doc => {
        return _.includes(action.ids, doc.id);
      });
      for (const doc of my_docs) {
        doc.bookmarked = action.bookmarked_status;
      }

      for (const id of Object.keys(new_state.documents)) {
        const doc = new_state.documents[id];
        const my_children = _.filter(doc.children, { id: action.id });

        for (const child of my_children) {
          child.bookmarked = action.bookmarked_status;
        }
      }

      return new_state;
    }
    default:
      return state;
  }
};

const all_annotation_jobs = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    all_annotation_jobs: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_ANNOTATION_JOBS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ALL_ANNOTATION_JOBS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.all_annotation_jobs,
        updated: false
      };
    default:
      return state;
  }
};
const subscriptions = (
  state = {
    isFetching: false,
    isReady: false,
    subscriptions: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SUBSCRIPTIONS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_SUBSCRIPTIONS: {
      const decoratedSubscriptions = action.subscriptions.map(subscription => {
        subscription.expirationDate = moment(subscription.expiration_date).format('l');
        if (subscription.latest) {
          subscription.within10dayofExpiration = moment().isAfter(
            moment(subscription.expirationDate).subtract(10, 'days')
          );
        }
        subscription.nextBillDate = subscription.next_bill_date
          ? moment.unix(subscription.next_bill_date).format('l')
          : '';
        return subscription;
      });
      return {
        ...state,
        isFetching: false,
        isReady: true,
        subscriptions: decoratedSubscriptions
      };
    }
    default:
      return state;
  }
};

const insights_csv = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    insights_csv: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_INSIGHTS_CSV:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_INSIGHTS_CSV:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.insights_csv,
        updated: false
      };
    default:
      return state;
  }
};

//store to track new notifications
const notifications = (
  state = {
    status: { timeline: false, news: false }
  },
  action
) => {
  switch (action.type) {
    case NEW_NOTIFICATIONS_STATUS:
      return {
        ...state,
        status: {
          ...state.status,
          ...action.latest_stats
        }
      };
    default:
      return state;
  }
};

const topics = (
  state = {
    isFetching: false,
    isReady: false,
    followed_topics: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_TOPICS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_TOPICS: {
      return {
        ...state,
        isFetching: false,
        isReady: true,
        followed_topics: action.topics
      };
    }
    default:
      return state;
  }
};

const contributor_reviews = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    contributor_reviews_count: {}
  },
  action
) => {
  switch (action.type) {
    case REQUEST_CONTRIBUTOR_REVIEWS_COUNT:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_CONTRIBUTOR_REVIEWS_COUNT:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        contributor_reviews_count: action.contributor_reviews_count,
        updated: false
      };
    default:
      return state;
  }
};

const all_skipped_annotations = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    skipped_annotations: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_All_SKIPPED_ANNOTATIONS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_All_SKIPPED_ANNOTATIONS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        skipped_annotations: action.all_skipped_annotations,
        updated: false
      };
    default:
      return state;
  }
};

const all_subscriptions = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    subscriptions: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_SUBSCRIPTIONS:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_ALL_SUBSCRIPTIONS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        subscriptions: action.all_subscriptions,
        updated: false
      };
    default:
      return state;
  }
};

const all_plans = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_PLANS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_ALL_PLANS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.plans
      };
    default:
      return state;
  }
};

const all_topics = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_ALL_TOPICS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_ALL_TOPICS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.all_topics
      };
    default:
      return state;
  }
};

const topics_stats = (
  state = {
    isFetching: false,
    isReady: false,
    items: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_TOPICS_STATS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_TOPICS_STATS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        items: action.topics_stats
      };
    default:
      return state;
  }
};

const teams = (
  state = {
    isFetching: false,
    isReady: false,
    all_teams: [],
    all_team_members: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_TEAMS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_TEAMS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        all_teams: action.teams
      };
    case REQUEST_ALL_TEAM_MEMBERS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_ALL_TEAM_MEMBERS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        all_team_members: action.team_members
      };
    default:
      return state;
  }
};

const slot_tool_doc_info = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    updated: false,
    slot_tool_doc: []
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SLOT_INFO_FOR_DOC:
      return {
        ...state,
        isFetching: true,
        isReady: false,
        updated: false
      };
    case RECEIVE_SLOT_INFO_FOR_DOC:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        slot_tool_doc: action.slot_tool_doc,
        updated: false
      };
    default:
      return state;
  }
};

const aggregated_annotations = (
  state = {
    isFetching: false,
    isReady: false,
    isUpdating: false,
    aggregated_annotations: [],
    total: 0
  },
  action
) => {
  switch (action.type) {
    case REQUEST_AGGREGATED_ANNOTATIONS:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_AGGREGATED_ANNOTATIONS:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        total: action.total,
        aggregated_annotations: action.aggregated_annotations
      };
    default:
      return state;
  }
};

const sources = (
  state = {
    isFetching: false,
    isReady: false,
    sources: {
      defaultMainstreamNewsSources: [],
      defaultTopics: [],
      activeTopics: []
    }
  },
  action
) => {
  switch (action.type) {
    case REQUEST_SOURCES:
      return {
        ...state,
        isFetching: true,
        isReady: false
      };
    case RECEIVE_SOURCES:
      return {
        ...state,
        isFetching: false,
        isReady: true,
        sources: action.sources
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  documents,
  documents_full,
  errors,
  current_user,
  agencies,
  entities,
  categories,
  tags,
  current_view,
  insights_graphs,
  docket_timeline,
  recent_activity,
  autocompletes,
  search_results_relevance,
  search_results_filter,
  user_vote,
  all_users,
  all_annotation_tasks,
  all_publications,
  publication,
  specified_user,
  filtered_mention,
  user_folder,
  all_statistics,
  all_documents,
  flagged_document,
  spider_names,
  provenances,
  updated_document,
  google_analytics,
  user_created_documents,
  create_document,
  annotation_task,
  new_document_url_headers,
  marketing,
  saved_searches,
  jurisdictions,
  search_queries,
  popular_docs,
  popular_sources,
  recent_documents,
  us_state,
  contributor_points,
  hidden_documents,
  routing: routerReducer,
  annotation_jobs,
  annotations_for_job,
  term_sampling_groups,
  document_details,
  term_sampling_group,
  all_annotation_jobs,
  subscriptions,
  insights_csv,
  notifications,
  topics,
  contributor_reviews,
  all_skipped_annotations,
  all_subscriptions,
  all_plans,
  all_topics,
  topics_stats,
  teams,
  incomplete_documents,
  annotation_task_topic_groups,
  aggregated_annotations,
  sources,
  slot_tool_doc_info
});

export default rootReducer;
