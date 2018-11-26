import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import {
  fetchPopularSources,
  followAgencies,
  fetchAgencies,
  simpleFetchDocuments,
  fetchDocuments
} from '../../shared/actions';
import { defaultFederalAgenciesObj } from '../../shared/utils/defaultSources';
import { agencies_skipped_on_timeline } from '../utils/agency';
import { categories_skipped_on_timeline } from '../../shared/utils/category';
import { today, sevenDaysAgo } from '../utils/keyDates';
import { safe_analytics } from '../../shared/utils/analytics';

class DashPopularFedSources extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }
  componentDidMount() {
    this.props.fetchPopularSources();
  }
  handleClick = agencyId => {
    this.props.followAgencies({ agencies: [{ id: agencyId, following: true }] }).then(() => {
      this.props.fetchAgencies(true);
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

      this.props.fetchDocuments({
        category: 'News',
        published_from: today,
        published_to: today
      });
      safe_analytics('default', 'Dashboard', 'Popular Fed Source Click');
    });
  };
  render() {
    // if user follows all popular ids, remove component from dashboard
    const pop_ids = _.map(this.props.popular_sources, 'agency_id');
    const followed_ids = _.map(this.props.followedAgencies, 'id');
    if (_.difference(pop_ids, followed_ids).length === 0) {
      return null;
    }
    return (
      <div className="summaryContainer popularFedSources">
        <div className="summary">
          <h2>Popular Federal Agencies</h2>
          {this.props.popular_sources.map((popSource, i) => {
            return defaultFederalAgenciesObj[popSource.agency_id] ? (
              <div className="pop_fed_name" key={i}>
                <span>{i + 1}.</span> {defaultFederalAgenciesObj[popSource.agency_id].name}{' '}
                <span onClick={() => this.handleClick(popSource.agency_id)}>
                  {_.isNil(this.props.followedAgencies[popSource.agency_id]) ? (
                    <i className="material-icons addAgency" title="Follow">
                      add
                    </i>
                  ) : (
                    <i className="material-icons agencyAdded" title="Following">
                      done
                    </i>
                  )}
                </span>
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ popular_sources, agencies }) => {
  const followedAgencies = agencies.followed_agencies.reduce((mem, agency) => {
    mem[agency.id] = agency;
    return mem;
  }, {});
  return { popular_sources: popular_sources.popular_sources, followedAgencies };
};

const ReduxDashPopularFedSources = connect(mapStateToProps, {
  fetchPopularSources,
  followAgencies,
  fetchAgencies,
  simpleFetchDocuments,
  fetchDocuments
})(DashPopularFedSources);

export default ReduxDashPopularFedSources;
