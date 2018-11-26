import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import trunc from 'trunc-html';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import DocumentFilterSelect from './DocumentFilterSelect';
import DocumentFilterDateRange from './DocumentFilterDateRange';
import SuggestionBox from './SuggestionBox';
import AlertBanner from './AlertBanner';
import NewFeatureTooltip from './NewFeatureTooltip';
import { supportedDocumentTypes } from '../../shared/utils/supportedDocumentTypes';
import { get_search_view } from '../utils/search';
import { ControlLabel, Button, ButtonGroup, Alert, Tabs, Tab } from 'react-bootstrap';
import { examine_error } from '../utils/errors';
import { explicit_filter_function } from '../utils/filter';
import { dashboard_banners, bookmark_banner } from '../utils/bannerComponents';
import { getSelectedDocids } from '../utils/getSelected';
import { category_from_api } from '../../shared/utils/category';
import DashboardActionBar from './DashboardActionBar';
import AutocompleteSearchField from './AutocompleteSearchField';
import { safe_analytics } from '../../shared/utils/analytics';
import { browserName } from '../utils/browser';
import { update_viewed_agencies } from '../utils/notifications';
import classnames from 'classnames';
import { defaultFederalAgencies, defaultStateAgencies } from '../../shared/utils/defaultSources';
import { agencies_skipped_on_timeline, is_federal } from '../utils/agency';
import {
  markDocumentAsBookmarked,
  removeUserFolder,
  removeDocumentsFromFolder,
  renameUserFolder,
  clearErrors,
  fetchDocuments,
  changeDocumentView,
  fetchFolders,
  addError,
  changeSelectedFolder,
  clearSelectedItems,
  updateFolderModalStatus,
  saveSearch,
  editSavedSearch,
  fetchSavedSearches,
  showFilters,
  hideFilters,
  toggleFilters,
  updateCurrentUser,
  addBanner,
  showEmptyTimeline,
  hideEmptyTimeline,
  clearSkipOnboarding
} from '../../shared/actions';
import { get_autosuggest_term } from '../../shared/utils/autosuggest';
import SaveSearchModal from './SaveSearchModal';

class TimelineToolbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      new_filters: {},
      selected_date_filter: 'publication',
      readSelected: false,
      unreadSelected: false,
      suggestion_box_open: false,
      saveSearchModalOpen: false,
      searchName: '',
      displaySource: 'allSources'
    };
  }
  componentWillMount() {
    const { query } = this.props.location;
    if (query.followed_sources === 'federal') {
      this.setState({ displaySource: 'federalSources' });
    }
    if (query.followed_sources === 'state') {
      this.setState({ displaySource: 'stateSources' });
    }
    if (query.category === 'News') {
      this.setState({ displaySource: 'agencyNews' });
    }
    if (query.category === 'Mainstream News') {
      this.setState({ displaySource: 'mainstreamNews' });
    }
    if (
      _.isArray(query.category) &&
      query.category[0] === 'News' &&
      query.category[1] === 'Mainstream News'
    ) {
      this.setState({ displaySource: 'allNewsSources' });
    }
  }
  componentWillReceiveProps(nextProps) {
    // when the params change:
    // when a saved search is loaded this clears the previous filter state
    if (
      this.props.location.search !== nextProps.location.search &&
      !nextProps.location.query.on_saved_search
    ) {
      // hide the filter when params change
      const { query } = this.props.location;

      if (query.followed_sources === 'federal') {
        this.setState({ displaySource: 'federalSources' });
      } else if (query.followed_sources === 'state') {
        this.setState({ displaySource: 'stateSources' });
      } else if (query.category === 'News') {
        this.setState({ displaySource: 'agencyNews' });
      } else if (query.category === 'Mainstream News') {
        this.setState({ displaySource: 'mainstreamNews' });
      } else if (
        _.isArray(query.category) &&
        query.category[0] === 'News' &&
        query.category[1] === 'Mainstream News'
      ) {
        this.setState({ displaySource: 'allNewsSources' });
      } else {
        this.setState({ displaySource: 'allSources' });
      }

      this.setState({
        new_filters: {},
        readSelected: false,
        unreadSelected: false
      });
      this.props.hideFilters();
    }

    //display special dashboard banners (ie. topics) upon arrival
    if (_.has(nextProps.current_user.user, 'properties') && nextProps.current_user.isReady) {
      //run a check on whether the user has seen dashboard notifs
      const dash_banners_not_viewed = [];

      for (const dash_banner of dashboard_banners) {
        const user_properties = nextProps.current_user.user.properties;
        if (
          !_.has(user_properties, 'read_new_feature_tip') ||
          !user_properties.read_new_feature_tip[dash_banner.id]
        ) {
          //add content here to pass router to button
          const bkmk_banner = bookmark_banner(browserName());

          if (dash_banner.type === 'bookmark_compliance_ai_success') {
            dash_banner.content = bkmk_banner;
          }
          dash_banners_not_viewed.push(dash_banner);
        }
      }

      if (dash_banners_not_viewed.length > 0) {
        const dash_banner_in_view =
          this.props.current_view.banner.type === dash_banners_not_viewed[0].type &&
          this.props.current_view.banner.display;

        if (!dash_banner_in_view && nextProps.location.pathname === '/dashboard') {
          this.props.addBanner(
            dash_banners_not_viewed[0].type,
            true,
            dash_banners_not_viewed[0].content
          );
        }
      }
    }
  }

  handleSaveSearchClick() {
    const name =
      this.props.location.query.search_query ||
      get_autosuggest_term(this.props.location.query, this.props.filtered_mention.mention);
    this.setState({ saveSearchModalOpen: true });
    this.setState({ searchName: name });
  }

  waitAndCloseSearchAlert() {
    setTimeout(() => this.props.addBanner('saved_search_success', false), 5000);
  }

  createSavedSearch = searchName => {
    this.props.clearErrors('post_saved_search');
    this.props.clearErrors('post_saved_searches');
    const { query } = this.props.location;
    const data = {
      name: searchName.trim(),
      search_args: query
    };

    if (data.name.length > 0) {
      safe_analytics('default', 'Personalization', 'Save Search');
      this.props.saveSearch(data).then(response => {
        this.props.fetchSavedSearches();
        this.context.router.push({
          pathname: '/content',
          query: { ...this.props.location.query, on_saved_search: response.saved_search.id }
        });
        this.setState({
          saveSearchModalOpen: false
        });
        this.props.addBanner('saved_search_success', true, 'Your search has been saved.');
        this.waitAndCloseSearchAlert();
      });
    }
  };

  removeDocumentsInFolder = folder_id => {
    const selected_ids = getSelectedDocids(this.props.current_view.selected_items);
    this.props.removeDocumentsFromFolder(selected_ids, folder_id).then(() => {
      this.props.clearSelectedItems();
      this.props.fetchDocuments({ folder_id, folderTimelineView: true });
    });
  };

  close_modal = button => {
    if (button === 'save-search') {
      this.props.clearErrors('post_saved_search');
      this.setState({ saveSearchModalOpen: false });
    }
  };

  displayNews = category => {
    safe_analytics('default', 'News', 'Button Click', 'All Sources');

    explicit_filter_function(
      { newsSourcesView: true },
      this.props.location,
      this.context.router,
      { category },
      this.props
    );
    //reset filters
    this.setState({
      new_filters: {}
    });
  };

  handleSouceSelect = key => {
    // timeline view
    if (key === 'allSources') {
      this.displayAllSources();
    }
    if (key === 'federalSources') {
      this.displayFedSources();
    }
    if (key === 'stateSources') {
      this.displayStateSources();
    }
    //news view
    if (key === 'allNewsSources') {
      this.displayNews(['News', 'Mainstream News']);
    }
    if (key === 'agencyNews') {
      this.displayNews('News');
    }
    if (key === 'mainstreamNews') {
      this.displayNews('Mainstream News');
    }
  };
  displayAllSources = () => {
    safe_analytics('default', 'Timeline', 'Button Click', 'All Sources');
    //Reset url and search to default
    explicit_filter_function(
      { resetView: true },
      this.props.location,
      this.context.router,
      this.state.new_filters,
      this.props
    );
    //reset filters
    this.setState({ new_filters: {} });
    //remove submenu
  };
  filter_update_function = (field, selected_value) => {
    const new_filters = this.state.new_filters || { new_filters: {} };
    new_filters[field] = selected_value;
    this.setState({ new_filters });
  };
  displayFedSources = () => {
    safe_analytics('default', 'Timeline', 'Button Click', 'Federal Sources');
    const federal_sources = [];

    for (const agency of this.props.agencies.followed_agencies) {
      if (
        is_federal(agency) &&
        (this.props.location.query.search_sort ||
          !_.includes(agencies_skipped_on_timeline, agency.id))
      ) {
        federal_sources.push(agency.id);
      }
    }
    /*
    FIXME: special case for federal sources tab
    where if empty agency sources sent to api, defaultSources
    is returned to timeline. This quick hack will overlay timeline
    with empty view when user selects federal sources tab and they do not
    follow any fed sources
    */
    if (_.isEmpty(federal_sources)) {
      this.props.showEmptyTimeline();
      //do not allow toggle of view with double click
    } else if (!_.isEmpty(federal_sources) && this.props.current_view.empty_timeline_view) {
      this.props.hideEmptyTimeline();
    }

    this.filter_update_function('agency', federal_sources);
    explicit_filter_function(
      { fedSourcesView: true },
      this.props.location,
      this.context.router,
      this.state.new_filters,
      this.props
    );
    //reset filters
    this.setState({ new_filters: {} });
  };

  displayStateSources = () => {
    safe_analytics('default', 'Timeline', 'Button Click', 'State Sources');
    const state_sources = [];

    for (const agency of this.props.agencies.followed_agencies) {
      if (!is_federal(agency)) {
        state_sources.push(agency.id);
      }
    }
    /*
    FIXME: special case for state sources tab
    where if empty agency sources sent to api, defaultSources
    is returned to timeline. This quick hack will overlay timeline
    with empty view when user selects state sources tab and they do not
    follow any state sources
    */
    if (_.isEmpty(state_sources)) {
      this.props.showEmptyTimeline();
      //do not allow toggle of view with double click
    } else if (!_.isEmpty(state_sources) && this.props.current_view.empty_timeline_view) {
      this.props.hideEmptyTimeline();
    }
    this.filter_update_function('agency', state_sources);
    explicit_filter_function(
      { stateSourcesView: true, resetDate: true },
      this.props.location,
      this.context.router,
      this.state.new_filters,
      this.props
    );
    //reset filters
    this.setState({ new_filters: {} });
  };
  render() {
    //global check for latest query
    const { query } = this.props.location;

    let toolBarMenu = null;

    const search_view = get_search_view(this.props.current_view.search_params, this.props.location);

    if (search_view.section === 'timeline') {
      toolBarMenu = <h1 className="timeline-header">Timeline</h1>;
    } else if (search_view.section === 'saved_searches') {
      toolBarMenu = <h1 className="saved-search-header">Saved Searches</h1>;
    } else if (search_view.section === 'user_folders' && search_view.subsection === 'folder_menu') {
      toolBarMenu = <h1 className="saved-search-header">Folders</h1>;
    } else if (search_view.section === 'newdashboard') {
      toolBarMenu = <h1 className="saved-search-header">Dashboard</h1>;
    } else if (
      search_view.section === 'user_folders' &&
      (search_view.subsection === 'bookmarked' ||
        search_view.subsection === 'read' ||
        search_view.subsection === 'custom_folder')
    ) {
      const removeButtonClasses = {
        'folder-btn btn btn-xs btn-primary': true,
        'coming-soon': _.isEmpty(this.props.current_view.selected_items)
      };
      let shortFolderName = trunc(this.props.user_folder.selected_folder.name, 20).text;

      const documentSelected = _.isEmpty(this.props.current_view.selected_items);

      let folder_controls = this.props.shared_folder_permission !== 'viewer' ? (
        <div className="folder-controls">
          <div className="document-sectional">
            <div className="folder-control-btns">
              <button
                className={classnames(removeButtonClasses)}
                onClick={() =>
                  this.removeDocumentsInFolder(
                    this.props.user_folder.selected_folder.id
                  )
                }
                disabled={documentSelected}
                title="Remove Selected"
                type="button"
              >
                Remove
              </button>
            </div>
            <label className="folder-control-label">Documents</label>
          </div>
        </div>
      ) : null;

      if (search_view.subsection === 'bookmarked' || search_view.subsection === 'read') {
        folder_controls = null;
        shortFolderName = search_view.subsection === 'bookmarked' ? 'Bookmarked' : 'Read';
      }
      toolBarMenu = (
        <div className="folder-toolbar">
          <div className="folder-cookie-trail">
            {!_.isEmpty(shortFolderName) ? (
              <i className="material-icons" aria-hidden="true">
                folder
              </i>
            ) : null}
            <span title={this.props.user_folder.selected_folder.name}>{shortFolderName}</span>
          </div>

          {folder_controls}
        </div>
      );
    }

    let modalMenu = null;

    if (this.state.saveSearchModalOpen) {
      const renderErrors = () => {
        const errors = this.props.errors || {};
        if (errors.post_saved_search && errors.post_saved_search.length > 0) {
          const e = this.props.errors.post_saved_search[
            this.props.errors.post_saved_search.length - 1
          ];

          return (
            <Alert
              bsStyle="danger"
              className="left-panel-error-container"
              onClick={() => this.props.clearErrors('post_saved_search')}
            >
              {examine_error(e, 'post_saved_search').text}
            </Alert>
          );
        }
        return null;
      };
      modalMenu = (
        <SaveSearchModal
          createBtnTitle="Create"
          modalTitle="Create a Saved Search"
          saveSearchModalOpen={this.state.saveSearchModalOpen}
          renderErrors={renderErrors}
          searchName={this.state.searchName}
          createSavedSearch={this.createSavedSearch}
          close_modal={this.close_modal}
        />
      );
    }

    const filter_update_function = (field, selected_value) => {
      //highlight read as active if selected
      if (field === 'read') {
        //double click on read/unread tab remove active state
        if (
          (this.state.unreadSelected && !selected_value[0]) ||
          (this.state.readSelected && selected_value[0])
        ) {
          this.setState({
            readSelected: false,
            unreadSelected: false
          });
        } else {
          this.setState({
            readSelected: !!selected_value[0],
            unreadSelected: !selected_value[0]
          });
        }
      } else if (field === 'agency') {
        for (const agencyId of selected_value) {
          update_viewed_agencies(this.props, agencyId);
        }
      }
      const new_filters = this.state.new_filters || { new_filters: {} };
      new_filters[field] = selected_value;
      this.setState({ new_filters });
    };

    const get_current_value_for_filters = key => {
      let current_value;
      // if on saved search, we want the filter to pull the filter value from query
      if (this.state.new_filters && key in this.state.new_filters) {
        current_value = this.state.new_filters[key];
      } else {
        current_value = this.props.current_view.search_params[key];
      }
      return current_value;
    };

    const custom_agency_map_function = agency => {
      return {
        value: agency.id,
        label: agency.short_name || agency.name
      };
    };

    const custom_category_map_function = value => {
      return {
        label: category_from_api(value),
        value
      };
    };

    const handle_date_range_click = selected_date_filter => {
      // hack-y solution to avoid focus being pressed in after switching the date range
      // not super elegant, but not sure if there is a better solution either
      ReactDOM.findDOMNode(this.refs.publication_btn).blur();
      ReactDOM.findDOMNode(this.refs.key_date_btn).blur();

      if (selected_date_filter !== this.state.selected_date_filter) {
        this.setState({ selected_date_filter });
      }
    };

    const get_filter_selector_active = expected_value => {
      return expected_value === this.state.selected_date_filter;
    };

    const get_filter_cls = expected_value => {
      return expected_value === this.state.selected_date_filter ? '' : 'hidden';
    };

    // build list of agencies for explicit filters (search_sort is off)
    const agency_list = [];
    for (const agency of defaultFederalAgencies.concat(defaultStateAgencies)) {
      //filter out those state agencies without data
      if (agency && agency.id) {
        agency_list.push(agency);
      }
    }
    //sort the non-blacklisted (followable agencies) here
    agency_list.sort((a, b) => {
      const label_a = a.short_name.toLowerCase() || a.name.toLowerCase();
      const label_b = b.short_name.toLowerCase() || b.name.toLowerCase();
      if (label_a < label_b) {
        return -1;
      } else if (label_a > label_b) {
        return 1;
      }
      return 0;
    });
    // FIXME: extremely hacky code to keep those agencies that can be followed
    // at the top of the filter menu in search view and others in the bottom
    for (const agency of this.props.agencies.search_filter_agencies) {
      //add those agencies users cannot follow
      if (!_.includes(agency_list, agency)) {
        agency_list.push(agency);
      }
    }
    //filter out those sources who are skipped on timeline, news, and and are not followable
    const decorated_agency_list = _.isNil(query.search_sort)
      ? _.remove(agency_list, agency => {
        return (
          !_.includes(agencies_skipped_on_timeline, agency.id) &&
            _.includes(defaultFederalAgencies.concat(defaultStateAgencies), agency)
        );
      })
      : agency_list;

    const filterable_agencies = { items: decorated_agency_list };
    const showTimeline = !(query.search_sort || query.autosuggest_filter || query.more_like_doc_id);

    const saveSearchButton =
      !showTimeline &&
      !query.on_saved_search &&
      !this.props.displayFilters &&
      !query.more_like_doc_id ? (
        <div>
          <Button
            className="save-search-btn btn btn-primary"
            onClick={e => this.handleSaveSearchClick(e)}
            id="save-search-btn"
          >
            Save Search
          </Button>
          <NewFeatureTooltip
            targetId={'save-search-btn'}
            content="Save this search query and its filters for future use. Your
         Saved Searches live in the navigation bar on the left of your screen."
            readyToDisplay={this.props.documents.isReady}
            featureId="2"
          />
        </div>
        ) : null;

    const filter_icon = (
      <span className="filter-select-icon" onClick={() => this.props.toggleFilters()}>
        <i className="material-icons">filter_list</i>
        Filter
      </span>
    );

    let filterMenu =
      search_view.section !== 'insights' ? (
        <div className="toolbar-icons">
          {search_view.section === 'timeline' ||
          search_view.section === 'search' ||
          search_view.section === 'news' ? (
            filter_icon
          ) : (
            <div />
          )}
          <DashboardActionBar location={this.props.location} />
          {saveSearchButton}
        </div>
      ) : null;

    const filter_and_close = e => {
      if (query.on_saved_search) {
        // if these two conditions are true then the user is editing a saved search.
        // the url parameters are being updated in explicit_filter_function so we pass the
        // editSavedSearch callback to explicit_filter_function
        const editSavedSearchCallback = updatedQueryArgs => {
          const searchId = query.on_saved_search;
          const data = {
            search_args: updatedQueryArgs
          };

          this.props.editSavedSearch(searchId, data).then(() => {
            this.props.fetchSavedSearches();
            this.props.addBanner('saved_search_success', true, 'Your search has been saved.');
            this.waitAndCloseSearchAlert();
          });
        };
        explicit_filter_function(
          {},
          this.props.location,
          this.context.router,
          this.state.new_filters,
          this.props,
          editSavedSearchCallback
        );
      } else {
        explicit_filter_function(
          {},
          this.props.location,
          this.context.router,
          this.state.new_filters,
          this.props
        );
      }

      //reset filters
      this.setState({
        new_filters: {}
      });
      this.props.hideFilters();
    };

    const clear_all_function = e => {
      e.preventDefault();

      explicit_filter_function(
        { resetFilters: true },
        this.props.location,
        this.context.router,
        this.state.new_filters,
        this.props
      );
      //reset filters
      this.setState({
        new_filters: {},
        readSelected: false,
        unreadSelected: false
      });
    };

    const update_read_state = read_state => {
      let read_status = false;

      if (read_state === 'read') {
        read_status = true;
      }

      filter_update_function('read', [read_status]);
    };

    const closeFilterMenu = e => {
      e.preventDefault();
      const search_filters = [
        'read',
        'agency',
        'category',
        'published_from',
        'published_to',
        'key_date_from',
        'key_date_to'
      ];
      const search_date_filters = [
        'published_from',
        'published_to',
        'key_date_from',
        'key_date_to'
      ];

      //check to see if certain filters are still applied after cancel and fill form accordingly
      for (const filter of search_filters) {
        if (!_.isNil(query[filter])) {
          //keep date type as selected if cancelled
          if (_.includes(filter, 'published')) {
            this.setState({
              selected_date_filter: 'publication'
            });
          } else if (_.includes(filter, 'key')) {
            this.setState({
              selected_date_filter: 'key_date'
            });
          }
          let field_value = [];
          if (_.isArray(query[filter]) || _.includes(search_date_filters, filter)) {
            //special check for date parms
            field_value = query[filter];
          } else {
            field_value.push(query[filter]);
          }
          filter_update_function(filter, field_value);
        }
      }
      this.props.hideFilters();
    };

    const filtered_doc_types = supportedDocumentTypes.items.filter(category => {
      //non-filterable categories
      return category !== 'Whitepaper' && category !== 'News' && category !== 'Mainstream News';
    });

    const doc_types =
      search_view.section === 'search' ? supportedDocumentTypes : { items: filtered_doc_types };

    const invalidDateRange = () => {
      const published_from = moment(get_current_value_for_filters('published_from'));
      const published_to = moment(get_current_value_for_filters('published_to'));
      const key_date_from = moment(get_current_value_for_filters('key_date_from'));
      const key_date_to = moment(get_current_value_for_filters('key_date_to'));

      if (
        (this.state.selected_date_filter === 'publication' && published_from > published_to) ||
        (this.state.selected_date_filter === 'key_date' && key_date_from > key_date_to)
      ) {
        return true;
      }

      return false;
    };

    const handleDateRangeError = () => {
      if (invalidDateRange()) {
        return (
          <div className="filter-group">
            <div className="filter-error">
              <p className="bg-danger help-block">
                Invalid date range (Make sure the second date is the later one!)
              </p>
            </div>
          </div>
        );
      }

      return null;
    };
    const filterableTopics = { items: this.props.sources.sources.activeTopics };
    const custom_topic_map_function = topic => {
      return {
        value: topic.id,
        label: topic.name
      };
    };
    if (this.props.displayFilters) {
      filterMenu = (
        <div className="filter-menu">
          <div className="filter-header">
            <h3>Filter</h3>
            <a onClick={clear_all_function}>Clear All</a>
          </div>
          {handleDateRangeError()}
          <div className="mainFilters">
            <div className="topFilters">
              <div className="filter-group">
                <div className="filter-title">
                  <ControlLabel className="date-range-label">Date Type</ControlLabel>
                </div>
                <div className="filter-date filter-section left">
                  <div className="filter-btn-group">
                    <ButtonGroup className="btn-group-justified">
                      <ButtonGroup>
                        <Button
                          ref="publication_btn"
                          active={get_filter_selector_active('publication')}
                          onClick={() => handle_date_range_click('publication')}
                          bsClass="publication_btn"
                          className="btn-date-switcher"
                          bsSize="sm"
                        >
                          Publication
                        </Button>
                      </ButtonGroup>
                      <ButtonGroup>
                        <Button
                          ref="key_date_btn"
                          onClick={() => handle_date_range_click('key_date')}
                          active={get_filter_selector_active('key_date')}
                          className="btn-date-switcher"
                          bsClass="key_date_btn"
                          bsSize="sm"
                        >
                          Key
                        </Button>
                      </ButtonGroup>
                    </ButtonGroup>
                  </div>
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-title">
                  <ControlLabel className="date-range-label">Date Range</ControlLabel>
                </div>
                <div className="filter-section">
                  <div className="filter-date-range">
                    <div id="publication_datepicker" className={get_filter_cls('publication')}>
                      <DocumentFilterDateRange
                        location={this.props.location}
                        to_value={get_current_value_for_filters('published_to')}
                        from_value={get_current_value_for_filters('published_from')}
                        query_arg_prefix="published"
                        update_function={filter_update_function}
                      />
                    </div>
                    <div id="key_date_datepicker" className={get_filter_cls('key_date')}>
                      <DocumentFilterDateRange
                        location={this.props.location}
                        to_value={get_current_value_for_filters('key_date_to')}
                        from_value={get_current_value_for_filters('key_date_from')}
                        query_arg_prefix="key_date"
                        update_function={filter_update_function}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="filter-group">
                <div className="filter-title">
                  <ControlLabel className="date-range-label">Read</ControlLabel>
                </div>
                <div className="filter-date filter-section left">
                  <div className="filter-btn-group">
                    <ButtonGroup className="btn-group-justified">
                      <ButtonGroup>
                        <Button
                          onClick={e => update_read_state('read')}
                          active={this.state.readSelected}
                          className="btn-date-switcher"
                          bsClass="publication_btn"
                          bsSize="sm"
                        >
                          Read
                        </Button>
                      </ButtonGroup>
                      <ButtonGroup>
                        <Button
                          onClick={e => update_read_state('unread')}
                          active={this.state.unreadSelected}
                          className="btn-date-switcher"
                          bsClass="key_date_btn"
                          bsSize="sm"
                        >
                          Unread
                        </Button>
                      </ButtonGroup>
                    </ButtonGroup>
                  </div>
                </div>
              </div>
            </div>
            <div className="bottomFilters">
              <div className="filter-group">
                <DocumentFilterSelect
                  components={filterable_agencies}
                  custom_map_function={custom_agency_map_function}
                  location={this.props.location}
                  value={get_current_value_for_filters('agency')}
                  display_name="Source"
                  query_arg="agency"
                  multi
                  update_function={e => filter_update_function('agency', e)}
                />
              </div>
              <div className="filter-group">
                <DocumentFilterSelect
                  components={filterableTopics}
                  custom_map_function={custom_topic_map_function}
                  location={this.props.location}
                  value={get_current_value_for_filters('topic_id')}
                  display_name="Topic"
                  query_arg="topic_id"
                  multi
                  update_function={e => filter_update_function('topic_id', e)}
                />
              </div>
              <div className="filter-group">
                <DocumentFilterSelect
                  components={doc_types}
                  custom_map_function={custom_category_map_function}
                  location={this.props.location}
                  value={get_current_value_for_filters('category')}
                  display_name="Document Type"
                  query_arg="category"
                  multi
                  update_function={e => filter_update_function('category', e)}
                />
              </div>
            </div>
          </div>
          <div className="filter-btm-btn-group">
            <Button block bsSize="lg" onClick={closeFilterMenu} className="cancel-filter-btn">
              Cancel
            </Button>
            <Button
              block
              bsSize="lg"
              disabled={invalidDateRange()}
              onClick={filter_and_close}
              className="apply-filter-btn"
            >
              {query.on_saved_search ? 'Update' : 'Apply'}
            </Button>
          </div>
        </div>
      );
    }

    const onFreeTrialSubscription = this.props.subscriptions.subscriptions.reduce(
      (mem, subscription) => {
        if (subscription.active && subscription.category === 'free_trial') {
          mem = true;
        }
        return mem;
      },
      false
    );
    const currentSubscription = this.props.subscriptions.subscriptions.filter(
      subscription => subscription.active
    )[0];

    return (
      <div className="timeline-toolbar">
        {this.props.current_view.banner.display ? (
          <AlertBanner location={this.props.location} />
        ) : null}
        <div className="toolbar-search-suggest">
          {this.props.current_view.inMobile ? null : (
            <div className="suggestion-btn-container">
              <i
                title="Suggestion box"
                className="material-icons"
                onClick={() => this.setState({ suggestion_box_open: true })}
              >
                live_help
              </i>
              {!onFreeTrialSubscription ||
              this.props.location.pathname === '/account' ||
              this.props.location.pathname === '/checkout' ? null : (
                <div>
                  <span className="freeTrialEnd">
                    {`Your Free Trial Ends ${
                      currentSubscription
                        ? moment(currentSubscription.expirationDate).format('M/D')
                        : 'soon'
                    }`}
                  </span>
                  <Link to="/account">
                    <button className="upgradeButton">Upgrade</button>
                  </Link>
                </div>
              )}
            </div>
          )}
          <AutocompleteSearchField location={this.props.location} />
        </div>
        {toolBarMenu}
        {this.props.location.pathname === '/dashboard' ||
        this.props.location.pathname === '/account' ||
        this.props.location.pathname === '/checkout'
          ? null
          : filterMenu}
        {modalMenu}
        {this.state.suggestion_box_open && (
          <SuggestionBox modalClose={() => this.setState({ suggestion_box_open: false })} />
        )}
        {search_view.section === 'timeline' || search_view.section === 'news' ? (
          <Tabs
            id="toolbar-tab"
            activeKey={this.state.displaySource}
            onSelect={this.handleSouceSelect}
            className="tabsContainer"
          >
            <Tab
              eventKey={search_view.section === 'timeline' ? 'allSources' : 'allNewsSources'}
              title={search_view.section === 'timeline' ? 'All Sources' : 'All News'}
              key={search_view.section === 'timeline' ? 'allSources' : 'allNewsSources'}
            />
            <Tab
              eventKey={search_view.section === 'timeline' ? 'federalSources' : 'agencyNews'}
              title={search_view.section === 'timeline' ? 'Federal Sources' : 'Agency News'}
              key={search_view.section === 'timeline' ? 'federalSources' : 'agencyNews'}
            />
            <Tab
              eventKey={search_view.section === 'timeline' ? 'stateSources' : 'mainstreamNews'}
              title={search_view.section === 'timeline' ? 'State Sources' : 'Mainstream News'}
              key={search_view.section === 'timeline' ? 'stateSources' : 'mainstreamNews'}
            />
          </Tabs>
        ) : null}
      </div>
    );
  }
}

