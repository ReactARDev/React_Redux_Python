import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchInsightsCsvBySlug } from '../../shared/actions';
import { CSVLink } from 'react-csv';

class InsightsCsv extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      slugs: [
        'enforcement-action-12months',
        'busy-agencies',
        'presidential-action-tracker',
        'agency-activity-by-type',
        'final-and-proposed-rules',
        'regulatory-insight',
        'state-regulatory-docs',
        'trending-rulings',
        'consumer-complaints'
      ]
    };
  }

  componentWillMount() {
    let newState = {};
    this.state.slugs.forEach(slug => {
      this.props.fetchInsightsCsvBySlug(slug).then(response => {
        newState = {};
        newState[slug] = response.result;
        this.setState(newState);
      });
    });
  }

  render() {
    const links = [];
    this.state.slugs.forEach((slug, i) => {
      if (this.state[slug]) {
        links.push(
          <li key={i}>
            <CSVLink data={this.state[slug]} filename={slug + '.csv'}>
              {slug + '.csv'}
            </CSVLink>
          </li>
        );
      }
    });

    return (
      <div className="insights-csv-container">
        <h4>Download insights data</h4>
        <ul>
          {links}
        </ul>
      </div>
    );
  }
}

InsightsCsv.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchInsightsCsvBySlug: slug => {
      return dispatch(fetchInsightsCsvBySlug(slug));
    }
  };
};

const mapStateToProps = state => {
  return {
    insights_csv: state.insights_csv
  };
};

const ReduxInsightsCsv = connect(mapStateToProps, mapDispatchToProps)(InsightsCsv);

export default ReduxInsightsCsv;
