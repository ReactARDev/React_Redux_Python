import React from 'react';
import NVD3Chart from 'react-nvd3';
import d3 from 'd3';
import { connect } from 'react-redux';
import _ from 'lodash';
import { fetchStatistics } from '../../shared/actions';
import moment from 'moment';
import { agencies_skipped_on_timeline } from '../../app/utils/agency';

// Map category name to dashboard viz category
const VIZ_CATEGORIES = {
  'Final Rule': 'Rule',
  'Proposed Rule': 'Proposed Rule',
  Notice: 'Register Notice',
  'Presidential Document': 'Presidential Document',
  'Agency Update': 'Agency Update',
  'SRO Update': 'Agency Update',
  'Enforcement Document': 'Enforcement',
  'Enforcement Action': 'Enforcement',
  Enforcement: 'Enforcement'
};

const CATEGORY_ORDER = [
  'Agency Update',
  'Enforcement',
  'Rule',
  'Proposed Rule',
  'Register Notice',
  'Presidential Document'
];

class Charts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  // TODO: create a cancelable promise: https://facebook.github.io/react/blog/2015/12/16/ismounted-antipattern.html
  // to fix the React Warning: setState(...): Can only update a mounted or mounting component.
  componentDidMount() {
    this.props.fetchStatistics(this.getParamsChart()).then(response => {
      this.setState({ data: _.cloneDeep(response.aggregations.filtered_documents) });
    });
  }

  componentWillReceiveProps(nextProps) {
    // fetch data if user's followed agencies/sources change
    if (!_.isEqual(this.props.agencies, nextProps.agencies)) {
      this.props.fetchStatistics(this.getParamsChart()).then(response => {
        this.setState({ data: _.cloneDeep(response.aggregations.filtered_documents) });
      });
    }
  }

  getParamsChart = () => {
    const params = {};
    params.terms = ['category'];
    params.histogram_interval = 'day';
    params.date_histogram_format = 'yyyy-MM-dd';
    params.categories = [
      'Agency Update',
      'SRO Update',
      'Enforcement Document',
      'Enforcement Action',
      'Enforcement',
      'Final Rule',
      'Proposed Rule',
      'Notice',
      'Presidential Document'
    ];
    params.skip_agency = agencies_skipped_on_timeline;
    params.followed_agencies = true;
    params.date_range_field = 'publication_date';
    params.from_date = '7d';
    return params;
  };

  // Create an object with default values which will be populated once data is received.
  get_template = () => {
    const time_period = 7;
    const week_ago = moment().subtract(time_period, 'days');
    const template = [];
    let entity;
    let i = 0;
    while (i < time_period) {
      entity = {};
      entity.x = week_ago.add(1, 'day').format('YYYY-MM-DD');
      entity.y = 0;
      entity.order = i;
      template.push(entity);
      i++;
    }
    return template;
  };

  template = _.cloneDeep(this.get_template());

  handleBarClick = e => {
    const params = {};
    params.published_from = moment(e.data.x).format('MM/DD/YYYY');
    params.published_to = moment(e.data.x).format('MM/DD/YYYY');
    params.category = e.data.key;
    this.props.navigateSearch(params);
  }

  render() {
    if (!this.state.data) {
      return null;
    }

    const add_values = (buckets, data_entity) => {
      for (const bucket of buckets) {
        for (const value of data_entity.values) {
          if (value.x === bucket.key_as_string) {
            value.y += parseInt(bucket.doc_count, 10);
          }
        }
      }
    };

    const category_date_map = {};
    let category_name;
    let data;
    const documents = this.state.data;
    for (const category_bucket of documents.by_category.buckets) {
      category_name = VIZ_CATEGORIES[category_bucket.key];
      data = category_date_map[category_name];
      // On the chart we need to combine data from different
      // categories and show it as single category
      if (data) {
        // Add data from date_histogram to exeisted data entity
        add_values(category_bucket.by_day.buckets, data);
      } else {
        //add data to new data entity
        data = {};
        data.key = category_name;
        data.values = _.cloneDeep(this.template);
        add_values(category_bucket.by_day.buckets, data);
        category_date_map[category_name] = data;
      }
    }

    // Create a sorted array of series to display on chart.
    const chart_data = [];
    for (const name of CATEGORY_ORDER) {
      if (category_date_map[name]) {
        chart_data.push(category_date_map[name]);
      }
    }

    const getDates = series => {
      return d3.time.format('%Y-%m-%d').parse(series.x);
    };

    const getTooltip = d => {
      const header = d3.time.format('%d-%b')(d3.time.format('%Y-%m-%d').parse(d.value));
      const headerhtml = '<thead><tr><td colspan="3"><strong class="x-value">' + header +
        '</strong></td></tr></thead>';
      let bodyhtml = '<tbody>';
      const series = d.series;
      series.reverse().forEach(c => {
        bodyhtml = bodyhtml + '<tr><td class="legend-color-guide"><div style="background-color: ' +
        c.color + ';"></div></td><td class="key">' + c.key + '</td><td class="value">' +
        c.value + '</td></tr>';
      });
      bodyhtml += '</tbody>';
      return '<table>' + headerhtml + bodyhtml + '</table>';
    };

    return (
      <div className="agencies-chart">
        <NVD3Chart
          id=""
          type="multiBarChart"
          datum={chart_data}
          noData={"the agencies you follow have no activity in the state and " +
          "timeframe you specified"}
          x={getDates}
          y="y"
          useInteractiveGuideline
          interactiveLayer={{
            tooltip: {
              enabled: true,
              contentGenerator: d => getTooltip(d)
            }
          }}
          showControls={false}
          stacked
          elementClick={e => this.handleBarClick(e)}
          yAxis={{
            tickPadding: 15,
            tickFormat: d => {
              return d;
            }
          }}
          xAxis={{
            tickPadding: 15,
            tickFormat: d => {
              return d3.time.format('%d-%b')(new Date(d));
            }
          }}
          margin={{ right: 70, top: 50 }}
          showLegend={false}
          reduceXTicks={false}
          rotateLabels={-45}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    all_statistics: state.all_statistics,
    agencies: state.agencies
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchStatistics: params => {
      return dispatch(fetchStatistics(params));
    }
  };
};

const ReduxCharts = connect(mapStateToProps, mapDispatchToProps)(Charts);

export default ReduxCharts;
