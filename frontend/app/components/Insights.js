import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { fetchInsightsGraphData } from '../../shared/actions';
import EnforcementHeatmap from './EnforcementHeatmap';
import RulesByAgency from './RulesByAgency';
import GraphEnforcementActions from './GraphEnforcementActions';
import GraphActiveAgencies from './GraphActiveAgencies';

class Insights extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      direction: null
    };
  }
  componentWillMount() {
    if (!this.props.insights_graphs.isFetching) {
      this.props.fetchInsightsGraphData();
    }
  }

  _navigateSearch = params => {
    // this is pretty terrible, delete the leftover tooltip generated by NVD3
    // probably should find a better way to do this
    const tooltips = document.querySelectorAll('.nvtooltip');

    for (const t of tooltips) {
      t.parentNode.removeChild(t);
    }

    this.context.router.push({
      pathname: '/content',
      query: params
    });
  };

  handleSelect = (selectedIndex, e) => {
    this.setState({
      index: selectedIndex,
      direction: e.direction
    });
  };

  render() {
    return (
      <div className="visualInsights">
        <GraphEnforcementActions navigateSearch={this._navigateSearch} />
        <EnforcementHeatmap />
        <RulesByAgency navigateSearch={this._navigateSearch} />
        <GraphActiveAgencies navigateSearch={this._navigateSearch} />
      </div>
    );
  }
}

Insights.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    insights_graphs: state.insights_graphs
  };
};

const ReduxInsights = connect(mapStateToProps, { fetchInsightsGraphData })(
  Insights
);

export default ReduxInsights;
