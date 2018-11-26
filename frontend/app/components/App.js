import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import _ from 'lodash';
import classNames from 'classnames';
import { examine_error } from '../utils/errors';
import Menu from 'react-burger-menu/lib/menus/slide';
import { isIE10 } from '../utils/browser';
import { safe_ga } from '../../shared/utils/analytics';
import { subscribeToNotifications } from '../../shared/utils/socket';
import auth from '../../shared/utils/auth';
import {
  fetchCurrentUser,
  closeFolderMenu,
  clearErrors,
  fetchTags,
  closeWarningModal,
  fetchSavedSearches,
  changeSubmenuTarget,
  setMobile,
  fetchSubscriptions,
  fetchRecentActivity,
  notificationsUpdate,
  addBanner,
  updateCurrentUser,
  fetchDefaultSources
} from '../../shared/actions';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import TimelineToolbar from './TimelineToolbar';
import DocumentSearchListHeader from './DocumentSearchListHeader';
import AppOverlay from './AppOverlay';
import { get_search_view } from '../utils/search';
import AgencyBanner from './AgencyBanner';

let subscribedToNotifications = false;
class App extends React.Component {
  componentDidMount() {
    this.props.fetchCurrentUser();
    this.props.fetchTags();
    this.props.fetchSavedSearches();
    this.updateDimensions();
    this.props.fetchSubscriptions();
    window.addEventListener('resize', this.updateDimensions);
    this.props.fetchDefaultSources();
  }

