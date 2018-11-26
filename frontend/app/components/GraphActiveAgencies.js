import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import Select from 'react-select';
import _ from 'lodash';
import {
  fetchInsightsCsvBySlug,
  fetchDocuments,
  fetchStatistics,
  fetchAgencies
} from '../../shared/actions';
import ExportImageButton from './ExportImageButton';
import InsightsGraphBase from './InsightsGraphBase';
import { agencies_skipped_on_timeline } from '../utils/agency';
import { today, yearAgo, threeMonthsAgo, sixMonthsAgo, twoYearsAgo } from '../utils/keyDates';
import { defaultFederalAgencies } from '../../shared/utils/defaultSources';
import { get_dashboard_params } from '../../shared/utils/insights';
import DocumentFilterDateRange from './DocumentFilterDateRange';
import moment from 'moment';
import GraphLoading from './GraphLoading';

class GraphActiveAgencies extends InsightsGraphBase {
  constructor(props) {
    super(props);
    this.props.fetchAgencies(true);
    this.state = {
      data: {
        'This Year': {},
        'Last Year': {},
        'Last Quarter': {},
        'This Quarter': {},
        Custom: {}
      },
      showDatePicker: false,
      customDates: {
        published_from: yearAgo,
        published_to: today
      },
      source: 'All Agencies',
      followedAgenciesByShortName: {},
      dateRange: 'This Year'
    };
  }

