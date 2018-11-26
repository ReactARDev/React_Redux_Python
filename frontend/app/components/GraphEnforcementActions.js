import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchInsightsCsvBySlug } from '../../shared/actions';
import ExportImageButton from './ExportImageButton';
import InsightsGraphBase from './InsightsGraphBase';
import { get_dashboard_params } from '../../shared/utils/insights';
import GraphLoading from './GraphLoading';
class GraphEnforcementActions extends InsightsGraphBase {
  constructor(props) {
    super(props);
    this.state = {
      enforcementsByAgency: []
    };
  }

  componentWillMount() {
    this.props.fetchInsightsCsvBySlug('enforcement-action-12months').then(res => {
      const enforcementsByAgency = res.raw_data.tuples.map(tup => {
        return { label: tup[0], value: tup[1] };
      });
      this.setState({ enforcementsByAgency });
    });
  }

  handleBarClick(e) {
    const params = get_dashboard_params('insights_csv', e.data.label, e.data.key);
    this.props.navigateSearch(params);
  }

  render() {
    return (
      <div className="insights-chart">
        <div className="chart-container" ref="export_top">
          <h3>Enforcement Actions: Last 12 Months</h3>
          {this.state.enforcementsByAgency.length <= 0 ? (
            <GraphLoading />
          ) : (
            <NVD3Chart
              id="my_chart"
              type="pieChart"
              datum={this.state.enforcementsByAgency}
              noData=""
              elementClick={e => this.handleBarClick(e)}
              x="label"
              y="value"
              tooltip={{
                valueFormatter(d) {
                  return Math.round(d);
                }
              }}
              showLabels={false}
            />
          )}

          <h4 className="label">
            Data reflects agency's publish date (not issue date). Updated weekly on Sunday.
          </h4>
          <ExportImageButton
            getElem={() => this.getExportElem()}
            filename="EnforcementActionsPastYear.png"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

export default connect(mapStateToProps, { fetchInsightsCsvBySlug })(GraphEnforcementActions);
