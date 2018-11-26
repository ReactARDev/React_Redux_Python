import React from 'react';
import { connect } from 'react-redux';
import DashboardPieChart from '../../admin/components/DashboardPieChart';

class DashDocumentVolume extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div className="summaryContainer documentVolume">
        <div className="summary">
          <h3>
            Compliance.ai Documents <span className="days">last 12 months</span>
          </h3>
          <DashboardPieChart />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

const ReduxDashDocumentVolume = connect(mapStateToProps, {})(DashDocumentVolume);

export default ReduxDashDocumentVolume;
