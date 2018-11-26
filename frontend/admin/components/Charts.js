import React from 'react';
import { connect } from 'react-redux';
import Chart from './Chart';
import DashboardPieChart from './DashboardPieChart';
import DashPopularDocuments from '../../app/components/DashPopularDocuments';

class Charts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  _navigateSearch = params => {
    return;
  }

  render() {
    return (
      <div>
        <Chart navigateSearch={this._navigateSearch} />
        <DashboardPieChart />
        <DashPopularDocuments />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxCharts = connect(mapStateToProps, mapDispatchToProps)(Charts);

export default ReduxCharts;
