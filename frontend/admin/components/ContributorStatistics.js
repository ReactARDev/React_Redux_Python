import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchContributorStatistics, fetchAllAnnotationTasks } from '../../shared/actions';
import _ from 'lodash';
import { Table } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { CSVLink } from 'react-csv';

class ContributorStatistics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      from_date: null,
      to_date: null
    };
  }

  componentDidMount() {
    this.props.fetchAllAnnotationTasks().then(response => {
      // Currently only one contributor task should exist.
      // Should be updated in case multiple contributor tasks.
      const task = _.find(response.annotation_tasks, { type: 'contributor', status: 'active' });
      if (task) {
        this.setState({ task_id: task.id });
        this.props.fetchContributorStatistics(task.id, {});
      }
    });
  }

  handleFromDateChange = date => {
    this.setState({ from_date: date });

    const params = {};
    if (date) {
      params.from_date = date.format('MM/DD/YYYY');
    }
    if (this.state.to_date) {
      params.to_date = this.state.to_date.format('MM/DD/YYYY');
    }
    this.props.fetchContributorStatistics(this.state.task_id, params);
  };

  handleToDateChange = date => {
    this.setState({ to_date: date });

    const params = {};
    if (date) {
      params.to_date = date.format('MM/DD/YYYY');
    }
    if (this.state.from_date) {
      params.from_date = this.state.from_date.format('MM/DD/YYYY');
    }
    this.props.fetchContributorStatistics(this.state.task_id, params);
  };

  render() {
    if (!this.props.annotation_task.contributor_statistics) {
      return null;
    }

    const total_display = (total, approved, flagged) => {
      const result = [];
      result.push(
        <div key={result.length}>
          <p>Total: {total}</p>
          <p>
            {approved}
            <i className="fa fa-check is-positive" />/
            {flagged}
            <i className="fa fa-times is-negative" />
          </p>
        </div>
      );
      return result;
    };

    const stat = this.props.annotation_task.contributor_statistics;
    const list_items = [];
    const csv_data = [];
    csv_data.push(_.concat('user', 'total', 'approved', 'flagged', 'accepted', 'dismissed'));
    // create table rows and data for csv export
    _.forOwn(stat, (value, key) => {
      if (key !== 'total') {
        let total = 0;
        let approved = 0;
        let flagged = 0;
        if (value.approved) {
          total += value.approved;
          approved = value.approved;
        }
        if (value.flagged) {
          total += value.flagged;
          flagged = value.flagged;
        }

        list_items.push(
          <tr key={list_items.length}>
            <td>{key}</td>
            <td>{total_display(total, approved, flagged)}</td>
            <td>{value.accepted}</td>
            <td>{value.dismissed}</td>
          </tr>
        );

        csv_data.push(_.concat(key, total, approved, flagged, value.accepted, value.dismissed));
      }
    });

    return (
      <div>
        <h1>Contributor Statistics</h1>
        <div className="contributor-statistics-csv-link">
          <CSVLink data={csv_data} filename="ContributorStatistics.csv">
            Export to csv
          </CSVLink>
        </div>
        <span>Reviewed</span>
        <DatePicker
          className="contributor-review-date"
          placeholderText="From"
          selected={this.state.from_date}
          onChange={this.handleFromDateChange}
          isClearable
        />
        <DatePicker
          className="contributor-review-date"
          placeholderText="To"
          selected={this.state.to_date}
          onChange={this.handleToDateChange}
          isClearable
        />
        <Table striped condensed hover>
          <thead>
            <tr>
              <th>User</th>
              <th>Documents Reviewed</th>
              <th>Changes Accepted</th>
              <th>Changes Dismissed</th>
            </tr>
          </thead>
          <tbody>{list_items}</tbody>
        </Table>
      </div>
    );
  }
}

ContributorStatistics.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchContributorStatistics: (id, params) => {
      return dispatch(fetchContributorStatistics(id, params));
    },
    fetchAllAnnotationTasks: (task_id, params) => {
      return dispatch(fetchAllAnnotationTasks(task_id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    contributor_statistics: state.contributor_statistics,
    annotation_task: state.annotation_task
  };
};

const ReduxContributorStatistics = connect(mapStateToProps, mapDispatchToProps)(
  ContributorStatistics
);

export default ReduxContributorStatistics;
