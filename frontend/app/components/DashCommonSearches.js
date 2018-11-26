import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchSearchQueries } from '../../shared/actions';
import { invAutosuggest } from '../../shared/utils/autosuggest';
import { safe_analytics } from '../../shared/utils/analytics';

class DashCommonSearches extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.props.fetchSearchQueries();
  }

  handleClick(searchQuery) {
    this.props.postSearchQuery(searchQuery);
    const pathname = '/content';
    const key = Object.keys(searchQuery.search_args)[0];
    /*
      FIXME: API and FE parameters are inconsistent for agencies,
      filter out 'agency_id' temporarily here until the parameter 'agency'
      is replaced with 'agency_id' throughout the FE of the application
     */
    let verifiedKey = key;

    if (key === 'agency_id') {
      //send proper key for comparison to api values in /shared/utils/autosuggest
      verifiedKey = 'agency';
      //remove agency_id from query that is sent to the URL
      searchQuery.search_args.agency = searchQuery.search_args.agency_id;
      delete searchQuery.search_args.agency_id;
    }

    const query = {
      limit: 20,
      search_query: null,
      search_sort: 'date',
      summary_id: null,
      summary_page: 'summary',
      autosuggest_filter: invAutosuggest()[verifiedKey],
      common_search: true,
      ...searchQuery.search_args
    };
    this.context.router.push({
      pathname,
      query
    });
    safe_analytics(
      'Dashboard – Popular Search Click',
      'Dashboard',
      'Popular Search Click',
      searchQuery.display_name
    );
  }
  render() {
    return (
      <div className="summaryContainer commonSearches">
        <div className="summary">
          <h2>Trending Searches</h2>
          {this.props.search_queries.map((searchQuery, i) => {
            return (
              <div
                onClick={() => this.handleClick(searchQuery)}
                title={searchQuery.display_name}
                key={i}
              >
                <h5>{searchQuery.display_name}</h5>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

DashCommonSearches.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ search_queries }) => {
  return { search_queries: search_queries.search_queries };
};

const ReduxDashCommonSearches = connect(mapStateToProps, { fetchSearchQueries })(
  DashCommonSearches
);

export default ReduxDashCommonSearches;
