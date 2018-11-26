import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';
import InsightsGraphBase from './InsightsGraphBase';
import ExportImageButton from './ExportImageButton';
import { get_dashboard_params } from '../../shared/utils/insights';

const COLORS = {
  'Final Rule': '#0086d4',
  'Proposed Rule': '#7c13a4'
};

class RulesByQuarter extends InsightsGraphBase {
  handleBarClick(e) {
    const params = get_dashboard_params('rules_by_quarter');
    this.props.navigateSearch(params);
  }
  render() {
    const props = this.props;
    const earliest_year = moment().year() - 3;

    const getRulesByQuarter = () => {
      const rules_by_quarter_data = props.insights.rules_by_quarter;

      const agencies = _.get(
        rules_by_quarter_data,
        ['aggregations', 'filtered_documents', 'by_agencies.name', 'buckets'],
        []
      );

      const quarter_data = {};

      for (const agency_bucket of agencies) {
        const quarters = _.get(agency_bucket, 'by_quarter.buckets', []);

        for (const quarter_bucket of quarters) {
          const date = moment.utc(quarter_bucket.key);
          const month = date.month();
          const quarter_idx = Math.floor(month / 3);

          const categories = _.get(quarter_bucket, 'by_category.buckets', []);

          for (const category of categories) {
            const cat_name = category.key;

            if (!quarter_data[cat_name]) {
              quarter_data[cat_name] = [0, 0, 0, 0];
            }

            quarter_data[cat_name][quarter_idx] += category.doc_count;
          }
        }
      }

      const data = [];

      for (const category of Object.keys(quarter_data)) {
        const values = [];

        quarter_data[category].forEach((val, i) => {
          values.push({
            label: 'Q' + (i + 1),
            value: val
          });
        });

        data.push({
          key: category,
          values
        });
      }

      return data;
    };
    const getColors = series => {
      return COLORS[series.key];
    };

    return (
      <div className="insights-chart rules-by-quarter">
        <div className="chart-container" ref="export_top">
          <h3>Financial Agency Trends</h3>
          <div className="label">
            {earliest_year} - Present
          </div>
          <NVD3Chart
            id="rules-by-quarter"
            type="multiBarChart"
            datum={getRulesByQuarter}
            color={getColors}
            elementClick={e => this.handleBarClick(e)}
            x="label"
            y="value"
            yAxis={{
              tickFormat: d => d.toFixed(0)
            }}
            xAxis={{
              tickFormat: d => {
                return d;
              },
              axisLabelDistance: -10
            }}
          />
          <div className="label">*Agencies included: CFPB, FDIC, SEC, FRS, OCC</div>
          <ExportImageButton getElem={() => this.getExportElem()} filename="rules-by-quarter.png" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    insights: state.insights_graphs
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxRulesByQuarter = connect(mapStateToProps, mapDispatchToProps)(RulesByQuarter);

export default ReduxRulesByQuarter;
