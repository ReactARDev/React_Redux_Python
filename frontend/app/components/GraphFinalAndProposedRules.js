import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchInsightsCsvBySlug } from '../../shared/actions';
import ExportImageButton from './ExportImageButton';
import InsightsGraphBase from './InsightsGraphBase';
import _ from 'lodash';

class GraphFinalAndProposedRules extends InsightsGraphBase {
  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
  }
  componentWillMount() {
    this.props.fetchInsightsCsvBySlug('final-and-proposed-rules').then(res => {
      const data = [
        {
          key: 'Proposed Rule',
          values: []
        },
        { key: 'Final Rule', values: [] }
      ];

      const sortedTuples = _.sortBy(res.raw_data.tuples, d => d[0]);
      sortedTuples.forEach(tup => {
        if (tup[1] === 'Proposed Rule') {
          data[0].values.push({ label: tup[0], value: tup[2] });
        }
        if (tup[1] === 'Final Rule') {
          data[1].values.push({ label: tup[0], value: tup[2] });
        }
      });
      this.setState({ data });
    });
  }

  render() {
    return (
      <div className="insights-chart">
        <div className="chart-container" ref="export_top" id='GraphFinalAndProposedRules'>
          <h3>Final & Proposed Rules</h3>
          <NVD3Chart
            id="my_chart"
            type="multiBarChart"
            datum={this.state.data}
            x="label"
            y="value"
            stacked
            yAxis={{
              tickFormat: d => d.toFixed(0)
            }}
            tooltip={{
              valueFormatter(d) {
                return Math.round(d);
              }
            }}
          />
          <div className="label">
            Final and proposed rules published in the past 12 months. Updated weekly on Sunday.
          </div>
          <ExportImageButton
            getElem={() => this.getExportElem()}
            filename="FinalAndProposedRules.png"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

export default connect(mapStateToProps, { fetchInsightsCsvBySlug })(GraphFinalAndProposedRules);
