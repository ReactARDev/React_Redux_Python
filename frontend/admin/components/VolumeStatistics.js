import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Table,
  FormGroup,
  Form,
  Col,
  ControlLabel,
  Button,
  FormControl,
  Radio
} from 'react-bootstrap';
import { fetchStatistics } from '../../shared/actions';
import Select from 'react-select';
import moment from 'moment';
import _ from 'lodash';
import DatePicker from 'react-datepicker';

class VolumeStatistics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buckets: '',
      interval: '',
      months: '3M',
      filterBy: '',
      row_objects: [],
      filtered_row_objects: [],
      headers: [],
      from_date: null,
      to_date: null,
      date_type: 'created_at'
    };
  }

  componentWillMount() {
    this.props.fetchStatistics({ all_agencies: true, date_range_field: 'created_at' });
  }

  // Update array of row objects once new data received
  componentWillReceiveProps(nextProps) {
    if (
      !_.isEqual(this.props.all_statistics, nextProps.all_statistics) &&
      nextProps.all_statistics.isReady
    ) {
      const documents = nextProps.all_statistics.statistics.aggregations.filtered_documents;
      const data = [];
      const histogram = this.state.interval ? 'by_' + this.state.interval : '';

      const add_count = (bucket, row_object) => {
        if (histogram && bucket[histogram]) {
          for (const b of bucket[histogram].buckets) {
            row_object[b.key_as_string] = b.doc_count;
          }
        } else {
          row_object.count = bucket.doc_count;
        }
        return row_object;
      };

      const create_row_object = (...values) => {
        const d = {};
        this.filtered_buckets.forEach((bucket_name, i) => {
          d[bucket_name] = values[i];
        });
        return d;
      };

      // recursive approach
      // const visit = (node, row, all_rows) => {
      //   const children = [];
      //   for (const field of Object.getOwnPropertyNames(node.data)) {
      //     if (field !== "key"
      //         && field !== "doc_count"
      //if histogram bucket name found it should be parsed as leaf node
      //         && field !== "by_1M"
      //         && node.data[field].buckets) {
      //       for (const bucket of node.data[field].buckets) {
      //         children.push({aggregation_level: field, key: bucket.key, data: bucket});
      //       }
      //     }
      //   }

      //   for (const child of children) {
      //     row[child.aggregation_level] = child.key;
      //     visit(child, row, all_rows);
      //   }

      //   if (children.length === 0) {
      //     if (histogram) {
      //       if (node.data[histogram]) {
      //         for (const bucket of node.data[histogram].buckets) {
      //           row[bucket.key_as_string] = bucket.doc_count;
      //         }
      //       }
      //     } else {
      //       row.count = node.data.doc_count;
      //     }
      //     all_rows.push(_.cloneDeep(row));
      //   }
      // }

      // const all_rows = [];
      // const node = nextProps.all_statistics.items.aggregations.filtered_documents;
      // visit({data: node}, {}, all_rows);

      let d = {};
      switch (this.filtered_buckets.length) {
        case 0:
          data.push(add_count(documents, d));
          break;
        case 1:
          for (const b1 of documents[this.filtered_buckets[0]].buckets) {
            d = {};
            d[this.filtered_buckets[0]] = b1.key;
            data.push(add_count(b1, d));
          }
          break;
        case 2:
          for (const b1 of documents[this.filtered_buckets[0]].buckets) {
            for (const b2 of b1[this.filtered_buckets[1]].buckets) {
              d = create_row_object(b1.key, b2.key);
              data.push(add_count(b2, d));
            }
          }
          break;
        case 3:
          for (const b1 of documents[this.filtered_buckets[0]].buckets) {
            for (const b2 of b1[this.filtered_buckets[1]].buckets) {
              for (const b3 of b2[this.filtered_buckets[2]].buckets) {
                d = create_row_object(b1.key, b2.key, b3.key);
                data.push(add_count(b3, d));
              }
            }
          }
          break;
        case 4:
          for (const b1 of documents[this.filtered_buckets[0]].buckets) {
            for (const b2 of b1[this.filtered_buckets[1]].buckets) {
              for (const b3 of b2[this.filtered_buckets[2]].buckets) {
                for (const b4 of b3[this.filtered_buckets[3]].buckets) {
                  d = create_row_object(b1.key, b2.key, b3.key, b4.key);
                  data.push(add_count(b4, d));
                }
              }
            }
          }
          break;
        default:
          break;
      }

      const table_headers = this.get_headers();
      // Set 0 in the cell if the bucket with specified date interval wasn't received.
      // If no documents were created for specified date interval
      // then elasticsearch doesn't return bucket with this interval.
      for (const data_obj of data) {
        for (const header of table_headers) {
          if (!data_obj[header]) {
            data_obj[header] = 0;
          }
        }
      }

      this.setState({
        row_objects: data,
        filtered_row_objects: data,
        headers: table_headers
      });
    }
  }

  getParams = () => {
    const params = {};
    // params.months = this.state.months;
    if (this.state.months) {
      params.from_date = this.state.months;
    } else if (this.state.from_date && this.state.to_date) {
      params.date_range_from = this.state.from_date.format('MM/DD/YYYY');
      params.date_range_to = this.state.to_date.format('MM/DD/YYYY');
    } else if (this.state.from_date) {
      params.date_range_from = this.state.from_date.format('MM/DD/YYYY');
    } else if (this.state.to_date) {
      params.date_range_to = this.state.to_date.format('MM/DD/YYYY');
    }

    if (this.state.buckets) {
      params.terms = this.state.buckets.split(',');
    }
    params.histogram_interval = this.state.interval;
    params.all_agencies = true;
    params.date_range_field = this.state.date_type;
    return params;
  };

  get_headers = () => {
    const buckets = this.filtered_buckets;
    let headers;
    if (this.state.interval) {
      headers = _.concat(buckets, this.get_dates());
    } else {
      headers = _.concat(buckets, 'count');
    }
    return headers;
  };

  get_dates = () => {
    const time_period = parseInt(this.state.months.replace(/\D/g, ''), 10);
    const today_month = moment();
    const result = [];
    result.push(today_month.format('YYYY-MM'));
    let i = time_period;
    while (i > 0) {
      result.push(today_month.subtract(1, 'month').format('YYYY-MM'));
      i--;
    }
    return result.reverse();
  };

  handleSelectChange = (field, val) => {
    const new_state = {};
    if (field === 'months') {
      new_state.from_date = null;
      new_state.to_date = null;
    }
    new_state[field] = val;
    this.setState(new_state);
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
    const filteredvalue = event.target.value.toLowerCase();
    const filtered_rows = [];
    for (const rowobj of this.state.row_objects) {
      if (this.bucket_value_match(rowobj, filteredvalue)) {
        filtered_rows.push(rowobj);
      }
    }
    this.setState({ filtered_row_objects: filtered_rows });
  };

  filtered_buckets = [];

  sort_order = {};

  handleFilter = () => {
    this.sort_order = {};
    if (this.state.buckets) {
      this.filtered_buckets = this.state.buckets.split(',').map(bucket_name => 'by_' + bucket_name);
    } else {
      this.filtered_buckets = [];
    }
    this.props.fetchStatistics(this.getParams());
    this.setState({ filterBy: '' });
  };

  bucket_value_match = (rowobj, value) => {
    for (const term of this.filtered_buckets) {
      if (rowobj[term].toLowerCase().indexOf(value) > -1) {
        return true;
      }
    }
    return false;
  };

  sort = value => {
    const order = this.sort_order[value];
    if (order) {
      this.sort_order[value] = order === 'asc' ? 'desc' : 'asc';
    } else {
      this.sort_order[value] = 'desc';
    }

    this.setState({
      filtered_row_objects: _.orderBy(this.state.row_objects, value, this.sort_order[value])
    });
  };

  bucket_options = [
    { value: 'provenance', label: 'Provenance' },
    { value: 'category', label: 'Category' },
    { value: 'spider_name', label: 'Spider Name' },
    { value: 'agencies.short_name', label: 'Agency' }
  ];
  interval_options = [{ value: '1M', label: '1 month' }, { value: '', label: 'No interval' }];
  months_options = [
    { value: '24h', label: 'past 24 hours' },
    { value: '7d', label: 'past 7 days' },
    { value: '1M', label: 'past 1 months' },
    { value: '3M', label: 'past 3 months' },
    { value: '6M', label: 'past 6 months' },
    { value: '12M', label: 'past 12 months' }
  ];

  handleFromDateChange = date => {
    this.setState({ from_date: date, months: null });
  };

  handleToDateChange = date => {
    this.setState({ to_date: date, months: null });
  };

  handleDateFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  render() {
    if (!this.props.all_statistics.isReady) {
      return null;
    }

    const rows = [];
    let header_row = [];

    const add_td = (result, data) => {
      result.push(
        <th key={result.length} onClick={() => this.sort(data)}>
          {data + ''}
          <i className="fa fa-fw fa-sort" />
        </th>
      );
    };

    const create_header_row = arr => {
      const result = [];
      for (const tdata of arr) {
        add_td(result, tdata);
      }

      const header = [];
      header.push(
        <tr className="sortable" key={header.length}>
          {result}
        </tr>
      );
      return header;
    };

    const created_table = header_array => {
      header_row = create_header_row(header_array);

      for (const rowobj of this.state.filtered_row_objects) {
        const temp_row = [];
        for (const header of header_array) {
          temp_row.push(
            <td key={temp_row.length}>
              {rowobj[header]}{' '}
            </td>
          );
        }
        rows.push(
          <tr key={rows.length}>
            {temp_row}
          </tr>
        );
      }
    };

    created_table(this.state.headers);

    return (
      <div className="volume-statistics-container">
        <h1>Volume Statistics</h1>
        <Form horizontal>
          <FormGroup bsSize="small">
            <Col sm={4}>
              <ControlLabel>Date filter</ControlLabel>
              <Select
                options={this.months_options}
                value={this.state.months}
                onChange={obj => this.handleSelectChange('months', obj.value)}
              />
              <div className="volume-statistics-date-container">
                <DatePicker
                  className="volume-statistics-date-picker"
                  placeholderText="From"
                  selected={this.state.from_date}
                  onChange={this.handleFromDateChange}
                  isClearable
                />
                <DatePicker
                  className="volume-statistics-date-picker"
                  placeholderText="To"
                  selected={this.state.to_date}
                  onChange={this.handleToDateChange}
                  isClearable
                />
              </div>
              <div className="volume-stat-radio-btn">
                <Radio
                  name="date_type"
                  value="created_at"
                  inline
                  checked={this.state.date_type === 'created_at'}
                  onChange={e => this.handleDateFieldChange('date_type', e)}
                >
                  created_at date
                </Radio>
                <Radio
                  name="date_type"
                  value="publication_date"
                  inline
                  checked={this.state.date_type === 'publication_date'}
                  onChange={e => this.handleDateFieldChange('date_type', e)}
                >
                  publication date
                </Radio>
              </div>
              <ControlLabel>Group by</ControlLabel>
              <Select
                options={this.bucket_options}
                value={this.state.buckets}
                multi
                onChange={objs =>
                  this.handleSelectChange('buckets', objs.map(obj => obj.value).join(','))}
              />
            </Col>
          </FormGroup>
        </Form>
        <Button bsStyle="primary" bsSize="xsmall" onClick={this.handleFilter}>
          Filter
        </Button>

        <Form horizontal>
          <FormGroup>
            <Col componentClass={ControlLabel} sm={4} smOffset={4}>
              Filter rows
            </Col>
            <Col sm={4}>
              <FormControl
                type="text"
                value={this.state.filterBy}
                onChange={e => this.handleFieldChange('filterBy', e)}
              />
            </Col>
          </FormGroup>
        </Form>

        <Table striped condensed hover>
          <thead>
            {header_row}
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </div>
    );
  }
}

// <Col sm={4}>
//               <ControlLabel>Interval</ControlLabel>
//               <Select
//                 options={this.interval_options}
//                 value={this.state.interval}
//                 onChange={val => this.handleSelectChange('interval', val)}
//               />
//             </Col>

VolumeStatistics.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchStatistics: params => {
      dispatch(fetchStatistics(params));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_statistics: state.all_statistics
  };
};

const ReduxVolumeStatistics = connect(mapStateToProps, mapDispatchToProps)(VolumeStatistics);

export default ReduxVolumeStatistics;
