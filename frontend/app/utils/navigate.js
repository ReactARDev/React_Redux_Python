import _ from 'lodash';

//a variable to hold the savedSearchUrl when the user clicks on a doc from a saved seasrch
const closureState = { fromSavedSearch: null };

export function navigateSummary(location, router, id, overlay = null, page) {
  const { query, pathname, state } = location;

  if (state && state.fromDashboard && !_.includes(page, 'summary')) {
    router.push({
      pathname: '/dashboard',
      state
    });
    return;
  }

  if (closureState.fromSavedSearch) {
    router.push({
      pathname,
      query: closureState.fromSavedSearch
    });
    closureState.fromSavedSearch = null;
    return;
  }

  const summary_page = !page ? 'summary' : page;
  const new_query = {
    ...query,
    summary_id: id,
    summary_page
  };

  if (overlay) {
    if (query.on_saved_search) {
      closureState.fromSavedSearch = { ...query };
      // if clicking on a document from a saved search, the filter url params need to be pruned
      for (const key in new_query) {
        if (!(key === 'overlay' || key === 'summary_id' || key === 'summary_page')) {
          delete new_query[key];
        }
      }
    }
    new_query.overlay = overlay;
  } else {
    delete new_query.overlay;
  }

  // if coming from state code view, return to state code view
  if (state && state.fromStateCode) {
    router.push({
      pathname: '/state_code',
      query: new_query
    });
    return;
  }

  //prevents inifinite loop when reseting the right panel on view change
  let filtered_state = state && state.fromDashboard ? state : null;
  let filtered_pathname = pathname;

  //if viewing PDF from state code apply fromStateCode to state
  if (pathname === '/state_code' && !(state && state.fromStateCode)) {
    filtered_pathname = '/content';
    filtered_state = {
      fromStateCode: true
    };
  }

  router.push({
    pathname: filtered_pathname,
    query: new_query,
    state: filtered_state
  });
}

export function navigateOverlay(location, router, overlay_type) {
  const { query, pathname } = location;

  const new_query = {
    ...query
  };

  if (overlay_type) {
    new_query.overlay = overlay_type;
  } else {
    delete new_query.overlay;
  }

  router.push({
    pathname,
    query: new_query
  });
}

export function navigateAwayFromSearch(location, router) {
  // drop everything that relates to search / autosuggest filtering
  const new_query = { ...location.query };
  new_query.offset = null;
  new_query.limit = null;
  new_query.search_query = null;
  new_query.search_sort = null;
  new_query.autosuggest_filter = null;
  new_query.autosuggest_mapper = null;
  new_query.more_like_doc_id = null;
  new_query.regulation_id = null;
  new_query.act_id = null;
  new_query.concept_id = null;
  new_query.docket_id = null;
  new_query.topic_id = null;

  router.push({
    pathname: location.pathname,
    query: _.omitBy(new_query, _.isNil)
  });
}

export function navigateAwayFromFolder(location, router) {
  const new_query = { ...location.query };
  new_query.folder_id = null;
  new_query.folderTimelineView = null;

  router.push({
    pathname: location.pathname,
    query: _.omitBy(new_query, _.isNil)
  });
}
