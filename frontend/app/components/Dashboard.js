import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import DashGraph from './DashGraph';
import DashTimeline from './DashTimeline';
import DashLeaderboard from './DashLeaderboard';
import DashRecentActivity from './DashRecentActivity';
import DashCommonSearches from './DashCommonSearches';
import DashPopularFedSources from './DashPopularFedSources';
import GoogleFormModal from './GoogleFormModal';
import classnames from 'classnames';
import DashNews from './DashNews';
import {
  closeOverlay,
  fetchContributorPoints,
  clearAutoComplete,
  postSearchQuery,
  updateCurrentUser,
  fetchCurrentUser
} from '../../shared/actions';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      showGoogleForm: false
    };
  }
  componentWillMount() {
    if (this.props.current_view.overlay) {
      this.props.closeOverlay();
    }
    this.props.fetchContributorPoints();
    this.props.clearAutoComplete();
    const graphsReady = !this.props.all_statistics.isFetching;

    // show the loading overlay if data is not ready
    if (
      !graphsReady ||
      !this.props.recent_documents.isReady ||
      !this.props.current_view.search_loading
    ) {
      this.setState({ isLoading: true });
    }
  }
  componentDidMount() {
    const state = this.props.location.state;
    if (_.has(state, 'fromDashboard.outer')) {
      const scrollOuter = state.fromDashboard.outer;
      document.querySelector('.newDashboardContainer').scrollTop = scrollOuter;
    }
  }
  componentWillReceiveProps(nextProps) {
    const graphsReady = !nextProps.all_statistics.isFetching;

    // show the loading overlay if data is not ready
    if (graphsReady || nextProps.recent_documents.isReady) {
      this.setState({ isLoading: false });
    }

    if (this.props.current_user.isFetching && !nextProps.current_user.isFetching) {
      if (
        nextProps.current_user.user.roles.includes('contributor') &&
        !nextProps.current_user.user.properties.submittedContributorForm
      ) {
        this.setState({ showGoogleForm: true });
      } else {
        this.setState({ showGoogleForm: false });
      }
    }
  }
  submittedGoogleForm = () => {
    this.props
      .updateCurrentUser(this.props.current_user.user.email, {
        properties: { submittedContributorForm: true }
      })
      .then(() => {
        this.props.fetchCurrentUser();
      });
  };
  render() {
    const dashboardClasses = {
      'newDashboardContainer container-fluid': true,
      'loading-overlay-light': true,
      'loading-active': this.state.isLoading
    };
    const newDashboard = this.props.current_view.inMobile ? (
      <div className={classnames(dashboardClasses)}>
        {this.state.showGoogleForm &&
        this.props.location.state &&
        this.props.location.state.newContributorSignup ? (
          <GoogleFormModal submittedGoogleForm={this.submittedGoogleForm} />
        ) : null}
        <DashTimeline location={this.props.location} />
        <DashNews location={this.props.location} />
        <DashLeaderboard />
        <DashRecentActivity location={this.props.location} />
        <DashCommonSearches postSearchQuery={this.props.postSearchQuery} />
        <DashPopularFedSources />
      </div>
    ) : (
      <div className={classnames(dashboardClasses)}>
        <div className="col-md-8">
          {this.state.showGoogleForm &&
          this.props.location.state &&
          this.props.location.state.newContributorSignup ? (
            <GoogleFormModal submittedGoogleForm={this.submittedGoogleForm} />
          ) : null}
          <DashTimeline location={this.props.location} />
          <DashNews location={this.props.location} />
        </div>
        <div className="col-md-4">
          <div className="sucky-alignment-spacer" />
          <DashLeaderboard />
          <DashRecentActivity location={this.props.location} />
          <DashGraph location={this.props.location} />
          <DashPopularFedSources />
          <DashCommonSearches postSearchQuery={this.props.postSearchQuery} />
        </div>
      </div>
    );

    return newDashboard;
  }
}

Dashboard.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({
  errors,
  current_view,
  all_statistics,
  recent_documents,
  current_user
}) => {
  return {
    errors,
    current_view,
    current_user,
    all_statistics,
    recent_documents
  };
};

const ReduxDashboard = connect(mapStateToProps, {
  closeOverlay,
  fetchContributorPoints,
  clearAutoComplete,
  postSearchQuery,
  updateCurrentUser,
  fetchCurrentUser
})(Dashboard);

export default ReduxDashboard;
