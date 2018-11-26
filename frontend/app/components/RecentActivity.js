import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import { fetchRecentActivity, notificationsUpdate, addBanner } from '../../shared/actions';
import { category_from_api } from '../../shared/utils/category';
import { examine_error } from '../utils/errors';
import { changes_since } from '../utils/changelog';
import { defaultStateAgencies } from '../../shared/utils/defaultSources';
import { fetchRecent, getDates } from '../utils/notifications';
import moment from 'moment';
import classnames from 'classnames';

class RecentActivity extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      user_agencies: null
    };
  }

  componentWillMount() {
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
    //check for errors
    const errors = nextProps.errors;
    const error_banner_in_view =
      this.props.current_view.banner.type === 'error' && this.props.current_view.banner.display;

    if (errors.recent_activity && errors.recent_activity.length > 0 && !error_banner_in_view) {
      const err = errors.recent_activity[0];
      const err_msg = (
        <div className="banner-alert-container">
          <h4 className="banner-text">{examine_error(err, 'recent_activity').text}</h4>
        </div>
      );
      this.props.addBanner('error', true, err_msg);
    }
  }

  renderChanges() {
    // show changes from the last 14 days, but only from the most recent release
    const releases = changes_since(moment.utc().subtract(14, 'days'), 1);
    let sources = [];
    const changes = [];

    // loop isn't strictly necessary since we only look at one release
    for (const date_str of Object.keys(releases)) {
      const entry = releases[date_str];

      if (entry.sources && entry.sources.length > 0) {
        for (const source of entry.sources) {
          sources.push(source);
        }
      }

      if (entry.changes && entry.changes.length > 0) {
        for (const change of entry.changes) {
          changes.push(change);
        }
      }
    }

    const source_list_fragment = [];

    sources = sources.sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      } else if (a.name < b.name) {
        return -1;
      }
      return 0;
    });

    const all_sources = [];
    const state_ids = _.map(defaultStateAgencies, 'id');

    sources.forEach((source, i) => {
      all_sources.push(source.id);

      const handle_click = () => {
        const pathname = '/content';
        const agency = !source.state_code_id ? source.id : null;
        const state_code_id = _.includes(state_ids, source.id) ? source.state_code_id : null;
        const citation_selected_id = _.includes(state_ids, source.id) ? source.state_code_id : null;

        this.context.router.push({
          pathname,
          query: {
            published_from: null,
            agency,
            folderTimelineView: null,
            read_folder_view: null,
            folder_id: null,
            state_code_id,
            citation_selected_id,
            location_crumb_selected: null,
            insights_view: null,
            on_saved_search: null,
            saved_searches_view: null,
            followed_sources: null,
            recent_activity_view: true
          }
        });
      };

      source_list_fragment.push(
        <li onClick={handle_click} key={i}>
          {source.name}
        </li>
      );
    });

    const selectAllSources = e => {
      e.preventDefault();

      const pathname = '/content';

      this.context.router.push({
        pathname,
        query: {
          published_from: null,
          folderTimelineView: null,
          folder_id: null,
          read_folder_view: null,
          agency: all_sources,
          citation_selected_id: null,
          on_saved_search: null,
          saved_searches_view: null,
          state_code_id: null
        }
      });
    };

    let sources_fragment = null;

    if (source_list_fragment.length > 0) {
      sources_fragment = (
        <div className="new-sources">
          <div>
            <strong onClick={selectAllSources}>New sources added:</strong>
          </div>
          <ul>{source_list_fragment}</ul>
        </div>
      );
    }

    const change_list_fragment = [];

    changes.forEach((change, i) => {
      // XXX: needed release of State Codes tab
      const handle_click = e => {
        e.preventDefault();
        const pathname = '/content?saved_searches_view=true';

        this.context.router.push({ pathname });
      };

      change_list_fragment.push(
        <li onClick={handle_click} key={i}>
          {change.short_description}
        </li>
      );
    });

    let changes_fragment = null;

    if (change_list_fragment.length > 0) {
      changes_fragment = (
        <div className="new-features">
          <div>
            <strong>New features added:</strong>
          </div>
          <ul>{change_list_fragment}</ul>
        </div>
      );
    }

    if (!(changes_fragment || sources_fragment)) {
      return null;
    }

    return (
      <div className="new-source-section">
        <ul className="update-container">
          <li className="well agency-update">
            {sources_fragment}
            {changes_fragment}
          </li>
        </ul>
      </div>
    );
  }

  render() {
    if (!this.state.user_agencies) {
      return null;
    }

    const dates = getDates(this.props);

    const agency_fragment = [];

    // set to true if the search returned more results than the limit (20)
    let incomplete_stats = false;

    const document_stats = this.props.recent_activity.document_stats;
    document_stats.forEach(stat => {
      let total = 0;
      for (const updates in stat.categories) {
        if (Object.prototype.hasOwnProperty.call(stat.categories, updates)) {
          total += stat.categories[updates];
        }
      }
      stat.total_updates = total;
    });

    const ordered_stats = _.orderBy(document_stats, ['total_updates',
      (stat) => {
        const agency = this.state.user_agencies[stat.agency_id];
        if (!agency) {
          return null;
        }
        return (agency.display_short_name || agency.name);
      }], ['desc', 'asc']);

    for (const stat of ordered_stats) {
      const category_stats = [];
      const agency = this.state.user_agencies[stat.agency_id];

      if (!agency) {
        continue;
      }

      let total_count = 0;

      // e.g. Final Rule, Notice, etc...
      for (const category of Object.keys(stat.categories)) {
        let category_name = category_from_api(category);

        if (!category_name.endsWith('s')) {
          category_name += 's';
        }

        const count = stat.categories[category];
        total_count += count;

        category_stats.push(
          <li key={category_name}>
            <strong>{count}</strong> {category_name}
          </li>
        );
      }

      if (total_count === 0) {
        category_stats.push(<li key={'none'}>No updates</li>);
      } else if (total_count >= 20) {
        incomplete_stats = true;
      }

      const handle_click = () => {
        if (total_count === 0) {
          return;
        }

        const query_args = this.props.location.query;
        const pathname = '/content';
        const new_query_args = {
          published_from: dates.date_from,
          published_to: dates.date_to,
          agency: stat.agency_id,
          no_skipping: true,
          folderTimelineView: null,
          state_code_id: null,
          citation_selected_id: null,
          read: null,
          insights_view: null,
          read_folder_view: null,
          folder_id: null,
          category: null,
          bookmarked: null,
          limit: null,
          offset: null,
          saved_searches_view: null,
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
      };

      const classes = {
        well: true,
        'agency-update': true,
        enabled: total_count > 0
      };

      agency_fragment.push(
        <li key={'agency' + agency.id} className={classnames(classes)} onClick={handle_click}>
          <div>
            <strong>{agency.display_short_name || agency.name}</strong>
            <ul>{category_stats}</ul>
          </div>
        </li>
      );
    }

    const last_login_str = dates.last_login.format('MMMM Do, YYYY');
    let last_login_text;

    if (incomplete_stats || dates.last_login.isBefore(moment.utc().subtract(6, 'days'))) {
      last_login_text = (
        <h4>
          Top new items since <span>{last_login_str}</span>:
        </h4>
      );
    } else {
      last_login_text = (
        <h4>
          New Since <span>{last_login_str}</span>:
        </h4>
      );
    }

    return (
      <div className="row" id="recent-activity">
        <h3>Hi {this.props.current_user.user.first_name}!</h3>
        {this.renderChanges()}
        {last_login_text}
        <ul className="update-container">{agency_fragment}</ul>
      </div>
    );
  }
}

RecentActivity.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_user: state.current_user,
    current_view: state.current_view,
    recent_activity: state.recent_activity,
    agencies: state.agencies,
    errors: state.errors
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchRecentActivity: (params, agencies) => {
      return dispatch(fetchRecentActivity(params, agencies));
    },
    notificationsUpdate: stats => {
      dispatch(notificationsUpdate(stats));
    },
    addBanner: (banner_type, banner_status, content) => {
      dispatch(addBanner(banner_type, banner_status, content));
    }
  };
};

const ReduxRecentActivity = connect(mapStateToProps, mapDispatchToProps)(RecentActivity);

export default ReduxRecentActivity;
