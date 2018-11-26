import _ from 'lodash';

function nullify_filters(updated_query_hash) {
  updated_query_hash.search_query = null;
  updated_query_hash.autosuggest_filter = null;
  updated_query_hash.search_sort = null;
  updated_query_hash.bookmarked = null;
  updated_query_hash.read = null;
  updated_query_hash.read_folder_view = null;
  updated_query_hash.agency = null;
  updated_query_hash.followed_sources = null;
  updated_query_hash.more_like_doc_id = null;
  updated_query_hash.limit = null;
  updated_query_hash.offset = null;
  updated_query_hash.folder_id = null;
  updated_query_hash.folderTimelineView = null;
  updated_query_hash.category = null;
  updated_query_hash.state_code_id = null;
  updated_query_hash.no_skipping = null;
  updated_query_hash.citation_selected_id = null;
  updated_query_hash.location_crumb_selected = null;
  updated_query_hash.published_from = null;
  updated_query_hash.published_to = null;
  updated_query_hash.key_date_from = null;
  updated_query_hash.key_date_to = null;
  updated_query_hash.saved_searches_view = null;
  updated_query_hash.regulation_id = null;
  updated_query_hash.act_id = null;
  updated_query_hash.concept_id = null;
  updated_query_hash.docket_id = null;
  updated_query_hash.saved_searches_view = null;
  updated_query_hash.on_saved_search = null;
  updated_query_hash.citation_id = null;
  updated_query_hash.bank_id = null;
  updated_query_hash.topic_id = null;
  updated_query_hash.followed_sources = null;
  updated_query_hash.recent_activity_view = null;
}

export function explicit_filter_function(
  opts = {},
  location,
  router,
  filters,
  props,
  callbackWithUpdatedQuery = null
) {
  const query_args = location.query;
  let state;

  // Note: reset page to 1 (offset=0) since the filter changed
  const new_query_hash = { offset: 0 };

  for (const field_name of Object.keys(filters)) {
    const field_value = filters[field_name];
    new_query_hash[field_name] = field_value;
  }

  // special handling because date fields are mutually exclusive in the api
  if (new_query_hash.key_date_to || new_query_hash.key_date_from) {
    new_query_hash.published_to = null;
    new_query_hash.published_from = null;
  } else if (new_query_hash.published_to || new_query_hash.published_from) {
    new_query_hash.key_date_to = null;
    new_query_hash.key_date_from = null;
  }

  //seperate read folder view from filter read option
  if (query_args.read && query_args.read_folder_view) {
    new_query_hash.read_folder_view = null;
  }

  let updated_query_hash = {
    ...query_args,
    ...new_query_hash
  };

  // allow reset flag to override and blank the query hash
  if (opts.resetFilters) {
    // use a whitelist to track fields we want to keep in the query hash, we want to keep
    // search_query because otherwise we would get dumped back on the dashboard
    const whitelist = [
      'search_query',
      'search_sort',
      'autosuggest_filter',
      'more_like_doc_id',
      'folder_id',
      'folderTimelineView',
      'bookmarked',
      'state_code_id',
      'followed_sources',
      'recent_activity_view'
    ];
    const new_hash = {};

    for (const key of whitelist) {
      if (key in updated_query_hash) {
        new_hash[key] = updated_query_hash[key];
      }
    }
    updated_query_hash = new_hash;
  }

  if (opts.resetView) {
    //reset search parameters to default_view
    nullify_filters(updated_query_hash);

    state = {
      fromLeftNav: true
    };
  }

  if (opts.fedSourcesView) {
    //reset search parameters to default_view
    nullify_filters(updated_query_hash);
    //add federal to followed_sources
    updated_query_hash = {
      ...new_query_hash,
      followed_sources: 'federal'
    };

    state = {
      fromLeftNav: true
    };
  }

  if (opts.stateSourcesView) {
    //reset search parameters to default_view
    nullify_filters(updated_query_hash);
    //add state to followed_sources
    updated_query_hash = {
      ...new_query_hash,
      followed_sources: 'state'
    };

    state = {
      fromLeftNav: true
    };
  }

  if (opts.newsSourcesView) {
    //reset search parameters to default_view
    nullify_filters(updated_query_hash);
    //add news view
    updated_query_hash = {
      ...new_query_hash
    };

    state = {
      fromLeftNav: true
    };
  }

  if (opts.selectedFolder) {
    //reset search parameters to default_view
    nullify_filters(updated_query_hash);
    //display specified folder
    updated_query_hash.folderTimelineView = true;
    updated_query_hash.folder_id = opts.selectedFolder.id;
    updated_query_hash.no_skipping = true;
  }

  if (opts.insightsView) {
    //reset search parameters to default_view
    nullify_filters(updated_query_hash);
    //insights view
    updated_query_hash.insights_view = true;
  }

  //Special case: nullify insights if standard filters selected
  if (!_.isNil(updated_query_hash.insights_view) && !opts.insightsView) {
    updated_query_hash.insights_view = null;
  }

  //remove folder view if open
  if (
    !_.isNil(props.clearSelectedFolder) &&
    !_.isEmpty(props.user_folder.selected_folder) &&
    !opts.selectedFolder
  ) {
    props.clearSelectedFolder();
  }
  if (!_.isNil(callbackWithUpdatedQuery)) {
    callbackWithUpdatedQuery(updated_query_hash);
  }
  router.push({
    pathname: '/content',
    query: _.omitBy(updated_query_hash, _.isNil),
    state
  });
}
