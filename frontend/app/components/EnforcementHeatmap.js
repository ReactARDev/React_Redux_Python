import React from 'react';
import { connect } from 'react-redux';
//import _ from 'lodash';
//import moment from 'moment';
//import { smart_title_case } from '../utils/string';
import Heatmap from './Heatmap';
import InsightsGraphBase from './InsightsGraphBase';
import ExportImageButton from './ExportImageButton';

const NUM_ACTS = 5; // API returns more, prevent showing too many

class EnforcementHeatmap extends InsightsGraphBase {
  render() {
    //    const props = this.props;
    //  let buckets = [];

    // comment this out until the heatmap data issues are fixed
    /*
  try {
    const aggregations = props.insights.act_enforcement_matrix.aggregations;
    buckets = aggregations.filtered_documents['by_acts.name'].buckets;
  } catch (e) {
    // noop
  }

  let num_agencies = 3;
  const agency_idx = { cfpb: 0, fdic: 1, sec: 2 };
  const agency_totals = [0, 0, 0];
  const rows = {};
  const act_order = [];

  for (const act of buckets.slice(0, NUM_ACTS)) {
    const act_name = smart_title_case(act.key);
    act_order.push(act_name);

    const row = [];

    for (const agency of act['by_agencies.short_name'].buckets) {
      const agency_name = agency.key;
      let cur_idx = agency_idx[agency_name];

      if (_.isNil(cur_idx)) {
        agency_idx[agency_name] = num_agencies;
        cur_idx = num_agencies;
        agency_totals[cur_idx] = 0;
        num_agencies++;
      }
      row[cur_idx] = agency.doc_count;
      agency_totals[cur_idx] += agency.doc_count;
    }
    rows[act_name] = row;
  }

  // make a second pass through each row and fill in any blank cells
  for (const act_name of Object.keys(rows)) {
    const row = rows[act_name];

    for (let i = 0; i < num_agencies; i++) {
      if (! row[i]) {
        row[i] = 0;
      }
    }
  }

  const header = Object.keys(agency_idx).map(a => a.toUpperCase());

  const start_month = moment().subtract(1, 'year').format('MMMM YYYY');
  const end_month = moment().subtract(1, 'month').format('MMMM YYYY');
  */

    // temporary hard-coded data
    const header = ['CFPB', 'FDIC', 'FRS'];
    const act_order = [
      'Truth in Lending',
      'Consumer Financial Protection Act',
      'Federal Deposit Insurance Act',
      'Electronic Funds Transfer Act',
      'Deposit Insurance Extension Act',
      'Other'
    ];

    const rows = {
      'Truth in Lending': [27.4, 0.5, 0],
      'Consumer Financial Protection Act': [21.3, 0, 0],
      'Federal Deposit Insurance Act': [0.6, 52.9, 42.9],
      'Electronic Funds Transfer Act': [13.1, 0, 0],
      'Deposit Insurance Extension Act': [0, 18.1, 6],
      Other: [37.6, 28.5, 51.1]
    };

    const agency_totals = [100, 100, 100];

    const start_month = 'April 2016';
    const end_month = 'March 2017';

    return (
      <div className="insights-chart enforcement-heatmap">
        <div className="chart-container" ref="export_top">
          <h3>
            Enforcement Actions: Top {NUM_ACTS} Act Violations
          </h3>
          <div className="label">
            {start_month} - {end_month}
          </div>
          <Heatmap
            data={rows}
            header={header}
            act_order={act_order}
            agency_totals={agency_totals}
          />
          <ExportImageButton
            getElem={() => this.getExportElem()}
            filename="top-act-violations.png"
          />
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

const ReduxEnforcementHeatmap = connect(mapStateToProps, mapDispatchToProps)(EnforcementHeatmap);

export default ReduxEnforcementHeatmap;