  componentWillReceiveProps(nextProps) {
    // check for auth errors
    // for now, just force the user to logout
    if (
      nextProps.errors &&
      nextProps.errors.auth &&
      nextProps.errors.auth.length > 0
    ) {
      auth.logout(() => {
        window.location.reload(); // reload to clear state and return to login page
      });
    }

    // check to see if freeTrial is expired and redirect if it is
    auth.lockoutOnExpiredFreeTrial(
      this.user,
      this.subscriptions,
      nextProps,
      this.context.router,
      nextProps.addBanner
    );

    if (
      this.props.subscriptions.isFetching &&
      !nextProps.subscriptions.isFetching
    ) {
      this.subscriptions = nextProps.subscriptions.subscriptions;
    }

    if (
      this.props.current_user.isFetching &&
      !nextProps.current_user.isFetching
    ) {
      // start the websocket connection after server sends back user data
      if (auth.loggedIn() && !subscribedToNotifications) {
        subscribeToNotifications(nextProps);
        subscribedToNotifications = true;
      }

      // set GA user id
      const user_id = !_.isNil(_.get(nextProps.current_user, 'user.id'))
        ? _.get(nextProps.current_user, 'user.id').toString()
        : '';
      safe_ga('set', 'userId', user_id);
      //necessary extra call for added analytical demension of user_id
      safe_ga('set', 'dimension1', user_id);

      const is_internal = !_.isNil(nextProps.current_user.user.is_internal_user)
        ? nextProps.current_user.user.is_internal_user.toString()
        : '';
      safe_ga('set', 'dimension2', is_internal);

      // track users by role
      const roles = !_.isNil(nextProps.current_user.user.roles)
        ? nextProps.current_user.user.roles.toString()
        : '';
      safe_ga('set', 'dimension4', roles);

      this.user = nextProps.current_user.user;
      if (typeof mixpanel !== 'undefined') {
        mixpanel.people.set({
          $email: this.user.email,
          user_id,
          is_internal,
          roles
        });
        mixpanel.identify(this.user.email);
      }

      /*
        In the case of a new user, the email notification settings
        need to be set upon very first login
      */
      if (!this.user.properties.email_updates) {
        const user_email_settings = {};

        user_email_settings.properties = {
          email_updates: { topics_weekly: true, agency_daily: false, agency_weekly: true }
        };
        this.props.updateCurrentUser(this.user.email, user_email_settings);
      }
    }

    //check for errors
    const errors = nextProps.errors;
    // hack to make sure we don't miss any errors
    // these should be handled more intelligently later on
    const exclude_components = [
      'documents',
      'document_summary',
      'recent_activity',
      'settings',
      'folders',
      'post_saved_search',
      'saved_searches',
      'document_html'
    ];
    const err_msgs = [];

    for (const component of Object.keys(errors)) {
      if (exclude_components.indexOf(component) === -1) {
        const error = errors[component];
        err_msgs.push(
          <div className="banner-alert-container">
            <h4 className="banner-text">
              {examine_error(error, component).text}
            </h4>
          </div>
        );
      }
    }

    const error_banner_in_view =
      this.props.current_view.banner.type === 'error' &&
      this.props.current_view.banner.display;

    if (err_msgs.length > 0 && !error_banner_in_view) {
      this.props.addBanner('error', true, err_msgs[0]);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    if (window.document.body.clientWidth < 768) {
      this.props.setMobile(true);
    } else {
      this.props.setMobile(false);
    }
  };

  // clicking away from dropdown menus makes them disappear
  handleClick(e) {
    //removes folder_dropdown menu
    if (
      this.props.user_folder &&
      this.props.user_folder.open_folder_menu &&
      e.target.className.indexOf('folder') === -1
    ) {
      this.props.closeFolderMenu();
      this.props.clearErrors('folders');
    }
  }

  _getUserStyle() {
    if (this.props.current_user.isReady) {
      if (localStorage.user_style) {
        return localStorage.user_style;
      }

      const user_style = _.get(
        this.props.current_user,
        'user.properties.user_style'
      );

      if (user_style) {
        return user_style;
      }
    }

    return null;
  }

  handleActivePage = () => {
    if (this.props.current_view.search_params.offset === '0') {
      return 1;
    }
    const offset = this.props.current_view.search_params.offset;
    const limit = this.props.current_view.search_params.limit;
    return parseInt(offset / limit, 10) + 1;
  };

  render() {
    // look through the children to apply a classname to the root element for css purposes
    const container_classes = ['auth'];

    React.Children.forEach(this.props.children, component => {
      // check for classname defined as a static property
      if (component.type && component.type.className) {
        container_classes.push(component.type.className);
      }
    });

    const user_style = this._getUserStyle();

    if (user_style) {
      container_classes.push(user_style);
    }

    let warningModal = null;

    if (this.props.current_view.warning_modal === 'pswrd') {
      const openSettingsCloseModal = e => {
        e.preventDefault();
        this.context.router.push({
          pathname: '/account',
          state: {
            fromPasswordModal: true
          }
        });
        this.props.closeWarningModal();
      };

      warningModal = (
        <Modal
          show={this.props.current_view.warning_modal === 'pswrd'}
          backdrop
          onHide={() => this.props.closeWarningModal()}
        >
          <Modal.Body>
            <div id="campaign-user-warning-menu">
              <h4 className="campaign-user-warning-header">Welcome back!</h4>
              <p>
                We have improved our password security. Please update your
                password now. Thank you!
              </p>
              <div className="campaign-user-warning-buttons">
                <button onClick={openSettingsCloseModal}>
                  Change Password
                </button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      );
    }

    let searchHeader = null;
    let agencyBanner = null;
    const { query } = this.props.location;

    // show the header for search queries, proposed filters and related doc filters
    if (
      !_.isNil(query.search_query) ||
      !_.isNil(query.autosuggest_filter) ||
      !_.isNil(query.more_like_doc_id)
    ) {
      searchHeader = (
        <DocumentSearchListHeader
          location={this.props.location}
          handleActivePage={this.handleActivePage}
        />
      );
      agencyBanner = <AgencyBanner />;
    }

    const app_view = get_search_view(
      this.props.current_view.search_params,
      this.props.location
    );

    const centerContainerClasses = {
      'center-container': true,
      // hack to keep bottom of state code and search from cutting off last element
      'state-code-scroll': app_view.section === 'state_code',
      'search-results-scroll': app_view.section === 'search',
      'timeline-scroll': app_view.section === 'timeline',
      'folders-scroll': app_view.section === 'user_folders'
    };

    //an ie10 style hack
    const ie10Style = () => {
      if (isIE10()) {
        const browserWidth = document.body.clientWidth;
        const leftPanelWidth = 96;
        const rightPanelWidth = 335;
        if (this.props.location.pathname === '/dashboard') {
          return null;
        }
        return {
          'max-width': browserWidth - (leftPanelWidth + rightPanelWidth)
        };
      }
      return null;
    };
    return (
      <div
        className={classNames(container_classes)}
        onClick={e => this.handleClick(e)}
        onMouseLeave={() => this.props.changeSubmenuTarget(null)}
        id="top"
      >
        {warningModal}
        <div className="main-container">
          <AppOverlay location={this.props.location} />
          {this.props.current_view.inMobile ? (
            <Menu>
              <LeftPanel location={this.props.location} />
            </Menu>
          ) : (
            <LeftPanel location={this.props.location} />
          )}
          <div
            style={ie10Style()}
            className={classNames(centerContainerClasses)}
          >
            <TimelineToolbar location={this.props.location} />
            <div className="content-container">
              {agencyBanner}
              {searchHeader}
              {this.props.children}
            </div>
          </div>
          {this.props.location.pathname === '/dashboard' ||
          this.props.location.pathname === '/checkout' ||
          this.props.location.pathname === '/account' ||
          this.props.location.pathname === '/sources' ||
          this.props.location.pathname === '/settings' ||
          this.props.location.pathname === '/support' ||
          this.props.location.pathname === '/topics' ||
          this.props.location.pathname === '/legal' ||
          this.props.location.pathname === '/folders' ||
          this.props.location.pathname === '/insights' ? null : (
            <RightPanel location={this.props.location} />
          )}
        </div>
      </div>
    );
  }
}

App.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_user: state.current_user,
    current_view: state.current_view,
    document_details: state.document_details,
    agencies: state.agencies,
    recent_activity: state.recent_activity,
    user_folder: state.user_folder,
    errors: state.errors,
    subscriptions: state.subscriptions,
    filtered_mention: state.filtered_mention
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchCurrentUser: () => {
      dispatch(fetchCurrentUser());
    },
    updateCurrentUser: (email, data) => {
      dispatch(updateCurrentUser(email, data));
    },
    fetchTags: () => {
      dispatch(fetchTags());
    },
    closeFolderMenu: () => {
      dispatch(closeFolderMenu());
    },
    closeWarningModal: () => {
      dispatch(closeWarningModal());
    },
    clearErrors: component => {
      dispatch(clearErrors(component));
    },
    fetchSavedSearches: () => {
      dispatch(fetchSavedSearches());
    },
    changeSubmenuTarget: target => {
      dispatch(changeSubmenuTarget(target));
    },
    setMobile: bool => {
      dispatch(setMobile(bool));
    },
    fetchSubscriptions: () => {
      dispatch(fetchSubscriptions());
    },
    fetchRecentActivity: (params, agencies) => {
      return dispatch(fetchRecentActivity(params, agencies));
    },
    notificationsUpdate: stats => {
      dispatch(notificationsUpdate(stats));
    },
    addBanner: (banner_type, banner_status, content, suppressCloseButton) => {
      dispatch(addBanner(banner_type, banner_status, content, suppressCloseButton));
    },
    fetchDefaultSources: () => {
      dispatch(fetchDefaultSources());
    }
  };
};

const ReduxApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default ReduxApp;
