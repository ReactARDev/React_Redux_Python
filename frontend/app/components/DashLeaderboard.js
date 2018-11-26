import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { Tooltip, OverlayTrigger, Panel, Accordion, Button } from 'react-bootstrap';
import { Link } from 'react-router';
import {
  openSourceSelection,
  highlightSearch,
  fetchAllAnnotationTasks,
  fetchContributorReviewsCount,
  fetchCurrentUser
} from '../../shared/actions';
import NewFeatureTooltip from './NewFeatureTooltip';
import { REQUIRED_REVIEWS_NUM_MONTHLY } from '../../shared/utils/contributor';

class DashLeaderboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      panel_open: {
        onboarding: false,
        contributor_panel: false
      }
    };
  }

  componentDidMount() {
    this.props.fetchCurrentUser().then(resp => {
      //only fetch tasks if user is contributor
      if (_.includes(resp.user.roles, 'contributor')) {
        this.props.fetchAllAnnotationTasks().then(response => {
          if (!_.isEmpty(response.annotation_tasks)) {
            _.filter(response.annotation_tasks, {
              type: 'contributor',
              status: 'active'
            }).forEach(task => {
              //fetch number of tasks user completed
              this.props.fetchContributorReviewsCount(task.id, {});
            });
          }
        });
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    if (
      _.isEmpty(this.props.all_annotation_tasks.annotation_tasks) &&
      !_.isEmpty(nextProps.all_annotation_tasks.annotation_tasks)
    ) {
      //fetch number of tasks user completed
      _.filter(nextProps.all_annotation_tasks.annotation_tasks, {
        type: 'contributor',
        status: 'active'
      }).forEach(task => {
        this.props.fetchContributorReviewsCount(task.id, {});
      });
    }
  }

  redirectToContributorPage = e => {
    e.preventDefault();

    this.context.router.push({
      pathname: '/admin-contributor'
    });
  };

  panelHeader = (panel, task_item = {}) => {
    /*
      Accordion panel header vars
    */
    const onboarding =
      panel === 'onboarding' ? !this.state.panel_open.onboarding : this.state.panel_open.onboarding;
    const contributor_panel =
      panel === 'contributor_panel'
        ? !this.state.panel_open.contributor_panel
        : this.state.panel_open.contributor_panel;

    const header_txt = panel === 'onboarding' ? 'Onboarding Progress' : task_item.name;
    const total_complete_in_month = this.props.contributor_reviews.contributor_reviews_count
      .current_month_total;

    const checkmark_logic =
      panel === 'onboarding'
        ? this.props.total_points === this.props.possible_total_points
        : total_complete_in_month >= REQUIRED_REVIEWS_NUM_MONTHLY;
    const arrow_status = this.state.panel_open[panel] ? 'keyboard_arrow_up' : 'keyboard_arrow_down';

    return (
      <div
        className="panel-header-text-container"
        onClick={() =>
          this.setState({
            panel_open: {
              onboarding,
              contributor_panel
            }
          })}
      >
        <div className="header-check-container">
          <h4>{header_txt}</h4>
          {!_.isEmpty(task_item) ? <i className="material-icons assignment">error</i> : null}
          {checkmark_logic ? <i className="material-icons check">done</i> : null}
        </div>
        <i className="material-icons">{arrow_status}</i>
      </div>
    );
  };

  render() {
    /*
      As per request by product, surpressing the Accordion when user
      is NOT a contributor as they will not have any tasks to complete.
    */
    if (!_.includes(this.props.current_user.user.roles, 'contributor')) {
      return null;
    }

    let docPoints = 0;
    let myStuffPoints = 0;
    let navigationPoints = 0;
    let searchPoints = 0;
    let sourceSelectionPoints = 0;

    if (this.props.scores.onboarding && this.props.scores.onboarding['Doc Actions']) {
      docPoints = this.props.scores.onboarding['Doc Actions'].points;
      myStuffPoints = this.props.scores.onboarding['My Stuff'].points;
      navigationPoints = this.props.scores.onboarding.Navigation.points;
      searchPoints = this.props.scores.onboarding.Search.points;
      sourceSelectionPoints = this.props.scores.onboarding['Source Selection'].points;
    }

    const docPointsClasses = points => {
      const level = points / 5; //there are 6 total levels. show a check for level 6
      const levels = ['a', 'b', 'c', 'd', 'e', 'f'];
      if (level === 6) {
        return 'done';
      }
      return classnames({
        docPoints: true,
        [levels[level]]: true
      });
    };

    const myStuffPointsClasses = points => {
      const level = points / 10;
      const levels = ['a', 'b'];
      if (level === 2) {
        return 'done';
      }
      return classnames({
        myStuffPoints: true,
        [levels[level]]: true
      });
    };

    const navigationPointsClasses = points => {
      const level = points / 5;
      const levels = ['a', 'b', 'c'];
      if (level === 3) {
        return 'done';
      }
      return classnames({
        navigationPoints: true,
        [levels[level]]: true
      });
    };
    let name = '';
    if (!_.isNil(this.props.current_user.user.first_name)) {
      name = `${this.props.current_user.user.first_name}'s `;
    }

    const getTooltip = text => {
      const tooltip = <Tooltip id="tooltip">{text}</Tooltip>;
      return tooltip;
    };

    const contributor_panels = () => {
      const contributor_tasks = _.filter(this.props.all_annotation_tasks.annotation_tasks, {
        type: 'contributor',
        status: 'active'
      });

      return _.sortBy(contributor_tasks, task => task.name).map((task, i) => {
        const key = _.add(i + 2).toString();
        return (// FIXME: HTML configured for only one task, will need updates with new tasks
          <Panel
            className="acoord-panel contributor-panel"
            header={this.panelHeader('contributor_panel', task)}
            eventKey={key}
          >
            <h5>Help us find errors in documents and earn a free month of service!</h5>
            <Button bsClass="contributor-button" onClick={e => this.redirectToContributorPage(e)}>
              {task.name}
            </Button>
          </Panel>
        );
      });
    };

    /*
      XXX: Essentially muting onboarding_panel here as product asks to keep in codebase
      for potential future resurrection
      see for more details: https://complianceai.atlassian.net/browse/PRO-144
    */
    const onboarding_panel = !_.includes(this.props.current_user.user.roles, 'contributor') ? (
      <Panel className="acoord-panel" header={this.panelHeader('onboarding')} eventKey="1">
        <div className="statusContainer">
          <div className="status">
            <i className="material-icons check">done</i>
            <h5 className="statusTitle">Profile Set Up</h5>
          </div>

          <OverlayTrigger
            className="overlay"
            placement="bottom"
            overlay={getTooltip(
              'Bookmark, Add to Folder, Email, Print, Download, Export to CSV'
            )}
          >
            <div className="status">
              {docPointsClasses(docPoints) === 'done' ? (
                <div>
                  <i className="material-icons check">done</i>
                </div>
              ) : (
                <div className="pointsContainer">
                  <div className={docPointsClasses(docPoints)} />
                </div>
              )}
              <h5 className="statusTitle">Doc Actions</h5>
            </div>
          </OverlayTrigger>

          <OverlayTrigger
            className="overlay"
            placement="bottom"
            overlay={getTooltip('Add New Folder, Save Search')}
          >
            <div className="status">
              {myStuffPointsClasses(myStuffPoints) === 'done' ? (
                <i className="material-icons check">done</i>
              ) : (
                <div className="pointsContainer">
                  <div className={myStuffPointsClasses(myStuffPoints)} />
                </div>
              )}
              <h5 className="statusTitle">My Stuff</h5>
            </div>
          </OverlayTrigger>

          <OverlayTrigger
            className="overlay"
            placement="bottom"
            overlay={getTooltip('Timeline, News, State Codes')}
          >
            <div className="status">
              {navigationPointsClasses(navigationPoints) === 'done' ? (
                <i className="material-icons check">done</i>
              ) : (
                <div className={navigationPointsClasses(navigationPoints)} />
              )}
              <h5 className="statusTitle">Navigation</h5>
            </div>
          </OverlayTrigger>

          <div className="status">
            {searchPoints >= 10 ? (
              <i className="material-icons check">done</i>
            ) : (
              <button
                onClick={this.props.highlightSearch}
                className="btn-default btn-xs tryIt"
              >
                Try it
              </button>
            )}
            <h5 className="statusTitle">Search</h5>
          </div>

          <div className="status">
            {sourceSelectionPoints >= 10 ? (
              <i className="material-icons check">done</i>
            ) : (
              <Link to={'/sources'}>
                <button className="btn-default btn-xs tryIt" type="button">
                  Try it
                </button>
              </Link>
            )}
            <h5 className="statusTitle">Following</h5>
          </div>
        </div>
      </Panel>
    ) : null;

    return (
      <div className="summaryContainer leaderboard" id="leaderboardee">
        <div className="summary">
          <h2 id="profileTitle">{name}Compliance.ai Tasks</h2>
          <NewFeatureTooltip
            targetId="profileTitle"
            content={`Check here for new features and monthly challenges`}
            featureId="6"
            readyToDisplay
          />
          <Accordion>
            {onboarding_panel}
            {contributor_panels()}
          </Accordion>
        </div>
      </div>
    );
  }
}

DashLeaderboard.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    scores: state.contributor_points.scores,
    total_points: state.contributor_points.scores.onboarding.totalPoints,
    possible_total_points: 85, //Hardcoding total here as actual total does not work for now
    current_user: state.current_user,
    all_annotation_tasks: state.all_annotation_tasks,
    contributor_reviews: state.contributor_reviews
  };
};

const ReduxDashLeaderboard = connect(mapStateToProps, {
  openSourceSelection,
  highlightSearch,
  fetchAllAnnotationTasks,
  fetchContributorReviewsCount,
  fetchCurrentUser
})(DashLeaderboard);

export default ReduxDashLeaderboard;
