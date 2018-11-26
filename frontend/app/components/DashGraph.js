import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TimelineGraph from '../../admin/components/Chart';

class DashGraph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  _navigateSearch = params => {
    this.context.router.push({
      pathname: '/content',
      query: params
    });
  };

  render() {
    return (
      <div className="timelineGraph">
        <h2>
          Recent Federal Activity &ensp;<span className="days">Last 7 Days</span>
        </h2>
        <TimelineGraph navigateSearch={this._navigateSearch} />
      </div>
    );
  }
}

DashGraph.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = state => {
  return {};
};

const ReduxDashGraph = connect(mapStateToProps, {})(DashGraph);

export default ReduxDashGraph;
