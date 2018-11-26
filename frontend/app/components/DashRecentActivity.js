import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import { fetchRecentActivity, fetchAgencies, notificationsUpdate } from '../../shared/actions';
import { fetchRecent, getDates } from '../utils/notifications';
import { safe_analytics } from '../../shared/utils/analytics';

class DashRecentActivity extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user_agencies: null,
      show_more: false
    };
  }

  componentWillMount() {
    if (!this.props.agencies.isReady) {
      this.props.fetchAgencies(true);
    }
    if (
      this.props.agencies.isReady &&
      this.props.current_user.isReady &&
      this.props.agencies.followed_agencies.length > 0
    ) {
      const user_agencies = {};

      for (const agency of this.props.agencies.followed_agencies) {
        user_agencies[agency.id] = agency;
      }

      this.setState({
        user_agencies
      });
      if (!this.props.recent_activity.isFetching) {
        fetchRecent(this.props);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      !(
        nextProps.agencies.isReady &&
        nextProps.current_user.isReady &&
        nextProps.agencies.followed_agencies.length > 0
      )
    ) {
      return;
    }

    let user_agencies_changed = false;
    const user_agencies = nextProps.agencies.followed_agencies;
    const old_user_agencies = this.props.agencies.followed_agencies;

    if (!_.isEqual(user_agencies, old_user_agencies)) {
      user_agencies_changed = true;
    }

    if (user_agencies_changed || !this.state.user_agencies) {
      const new_user_agencies = {};

      for (const agency of user_agencies) {
        new_user_agencies[agency.id] = agency;
      }

      this.setState({
        user_agencies: new_user_agencies
      });

      if (!nextProps.recent_activity.isFetching) {
        fetchRecent(nextProps);
      }
    }
  }

  handleClick(agency) {
    const dates = getDates(this.props);
    const query_args = this.props.location.query;
    const pathname = '/content';
    const new_query_args = {
      published_from: dates.date_from,
      published_to: dates.date_to,
      agency: agency.id,
      no_skipping: true,
      folderTimelineView: null,
      read: null,
      insights_view: null,
      read_folder_view: null,
      folder_id: null,
      category: null,
      bookmarked: null,
      limit: null,
      offset: null,
      saved_searches_view: null,
      summary_id: null,
      summary_page: 'summary',
      followed_sources: null,
      recent_activity_view: true
    };

    this.context.router.push({
      pathname,
      query: {
        ...query_args,
        ...new_query_args
      }
    });
    safe_analytics('default', 'Dashboard', 'Available Updates Click');
  }

  render() {
    const followedAgencies = this.props.agencies.followed_agencies.reduce((mem, agency) => {
      mem[agency.id] = agency;
      return mem;
    }, {});
    const recentActivity = this.props.recent_activity.document_stats.reduce((mem, agency) => {
      if (!agency) {
        return null;
      }
      let updates = 0;

      const categories = Object.keys(agency.categories);
      for (const category of categories) {
        updates += agency.categories[category];
      }
      if (updates > 0) {
        mem.push({
          agency: followedAgencies[agency.agency_id],
          updates
        });
      }
      return mem;
    }, []);
    const last_login_str = getDates(this.props).last_login.format('MMMM Do, YYYY');
    const arrow_status = this.state.show_more ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
    const more_less_txt = this.state.show_more ? 'Show Less' : 'Show More';

    return (
      <div className="summaryContainer recentActivity">
        <div className="summary">
          <h2>
            New Since <span>{last_login_str}</span>
          </h2>
          {recentActivity.length <= 0 ? (
            <h5>No Updates</h5>
          ) : (
            recentActivity
              .sort((agency1, agency2) => {
                if (_.has(agency1, 'agency.name') && _.has(agency2, 'agency.name')) {
                  if (agency1.agency.name.toUpperCase() <= agency2.agency.name.toUpperCase()) {
                    return -1;
                  }
                  return 1;
                }
                return 0;
              })
              .map((agency, i) => {
                const updateText = agency.updates === 1 ? 'update' : 'updates';
                if (!this.state.show_more && i >= 3) {
                  return null;
                }
                return (
                  <div key={i}>
                    {_.has(agency, 'agency.name') ? (
                      <h5>
                        {agency.agency.name}
                        <span
                          className="updateCount"
                          onClick={() => this.handleClick(agency.agency)}
                        >
                          {`${agency.updates} ${updateText}`}
                        </span>
                      </h5>
                    ) : null}
                  </div>
                );
              })
          )}
          {recentActivity.length >= 4 ? (
            <div
              className="show-more-less"
              onClick={() => this.setState({ show_more: !this.state.show_more })}
            >
              <span>{more_less_txt}</span>
              <i className="material-icons">{arrow_status}</i>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

DashRecentActivity.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_user: state.current_user,
    recent_activity: state.recent_activity,
    agencies: state.agencies
  };
};

const ReduxDashRecentActivity = connect(mapStateToProps, {
  fetchRecentActivity,
  fetchAgencies,
  notificationsUpdate
})(DashRecentActivity);

export default ReduxDashRecentActivity;