TimelineToolbar.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  const shared_folder_permission =
    !_.isEmpty(state.user_folder.selected_folder) &&
    _.hasIn(state.user_folder.selected_folder, 'shared_folder_users')
      ? state.user_folder.selected_folder.shared_folder_users.reduce(
        (mem, folder_user) => {
          if (state.current_user.user.id === folder_user.id) {
            mem = folder_user.user_permission_access;
          }
          return mem;
        },
        ''
      )
      : '';

  return {
    current_view: state.current_view,
    current_user: state.current_user,
    documents: state.documents,
    user_folder: state.user_folder,
    shared_folder_permission,
    documents_full: state.documents_full,
    errors: state.errors,
    filtered_mention: state.filtered_mention,
    displayFilters: state.current_view.displayFilters,
    recent_activity: state.recent_activity,
    user_email: state.current_user.user.email,
    subscriptions: state.subscriptions,
    agencies: state.agencies,
    sources: state.sources
  };
};

const mapDispatchToProps = dispatch => {
  return {
    markDocumentAsBookmarked: (ids, bookmarked_status) => {
      dispatch(markDocumentAsBookmarked(ids, bookmarked_status));
    },
    removeUserFolder: folder_id => {
      return dispatch(removeUserFolder(folder_id));
    },
    fetchDocuments: params => {
      dispatch(fetchDocuments(params));
    },
    fetchFolders: () => {
      dispatch(fetchFolders());
    },
    removeDocumentsFromFolder: (documents, folder_id) => {
      return dispatch(removeDocumentsFromFolder(documents, folder_id));
    },
    renameUserFolder: (name, folder_id) => {
      return dispatch(renameUserFolder(name, folder_id));
    },
    addError: (error, component) => {
      dispatch(addError(error, component));
    },
    clearErrors: component => {
      dispatch(clearErrors(component));
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    },
    changeSelectedFolder: folder => {
      dispatch(changeSelectedFolder(folder));
    },
    addBanner: (banner_type, banner_status, content) => {
      dispatch(addBanner(banner_type, banner_status, content));
    },
    updateFolderModalStatus: status => {
      dispatch(updateFolderModalStatus(status));
    },
    saveSearch: searchParams => {
      return dispatch(saveSearch(searchParams));
    },
    editSavedSearch: (searchId, searchParams) => {
      return dispatch(editSavedSearch(searchId, searchParams));
    },
    fetchSavedSearches: () => {
      return dispatch(fetchSavedSearches());
    },
    showFilters: () => {
      return dispatch(showFilters());
    },
    hideFilters: () => {
      return dispatch(hideFilters());
    },
    toggleFilters: () => {
      return dispatch(toggleFilters());
    },
    updateCurrentUser: (email, data) => {
      dispatch(updateCurrentUser(email, data));
    },
    showEmptyTimeline: () => {
      dispatch(showEmptyTimeline());
    },
    hideEmptyTimeline: () => {
      dispatch(hideEmptyTimeline());
    },
    clearSkipOnboarding: () => {
      dispatch(clearSkipOnboarding());
    }
  };
};

const ReduxToolbar = connect(mapStateToProps, mapDispatchToProps)(TimelineToolbar);

export default ReduxToolbar;
