import _ from 'lodash';

const DATE_PARAMS = [
  'comments_close_from',
  'comments_close_to',
  'compliance_from',
  'compliance_to',
  'key_date_from',
  'key_date_to',
  'published_from',
  'published_to'
];
// params that are actually used in search. handle these explicitly so
// if the store gets polluted with unexpected values our logic doesn't break
const WHITELIST_PARAMS = DATE_PARAMS.concat([
  'agency',
  'bookmarked',
  'category',
  'read',
  'read_folder_view',
  'search_query',
  'followed_sources',
  'autosuggest_filter',
  'search_sort',
  'folder_id',
  'insights_view',
  'saved_searches_view'
]);

// user-selected filter items
const USER_FILTER_PARAMS = [
  'key_date_from',
  'key_date_to',
  'published_from',
  'published_to',
  'agency',
  'category'
];

// return only the parameters that are changed from the default
export function get_changed_parameters(search_params) {
  const whitelisted = _.pick(search_params, WHITELIST_PARAMS);
  const changed = _.pickBy(whitelisted); // all truthy parameters
  // clear out some false positives
  for (const param of Object.keys(changed)) {
    const value = changed[param];

    // date params are initialized to {}
    if (
      DATE_PARAMS.indexOf(param) !== -1 &&
      _.isObject(value) &&
      !_.isEmpty(value) &&
      Object.keys.length(value) === 0
    ) {
      delete changed[param];
    }
  }

  return changed;
}

// simple helper function to map the current search parameters to the view in the UI.
// simplisitic now, but hopefully should prevent duplicated logic later on
export function get_search_view(search_params, location = {}) {
  const view = {};
  const active_params = get_changed_parameters(search_params);
  const active_param_names = Object.keys(active_params);

  const support_page =
    location.pathname === '/settings' ||
    location.pathname === '/support' ||
    location.pathname === '/account' ||
    location.pathname === '/legal' ||
    location.pathname === '/checkout';

  if (location.pathname === '/state_code') {
    view.section = 'state_code';
  } else if (support_page) {
    view.section = 'user_settings'; //support_page view
  } else if (location.pathname === '/dashboard') {
    view.section = 'dashboard'; //dashboard view
  } else if (location.pathname === '/sources') {
    view.section = 'sources';
  } else if (
    search_params.folderTimelineView ||
    active_params.bookmarked ||
    active_params.read_folder_view ||
    location.pathname === '/folders'
  ) {
    //folder content view
    view.section = 'user_folders';
    if (location.pathname === '/folders') {
      view.subsection = 'folder_menu';
    } else if (active_params.bookmarked) {
      view.subsection = 'bookmarked';
    } else if (active_params.read_folder_view) {
      view.subsection = 'read';
    } else if (search_params.folderTimelineView) {
      view.subsection = 'custom_folder';
    }
  } else if (location.pathname === '/topics') {
    view.section = 'topics'; //dashboard view
  } else if (location.pathname === '/insights') {
    view.section = 'insights'; //insights view
  } else if (search_params.search_sort) {
    view.section = 'search'; //search results view
  } else if (search_params.insights_view) {
    view.section = 'insights'; //insights view
  } else if (search_params.saved_searches_view) {
    view.section = 'saved_searches'; //saved_searches view
  } else if (_.includes(search_params.category, 'News')) {
    view.section = 'news'; //news view
  } else {
    view.section = 'timeline';
    if (active_param_names.length === 0) {
      view.subsection = 'new'; // new on timeline
    } else if (active_params.followed_sources === 'federal') {
      view.subsection = 'fed_agencies_view'; // fed sources on timeline
    } else if (active_params.followed_sources === 'state') {
      view.subsection = 'state_agencies_view'; // state sources on timeline
    } else if (search_params.recent_activity_view) {
      view.subsection = 'recent_activity_view'; // recent_activity_view on timeline
    }
  }

  view.active_user_filters = _.intersection(active_param_names, USER_FILTER_PARAMS);

  return view;
}
