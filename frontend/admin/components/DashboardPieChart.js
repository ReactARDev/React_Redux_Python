import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchStatistics } from '../../shared/actions';
import _ from 'lodash';

// Map category name to dashboard viz category
const VIZ_CATEGORIES = {
  'Agency Update': 'Agency Update',
  'SRO Update': 'Agency Update',
  'Enforcement Document': 'Agency Update',
  'Enforcement Action': 'Agency Update',
  Enforcement: 'Agency Update',
  'Final Rule': 'Regulatory Document',
  'Proposed Rule': 'Regulatory Document',
  Notice: 'Regulatory Document',
  'Presidential Document': 'Regulatory Document',
  'Regulatory Agenda Item': 'Regulatory Document',
  'State Code': 'State Code',
  'US Code': 'Federal Code',
  News: 'News',
  Whitepaper: 'Whitepaper',
  'US Public Law': 'US Public Law'
};

const CATEGORY_ORDER = [
  'Agency Update',
  'Regulatory Document',
  'State Code',
  'Federal Code',
  'News',
  'Whitepaper',
  'US Public Law'
];

const COLORS = {
  'Agency Update': '#00C1FF',
  'Regulatory Document': '#E22A86',
  'State Code': '#C14AFF',
  'Federal Code': '#6D51FF',
  News: '#2AE2BF',
  Whitepaper: '#FFDC00',
  'US Public Law': '#FF5B00'
};

class DashboardPieChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      documents: null
    };
  }

  // TODO: create a cancelable promise: https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
  // to fix the React Warning: setState(...): Can only update a mounted or mounting component.
  componentDidMount() {
    this.props.fetchStatistics(this.getParams()).then(response => {
      this.setState({ documents: response });
    });
  }

  getParams = () => {
    const params = {};
    params.date_range_field = 'created_at';
    params.from_date = '12M';
    params.terms = ['category'];
    params.categories = [
      'Agency Update',
      'SRO Update',
      'Enforcement Document',
      'Enforcement Action',
      'Enforcement',
      'Final Rule',
      'Proposed Rule',
      'Notice',
      'Presidential Document',
      'Regulatory Agenda Item',
      'State Code',
      'US Code',
      'News',
      'Whitepaper',
      'US Public Law'
    ];
    params.all_agencies = true;
    return params;
  };

  render() {
    if (!this.state.documents) {
      return null;
    }

    const category_date_map = {};
    let category_name;
    let data;
    const documents = this.state.documents.aggregations.filtered_documents;
    for (const category_bucket of documents.by_category.buckets) {
      category_name = VIZ_CATEGORIES[category_bucket.key];
      data = category_date_map[category_name];
      // On the chart we need to combine data from different
      // categories and show it as single category
      if (data) {
        // Add data from date_histogram to exeisted data entity
        data.value += parseInt(category_bucket.doc_count, 10);
      } else {
        //add data to new data entity
        data = {};
        data.label = category_name;
        data.value = parseInt(category_bucket.doc_count, 10);
        category_date_map[category_name] = data;
      }
    }

    const round_number = number => {
      if (number > 1000000) {
        return _.round(number / 1000000, 1) + 'm';
      }
      if (number > 1000) {
        return _.round(number / 1000) + 'k';
      }
      return number;
    };

    // TODO: should be interactive
    const total = round_number(parseInt(documents.doc_count, 10));

    // Create a sorted array of series to display on chart.
    const chart_data = [];
    for (const name of CATEGORY_ORDER) {
      if (category_date_map[name]) {
        chart_data.push(category_date_map[name]);
      }
    }

    const getColors = series => {
      return COLORS[series.label];
    };

    return (
      <div className="donut-chart">
        <NVD3Chart
          id="my_chart"
          type="pieChart"
          datum={chart_data}
          x="label"
          y="value"
          color={getColors}
          donut
          donutRatio="0.4"
          showLabels={false}
          title={total}
          tooltip={{
            valueFormatter: d => {
              return round_number(d);
            }
          }}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    all_statistics: state.all_statistics
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchStatistics: params => {
      return dispatch(fetchStatistics(params));
    }
  };
};

const ReduxDashboardPieChart = connect(mapStateToProps, mapDispatchToProps)(DashboardPieChart);

export default ReduxDashboardPieChart;
