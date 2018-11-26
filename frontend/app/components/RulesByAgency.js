import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';
import InsightsGraphBase from './InsightsGraphBase';
import ExportImageButton from './ExportImageButton';
import { get_dashboard_params } from '../../shared/utils/insights';
import GraphLoading from './GraphLoading';
const default_fin_agencies = ['CFPB', 'FDIC', 'SEC', 'FRS', 'OCC'];

const COLORS = {
  'Final Rule': '#0086d4',
  Enforcement: '#F77C00'
};

class RulesByAgency extends InsightsGraphBase {
  handleBarClick(e) {
    const params = get_dashboard_params('rules_by_agency', e.data.label, e.data.key);
    this.props.navigateSearch(params);
  }
  render() {
    const props = this.props;
    const earliest_year = moment().year() - 3;

    const getRulesByAgency = () => {
      const rules_by_agency_data = props.insights.rules_by_agency;

      const agencies = _.get(
        rules_by_agency_data,
        ['aggregations', 'filtered_documents', 'by_agencies.short_name', 'buckets'],
        []
      );

      const rule_data = {};

      for (const agency of agencies) {
        //ONLY get data related to default financial agencies listed above
        if (default_fin_agencies.indexOf(agency.key) !== -1) {
          const agency_idx = default_fin_agencies.indexOf(agency.key);
          const categories = _.get(agency, 'by_category.buckets', []);

          for (const category of categories) {
            const cat_name = category.key;

            if (!rule_data[cat_name]) {
              rule_data[cat_name] = [0, 0, 0, 0, 0];
            }

            rule_data[cat_name][agency_idx] += category.doc_count;
          }
        }
      }

      const data = [];

      for (const category of Object.keys(rule_data)) {
        const values = [];

        rule_data[category].forEach((val, i) => {
          values.push({
            label: default_fin_agencies[i].toUpperCase(),
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
      <div className="insights-chart rules-by-agency">
        <div className="chart-container" ref="export_top" id="GraphFinancialAgencyTrends">
          <h3>Financial Agency Trends: Dodd-Frank Act</h3>
          <div className="label">{earliest_year} - Present</div>
          {getRulesByAgency().length <= 0 ? (
            <GraphLoading />
          ) : (
            <NVD3Chart
              id="rules-by-agency"
              type="multiBarChart"
              datum={getRulesByAgency()}
              color={getColors}
              elementClick={e => this.handleBarClick(e)}
              showControls={!this.props.current_view.inMobile}
              reduceXTicks={false}
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
          )}
          <div className="label">*Agencies included: CFPB, FDIC, SEC, FRS, OCC</div>
          <div className="label">
            *Note: Measures the number of documents mentioning the Dodd-Frank Act.
          </div>
          <ExportImageButton
            getElem={() => this.getExportElem()}
            filename="financial-industry-trends.png"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    insights: state.insights_graphs,
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxRulesByAgency = connect(mapStateToProps, mapDispatchToProps)(RulesByAgency);

export default ReduxRulesByAgency;