  componentWillMount() {
    this.getGraphData('This Year');
    // special case for last year remove the extra day added
    const oneYearAgo = moment(yearAgo)
      .subtract(1, 'days')
      .format('MM/DD/YYYY');
    this.getGraphData('Last Year', twoYearsAgo, oneYearAgo);
    this.getGraphData('This Quarter', threeMonthsAgo);
    // special case for last quarter remove the extra day added
    const oneQuarterAgo = moment(threeMonthsAgo)
      .subtract(1, 'days')
      .format('MM/DD/YYYY');
    this.getGraphData('Last Quarter', sixMonthsAgo, oneQuarterAgo);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.agencies.isFetching && !nextProps.agencies.isFetching) {
      const followedAgenciesByShortName = nextProps.agencies.followed_agencies.reduce(
        (mem, agency) => {
          mem[agency.short_name] = agency;
          return mem;
        },
        {}
      );
      this.setState({ followedAgenciesByShortName });
    }
  }

  getGraphData = (range = 'thisYear', fromDate = yearAgo, toDate = today) => {
    const params = {};
    params.terms = ['category', 'agencies.short_name'];
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
    params.date_range_field = 'publication_date';
    params.date_range_from = fromDate;
    params.date_range_to = toDate;
    this.props.fetchStatistics(params).then(res => {
      const data = [];
      const agenciesObj = {};
      const masterObj = {};
      // build object of all agencies that had Updates
      res.aggregations.filtered_documents.by_category.buckets.forEach((docType, i) => {
        masterObj[docType.key] = {};
        docType['by_agencies.short_name'].buckets.forEach((agency, j) => {
          defaultFederalAgencies.forEach(ag => {
            if (ag.short_name === agency.key) {
              masterObj[docType.key][agency.key] = agency.doc_count;
              agenciesObj[agency.key] = true;
            }
          });
        });
      });

      // consilidate these under 'Enforcement'
      const consolidate = ['Enforcement Action', 'Enforcement Document'];
      consolidate.forEach(docType => {
        if (masterObj[docType]) {
          Object.keys(masterObj[docType]).forEach(key => {
            if (_.isNil(masterObj.Enforcement)) {
              masterObj.Enforcement = {};
            }
            if (masterObj.Enforcement[key]) {
              masterObj.Enforcement[key] += masterObj[docType][key];
            } else {
              masterObj.Enforcement[key] = masterObj[docType][key];
            }
          });
          delete masterObj[docType];
        }
      });
      const agenciesArray = _.sortBy(Object.keys(agenciesObj));
      Object.keys(masterObj).forEach(docType => {
        let filtered_doc_type = docType;

        if (docType === 'Final Rule') {
          filtered_doc_type = 'Rule';
        } else if (docType === 'Notice') {
          filtered_doc_type = 'Register Notice';
        }
        const docTypeObj = {
          key: filtered_doc_type,
          values: []
        };
        agenciesArray.forEach(agency => {
          if (_.isNil(masterObj[docType][agency])) {
            docTypeObj.values.push({
              label: agency,
              value: 0
            });
          } else {
            docTypeObj.values.push({
              label: agency,
              value: masterObj[docType][agency]
            });
          }
        });
        data.push(docTypeObj);
      });
      const getFollowedAgenciesData = () => {
        const myAgenciesData = [];
        data.forEach((docType, i) => {
          const newDocType = { ...docType };
          const values = [];
          docType.values.forEach(agency => {
            if (this.state.followedAgenciesByShortName[agency.label]) {
              values.push({ ...agency });
            }
          });
          newDocType.values = [...values];
          myAgenciesData.push(newDocType);
        });
        return myAgenciesData;
      };
      const followedAgenciesData = getFollowedAgenciesData();

      const range_dates = {
        published_from: params.date_range_from,
        published_to: params.date_range_to
      };
      const newData = {
        ...this.state.data,
        ...{ [range]: { data, followedAgenciesData, range_dates } }
      };
      this.setState({ data: newData });
    });
  };
  handleBarClick(e) {
    const published_from = this.state.data[this.state.dateRange].range_dates.published_from;
    const published_to = this.state.data[this.state.dateRange].range_dates.published_to;
    const params = get_dashboard_params(
      'fed_Activity',
      e.data.label,
      e.data.key,
      published_from,
      published_to
    );
    this.props.navigateSearch(params);
  }
  handleSourceChange = source => {
    this.setState({ source });
  };
  sourceOptions = [
    {
      value: 'All Agencies',
      label: 'All Agencies'
    },
    {
      value: 'My Agencies',
      label: 'My Agencies'
    }
  ];

  handleRangeChange = range => {
    if (range === 'Custom') {
      this.getGraphData(
        'Custom',
        this.state.customDates.published_from,
        this.state.customDates.published_to
      );
    }
    this.setState({ dateRange: range });
  };

  handleCustomDateChange = (dateType, date) => {
    const customDates = { ...this.state.customDates, ...{ [dateType]: date } };
    if (dateType === 'published_to') {
      this.getGraphData('Custom', this.state.customDates.published_from, date);
    }
    if (dateType === 'published_from') {
      this.getGraphData('Custom', date, this.state.customDates.published_to);
    }
    this.setState({ customDates });
  };

  dateRangeOptions = [
    {
      value: 'This Quarter',
      label: 'This Quarter'
    },
    {
      value: 'Last Quarter',
      label: 'Last Quarter'
    },
    {
      value: 'This Year',
      label: 'This Year'
    },
    {
      value: 'Last Year',
      label: 'Last Year'
    },
    {
      value: 'Custom',
      label: 'Custom'
    }
  ];

  render() {
    if (
      Object.keys(this.state.data['This Year']).length === 0 ||
      (this.state.dateRange === 'Custom' && Object.keys(this.state.data.Custom).length === 0)
    ) {
      // nvd3 will produce an error if the data is not ready
      return null;
    }
    const datePicker = (
      <div className="graphDatepicker">
        <DocumentFilterDateRange
          location={this.props.location}
          from_value={this.state.customDates.published_from}
          to_value={this.state.customDates.published_to}
          query_arg_prefix="published"
          update_function={this.handleCustomDateChange}
          showTo
        />
      </div>
    );
    return (
      <div className="insights-chart fedActivity">
        <div className="chart-container" ref="export_top" id="GraphActiveAgencies">
          <span>
            <h3>
              {'All Federal Activity: '}
              {this.state.dateRange !== 'Custom' ? this.state.dateRange : null}
            </h3>
          </span>
          {this.state.dateRange === 'Custom' ? datePicker : null}
          <div className="selectorContainer">
            <span className="selectSource">
              <Select
                options={this.dateRangeOptions}
                value={this.state.dateRange}
                onChange={range => this.handleRangeChange(range.value)}
              />
            </span>
            <span className="selectSource">
              <Select
                options={this.sourceOptions}
                value={this.state.source}
                onChange={source => this.handleSourceChange(source.value)}
              />
            </span>
          </div>
          {this.state.data[this.state.dateRange].data.length <= 0 ? (
            <GraphLoading />
          ) : (
            <NVD3Chart
              id="my_chart"
              type="multiBarChart"
              stacked
              showControls={!this.props.current_view.inMobile}
              elementClick={e => this.handleBarClick(e)}
              datum={
                this.state.source === 'All Agencies'
                  ? this.state.data[this.state.dateRange].data
                  : this.state.data[this.state.dateRange].followedAgenciesData
              }
              noData={"the agencies you follow have no activity"}
              x="label"
              y="value"
              yAxis={{
                tickFormat: d => d.toFixed(0)
              }}
              xAxis={{
                rotateLabels: -45
              }}
              reduceXTicks={false}
              tooltip={{
                valueFormatter(d) {
                  return Math.round(d);
                }
              }}
            />
          )}
          <ExportImageButton getElem={() => this.getExportElem()} filename="ActiveAgencies.png" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = ({ agencies, current_view }) => {
  return { agencies, current_view };
};

export default connect(mapStateToProps, {
  fetchInsightsCsvBySlug,
  fetchDocuments,
  fetchStatistics,
  fetchAgencies
})(GraphActiveAgencies);
