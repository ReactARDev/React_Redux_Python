import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import Tabs, { Tab } from 'material-ui/Tabs';
import classnames from 'classnames';
import DashTimelineTableItem from './DashTimelineTableItem';
import { safe_analytics } from '../../shared/utils/analytics';
import {
  updateCurrentUser,
  fetchCurrentUser,
  fetchRecentActivity,
  notificationsUpdate
} from '../../shared/actions';
import { update_viewed_agencies, fetchRecent } from '../utils/notifications';

class DashTimelineTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      agencyId: null,
      slideNumber: 0,
      sorted_agency_carousel_items: [],
      agencies_with_new_docs: [],
      agencies_viewed: {}
    };
  }
  componentWillMount() {
    if (_.has(this.props.location, 'state.fromDashboard.timelineTable.agencyId')) {
      this.setState({ agencyId: this.props.location.state.fromDashboard.timelineTable.agencyId });
    }
    if (_.has(this.props.location, 'state.fromDashboard.timelineTable.slideNumber')) {
      this.setState({
        slideNumber: this.props.location.state.fromDashboard.timelineTable.slideNumber
      });
    }

    if (
      !this.props.recent_activity.isFetching &&
      !this.props.current_user.isFetching &&
      !this.props.agencies.isFetching
    ) {
      fetchRecent(this.props);
    }
  }

  componentDidMount() {
    if (_.has(this.props.location, 'state.fromDashboard.timelineTable.inner')) {
      const scrollInner = this.props.location.state.fromDashboard.timelineTable.inner;
      document.querySelector('.timelineTable .table-responsive').scrollTop = scrollInner;
    }
  }

  componentWillReceiveProps(nextProps) {
    const sortedDocsByAgency = this.sortDocsByAgency(nextProps.docsByAgency);
    if (Object.keys(nextProps.docsByAgency).length > 0 && this.state.agencyId === null) {
      const firstAgency = sortedDocsByAgency[0];
      this.setState({ agencyId: firstAgency });
    }

    /*
      Set the carousel_items and agencies_with_new_docs in this.state to make sure that the
      array being run through setNotifAgencyFirst() method are consistent with the
      one's displayed by render()
    */
    this.setState({
      sorted_agency_carousel_items: sortedDocsByAgency,
      agencies_with_new_docs: nextProps.recent_activity.document_stats.map(newAgency => {
        return newAgency.agency_id;
      }),
      agencies_viewed:
        nextProps.current_user.user.properties &&
        nextProps.current_user.user.properties.agencies_viewed
          ? nextProps.current_user.user.properties.agencies_viewed
          : {}
    });
  }

  sortDocsByAgency = docsByAgency => {
    return Object.keys(docsByAgency).sort((id_a, id_b) => {
      if (
        (docsByAgency[id_a].agencyShortName || docsByAgency[id_a].agencyName) >
        (docsByAgency[id_b].agencyShortName || docsByAgency[id_b].agencyName)
      ) {
        return 1;
      } else if (
        (docsByAgency[id_a].agencyShortName || docsByAgency[id_a].agencyName) <
        (docsByAgency[id_b].agencyShortName || docsByAgency[id_b].agencyName)
      ) {
        return -1;
      }
      return 0;
    });
  };
  viewFullTimeline = () => {
    this.context.router.push({
      pathname: '/content',
      query: {
        summary_id: null,
        summary_page: 'summary'
      }
    });
    safe_analytics('default', 'Dashboard', 'View Full Timeline');
  };

  selectAgency = agencyId => {
    this.setState({ agencyId });
    safe_analytics('default', 'Dashboard', 'Select Timeline Source');
    update_viewed_agencies(this.props, agencyId);
  };
  handleClick = agencyId => {
    const pathname = '/content';
    const query = {
      agency: agencyId,
      summary_id: null,
      summary_page: 'summary'
    };

    this.context.router.push({
      pathname,
      query
    });
    safe_analytics('default', 'Dashboard', 'View Source Timeline');
  };

  render() {
    let documents = [];
    let agencyName = '';
    const agencyDocs = this.props.docsByAgency[this.state.agencyId];
    if (!_.isNil(agencyDocs)) {
      documents = agencyDocs.docs;
      agencyName = agencyDocs.agencyShortName || agencyDocs.agencyName;
    }
    const carouselItems =
      this.state.sorted_agency_carousel_items.length <= 0 ? (
        null
      ) : (
        this.state.sorted_agency_carousel_items.map((agencyId, i) => {
          const agency = this.props.docsByAgency[agencyId];
          const tabClasses = classnames({
            agencyTab: true,
            currentTab: this.state.agencyId === agencyId
          });
          const tabTextClasses = classnames({
            tabText: true,
            currentTab: this.state.agencyId === agencyId
          });
          const tabDocCountClasses = classnames({
            tabDocCount: true,
            currentTab: this.state.agencyId === agencyId
          });
          return (
            <Tab
              label={
                <div className={tabTextClasses}>
                  {_.includes(this.state.agencies_with_new_docs, agencyId) &&
                  !this.state.agencies_viewed[agencyId] ? (
                    <div className="notif-bubble" />
                    ) : (
                      <div />
                    )}
                  <span>{agency.agencyShortName || agency.agencyName}</span>
                  &emsp;&emsp;&emsp;&emsp;
                  <span className={tabDocCountClasses}>
                    {this.props.docsByAgency[agencyId].docs.length}
                  </span>
                </div>
              }
              onClick={() => this.selectAgency(agencyId)}
              className={tabClasses}
              key={i}
              disableRipple
            />

          );
        })
      );

    const tbody_classes = {
      scroll: true
    };

    return (
      <div className="timelineTable">
        <h1>
          Agencies You Follow &ensp;<span className="days">Last 7 Days</span>
        </h1>
        <h5 className="subTitle" onClick={() => this.handleClick(this.state.agencyId)}>
          {`View All ${agencyName} Updates`}
        </h5>
        <div className="dash-carousel-timeline-table">
          <div className="agencyTabs row">
            <Tabs
              ref="slider"
              value={this.state.slideNumber}
              onChange={(event, slideNumber) => this.setState({ slideNumber })}
              indicatorColor="primary"
              textColor="primary"
              scrollable
              scrollButtons="auto"
              fullWidth
            >
              {carouselItems}
            </Tabs>
          </div>
          <div className="table-responsive">
            <table className="table">
              <tbody className={classnames(tbody_classes)}>
                {documents.map((doc, i) => (
                  <DashTimelineTableItem
                    agency={agencyName}
                    agencyId={this.state.agencyId}
                    doc={doc}
                    slideNumber={this.state.slideNumber}
                    key={i}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ agencies, recent_documents, recent_activity, current_user }) => {
  let docsByAgency = {};

  const followedAgenciesById = agencies.followed_agencies.reduce((mem, agency) => {
    mem[agency.id] = agency;
    return mem;
  }, {});

  // group documents by agencyId and put them in an object
  if (!_.isNil(recent_documents)) {
    docsByAgency = recent_documents.recent_documents.reduce((mem, doc) => {
      //filter out docs not related to followed agencies
      if (!_.isNil(doc.agencies)) {
        doc.agencies.forEach(agency => {
          if (followedAgenciesById[agency.id]) {
            if (agency.type !== 'state') {
              if (_.isNil(mem[agency.id])) {
                mem[agency.id] = {
                  docs: [doc],
                  agencyName: agency.name,
                  agencyShortName: agency.short_name
                };
              } else {
                mem[agency.id].docs.push(doc);
              }
            }
          }
        });
      }
      return mem;
    }, {});
  }

  return {
    agencies,
    docsByAgency,
    recent_activity,
    current_user,
    user_email: current_user.user.email
  };
};

DashTimelineTable.contextTypes = {
  router: PropTypes.object
};

const ReduxDashTimelineTable = connect(mapStateToProps, {
  updateCurrentUser,
  fetchCurrentUser,
  fetchRecentActivity,
  notificationsUpdate
})(DashTimelineTable);

export default ReduxDashTimelineTable;
