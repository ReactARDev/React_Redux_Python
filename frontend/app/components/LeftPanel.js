import React from 'react';
import Favico from 'favico.js';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import LeftNavSubMenu from './LeftNavSubMenu';
import { get_search_view } from '../utils/search';
import { safe_analytics } from '../../shared/utils/analytics';
import { latestSubscription } from '../../shared/utils/subscriptions';
import { explicit_filter_function } from '../utils/filter';
import classnames from 'classnames';
import {
  changeSubmenuTarget,
  updateCurrentUser,
  changeSearchParams,
  simpleFetchDocuments,
  clearSkipOnboarding
} from '../../shared/actions';
import _ from 'lodash';
import { updateNotificationBadge, update_user_notification_status } from '../utils/notifications';
import { agencies_skipped_on_timeline, fetchDocsByAgencyWithNotifs } from '../utils/agency';
import { categories_skipped_on_timeline } from '../../shared/utils/category';
import { today, sevenDaysAgo } from '../utils/keyDates';
import NewFeatureTooltip from './NewFeatureTooltip';
import { onboardingTooltipEnabled } from '../../shared/config';

class LeftPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dashboard: null,
      user_settings: null,
      user_folders: null,
      saved_searches: null,
      timeline: null,
      news: null,
      insights: null,
      sources: null,
      top: 0,
      bottom: null,
      rm_dash_notif: false,
      favicon: null,
      new_filters: {},
      agency_update_count: 0,
      notif_favicon_status: false,
      notif_status: {
        //tracks if the user has seen notifications
        timeline: {
          viewed_status: false
        },
        news: {
          viewed_status: false
        },
        user_folders: {
          viewed_status: false
        }
      }
    };
  }

  componentWillMount() {
    const query = {
      skip_agency: agencies_skipped_on_timeline,
      skip_category: [categories_skipped_on_timeline],
      jurisdiction: 'US',
      sort: 'publication_date',
      published_from: sevenDaysAgo,
      published_to: today,
      skip_unused_fields: true,
      limit: 400 // limit response to 400 documents
    };
    this.props.simpleFetchDocuments(query);

    const app_view = get_search_view(this.props.current_view.search_params, this.props.location);
    //if arriving on dashboard view highlight dashboard as active
    if (app_view.section === 'dashboard') {
      this.setState({ dashboard: true });
    } else {
      if (!_.isNil(this.props.current_view.submenu_target)) {
        this.props.changeSubmenuTarget(null);
        //sets all leftpanel submenu states to null
        this._resetHighlightedState();
      }
    }
    //Need to necessary create the favicon (once) here to properly remove
    //see last comment here -> https://github.com/ejci/favico.js/issues/12
    const favicon = new Favico({
      position: 'up',
      animation: 'none',
      bgColor: '#ff3838',
      textColor: '#ff3838'
    });
    this.setState({ favicon });
  }

  componentWillReceiveProps(nextProps) {
    this.update_left_nav_notif(nextProps);
  }

  update_left_nav_notif = nextProps => {
    //tracks the notification status of the user
    const notif_status =
      nextProps.current_user.user.properties && nextProps.current_user.user.properties.notif_status
        ? nextProps.current_user.user.properties.notif_status
        : {};
    const docsByAgencyWithNotifs = fetchDocsByAgencyWithNotifs(nextProps);

    const agency_update_count = Object.keys(docsByAgencyWithNotifs).length;

    //update component with latest viewed notifications from store and agency count
    this.setState({ notif_status, agency_update_count });

    //global notification panel variable
    //dashboard is treated differently as users land on that page first
    const notification_panels = ['timeline', 'news', 'user_folders'];

    let notifs_viewed = false;

    for (const panel of notification_panels) {
      notifs_viewed = this.state.notif_status[panel]
        ? this.state.notif_status[panel].viewed_status
        : false;
    }

    // Remove favicon notification from browswer tab when user removes all notifs
    if ((notifs_viewed && this.state.rm_dash_notif) || !nextProps.recent_activity.total_updates) {
      if (this.state.notif_favicon_on) {
        updateNotificationBadge(this.state.favicon, false);
        this.setState({ notif_favicon_on: false });
      }
    } else if (
      //add notif favicon
      (!notifs_viewed || !this.state.rm_dash_notif) &&
      agency_update_count > 0
    ) {
      if (!this.state.notif_favicon_on) {
        updateNotificationBadge(this.state.favicon, true);
        this.setState({ notif_favicon_on: true });
      }
    }

    // track previous view
    const prev_app_view = get_search_view(this.props.location.query, this.props.location);
    // track current view
    const current_app_view = get_search_view(nextProps.location.query, nextProps.location);
    // Remove notification from dash on left nav when user navigates away from dash view
    if (prev_app_view.section === 'dashboard' && current_app_view.section !== 'dashboard') {
      this.setState({ rm_dash_notif: true });
    }
    // Add notification to dash on left nav if there is a new update
    const new_dash_updates = !_.isEqual(
      this.props.recent_activity.document_stats,
      nextProps.recent_activity.document_stats
    );
    if (new_dash_updates) {
      this.setState({ rm_dash_notif: false });
    }

    for (const panel of notification_panels) {
      // Add/Remove notification from panel on left nav when user navigates to panel view
      if (current_app_view.section === panel && prev_app_view.section !== panel) {
        update_user_notification_status(nextProps, panel, !nextProps.notifications.status[panel]);
      }
    }
  };

  handleEvent(menu_item) {
    this._setHighlightState(menu_item);
    this.props.changeSubmenuTarget(menu_item);
  }

  _resetHighlightedState() {
    this.setState({
      dashboard: null,
      user_settings: null,
      user_folders: null,
      timeline: null,
      insights: null,
      news: null,
      saved_searches: null,
      sources: null
    });
  }

  _setHighlightState = menu_item => {
    const new_state = {};
    new_state[menu_item] = true;
    this.setState(new_state);
  };

  render() {
    const displaySavedSearches = () => {
      safe_analytics('default', 'Left Nav', 'Saved Searches');

      this._setHighlightState('saved_searches');
      this.context.router.push({
        pathname: '/content',
        query: { saved_searches_view: true },
        state: {
          fromLeftNav: true
        }
      });
    };

    const displayDashboard = () => {
      safe_analytics('default', 'Left Nav', 'Dashboard');

      this._setHighlightState('dashboard');
      this.context.router.push({
        pathname: '/dashboard',
        state: {
          fromLeftNav: true
        }
      });
    };

    const displaySources = () => {
      safe_analytics('default', 'Left Nav', 'Sources');

      this._setHighlightState('sources');
      this.props.clearSkipOnboarding();
      this.context.router.push({
        pathname: '/sources',
        state: {
          fromLeftNav: true
        },
        query: { view: 'federal' }
      });
    };

    const displayInsights = e => {
      e.preventDefault();

      safe_analytics('default', 'Left Nav', 'Insights');

      this._setHighlightState('insights');
      this.context.router.push({
        pathname: '/insights',
        state: {
          fromLeftNav: true
        }
      });
    };

    const displayTimeline = () => {
      // default is display all sources
      safe_analytics('default', 'Left Nav', 'Timeline', 'All Sources');
      //Reset url and search to default
      this._setHighlightState('timeline');
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

    const displayNews = e => {
      e.preventDefault();

      safe_analytics('default', 'Left Nav', 'News');

      this._setHighlightState('news');

      explicit_filter_function(
        { newsSourcesView: true },
        this.props.location,
        this.context.router,
        { category: ['News', 'Mainstream News'] },
        this.props
      );
      //reset filters
      this.setState({
        new_filters: {}
      });
    };

    const displayFolders = e => {
      e.preventDefault();

      safe_analytics('default', 'Left Nav', 'Folders');

      this._setHighlightState('user_folders');
      this.context.router.push({
        pathname: '/folders',
        state: {
          fromLeftNav: true
        }
      });
    };

    const user = _.get(this.props.current_user, 'user') || {};
    const full_name = [user.first_name, user.last_name].join(' ');

    const menuClasses = {
      user_settings: ['left-nav-option'],
      user_folders: ['left-nav-option'],
      saved_searches: ['left-nav-option'],
      dashboard: ['left-nav-option'],
      sources: ['left-nav-option'],
      timeline: ['left-nav-option'],
      news: ['left-nav-option'],
      insights: ['left-nav-option']
    };

    const left_nav_options = [
      'user_settings',
      'dashboard',
      'user_folders',
      'saved_searches',
      'insights',
      'sources',
      'timeline',
      'news'
    ];

    const app_view = get_search_view(this.props.location.query, this.props.location);
    for (const menu_item of left_nav_options) {
      if (
        (this.state[menu_item] && this.props.current_view.submenu_target === menu_item) ||
        app_view.section === menu_item
      ) {
        menuClasses[menu_item].push('active');
      }
    }

    const hideSubMenu = e => {
      e.preventDefault();

      if (!_.isNil(this.props.current_view.submenu_target)) {
        this.props.changeSubmenuTarget(null);
      }
    };
    /*
      Notification counters
    */
    const agency_update_count = this.state.agency_update_count;

    const documents_update_count = this.props.recent_activity.total_updates;

    let news_update_count = 0;

    this.props.recent_activity.document_stats.forEach(agency => {
      if (agency.categories.News) {
        news_update_count += agency.categories.News;
      }
    });

    /*
      Notification view status
    */
    const timeline_notif_viewed = this.state.notif_status.timeline
      ? this.state.notif_status.timeline.viewed_status
      : false;
    const news_notif_viewed = this.state.notif_status.news
      ? this.state.notif_status.news.viewed_status
      : false;
    const folders_notif_viewed = this.state.notif_status.user_folders
      ? this.state.notif_status.user_folders.viewed_status
      : true;
    return (
      <div className="left-panel">
        <div className="left-panel-container" ref="left_panel_container">
          <div
            className={classnames(menuClasses.user_settings)}
            ref="user_settings"
            onClick={() => this.handleEvent('user_settings')}
            onMouseEnter={() => this.handleEvent('user_settings')}
          >
            <div>
              {this.props.subscriptions.isReady &&
              latestSubscription(this.props.subscriptions.subscriptions).within10dayofExpiration ? (
                <span className="notif-bubble" />
              ) : null}
            </div>
            <i className="material-icons">account_circle</i>
            <label id="users-name" className="left-nav-option-txt" title={full_name}>
              {full_name}
            </label>
          </div>
          <div
            className={classnames([
              ...menuClasses.sources,
              { showOnboardingFollowing: this.props.current_view.skipOnboarding }
            ])}
            ref="sources"
            id="leftnavsources"
            onClick={displaySources}
            onMouseEnter={() => this.handleEvent('sources')}
          >
            <i className="material-icons">bubble_chart</i>
            <label className="left-nav-option-txt">Following</label>
          </div>
          {onboardingTooltipEnabled && this.props.current_view.skipOnboarding ? (
            <NewFeatureTooltip
              targetId="leftnavsources"
              content={`Customize your experience. Follow agencies, topics, and news.`}
              featureId="leftnavsources1"
              handleClick={this.props.clearSkipOnboarding}
              readyToDisplay
            />
          ) : null}
          <div
            className={classnames(menuClasses.dashboard)}
            onClick={displayDashboard}
            onMouseEnter={hideSubMenu}
          >
            <div>
              {agency_update_count > 0 && !this.state.rm_dash_notif ? (
                <span className="notif-bubble dash">
                  {agency_update_count > 5 ? '5+' : agency_update_count}
                </span>
              ) : (
                <div />
              )}
              <i className="material-icons">dashboard</i>
            </div>
            <label className="left-nav-option-txt">Dashboard</label>
          </div>
          <div
            className={classnames(menuClasses.timeline)}
            ref="timeline"
            onClick={displayTimeline}
            onMouseEnter={hideSubMenu}
          >
            <div>
              {documents_update_count > 0 && !timeline_notif_viewed ? (
                <span className="notif-bubble timeline">
                  {documents_update_count > 5 ? '5+' : documents_update_count}
                </span>
              ) : (
                <div />
              )}
              <i className="material-icons">timeline</i>
            </div>
            <label className="left-nav-option-txt">Timeline</label>
          </div>
          <div
            className={classnames(menuClasses.news)}
            onClick={displayNews}
            onMouseEnter={hideSubMenu}
          >
            <div>
              {news_update_count > 0 && !news_notif_viewed ? (
                <span className="notif-bubble news">
                  {news_update_count > 5 ? '5+' : news_update_count}
                </span>
              ) : (
                <div />
              )}
              <i className="material-icons">library_books</i>
            </div>
            <label className="left-nav-option-txt">News</label>
          </div>
          <div
            className={classnames(menuClasses.insights)}
            ref="insights"
            onClick={displayInsights}
            onMouseEnter={hideSubMenu}
          >
            <i className="material-icons">pie_chart</i>
            <label className="left-nav-option-txt">Insights</label>
          </div>
          <div
            className={classnames(menuClasses.saved_searches)}
            onClick={displaySavedSearches}
            onMouseEnter={hideSubMenu}
          >
            <i className="saved-searches-icon" />
            <label className="left-nav-option-txt">Saved Searches</label>
          </div>
          <div
            className={classnames(menuClasses.user_folders)}
            ref="user_folders"
            onClick={displayFolders}
            onMouseEnter={hideSubMenu}
          >
            <div>{!folders_notif_viewed ? <span className="notif-bubble folders" /> : null}</div>
            <i className="material-icons">folder</i>
            <label className="left-nav-option-txt">Folders</label>
          </div>
          <div className="sucky-spacer" />
          <div className="left-panel-logo" />
          <LeftNavSubMenu
            location={this.props.location}
            _setHighlightState={this._setHighlightState}
            top={this.state.top}
          />
        </div>
      </div>
    );
  }
}

LeftPanel.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_user: state.current_user,
    current_view: state.current_view,
    contributor_points: state.contributor_points,
    recent_documents: state.recent_documents,
    agencies: state.agencies,
    recent_activity: state.recent_activity,
    user_email: state.current_user.user.email,
    notifications: state.notifications,
    subscriptions: state.subscriptions
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeSubmenuTarget: target => {
      dispatch(changeSubmenuTarget(target));
    },
    updateCurrentUser: (email, data) => {
      dispatch(updateCurrentUser(email, data));
    },
    changeSearchParams: params => {
      dispatch(changeSearchParams(params));
    },
    simpleFetchDocuments: params => {
      dispatch(simpleFetchDocuments(params));
    },
    clearSkipOnboarding: () => {
      dispatch(clearSkipOnboarding());
    }
  };
};

const ReduxLeftPanel = connect(mapStateToProps, mapDispatchToProps)(LeftPanel);

export default ReduxLeftPanel;
