import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchAnnotationStatistics } from '../../shared/actions';
import _ from 'lodash';

class AnnotationStatistics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statistics: null
    };
  }

  componentDidMount() {
    this.props.fetchAnnotationStatistics(this.props.task_id, {}).then(response => {
      this.setState({ statistics: response });
    });
  }

  componentWillUpdate(nextProps) {
    if (
      !_.isEqual(this.props.from_date, nextProps.from_date) ||
      !_.isEqual(this.props.to_date, nextProps.to_date)
    ) {
      const params = {};
      if (nextProps.from_date && nextProps.to_date) {
        params.from_date = nextProps.from_date;
        params.to_date = nextProps.to_date;
      } else if (nextProps.from_date) {
        params.from_date = nextProps.from_date;
      } else if (nextProps.to_date) {
        params.to_date = nextProps.to_date;
      }

      this.props.fetchAnnotationStatistics(this.props.task_id, params).then(response => {
        this.setState({ statistics: response });
      });
    }
  }

  render() {
    if (!this.state.statistics) {
      return null;
    }
    const total_positive = this.state.statistics.total.positive;
    const total_negative = this.state.statistics.total.negative;
    const total = total_positive + total_negative;

    const list = [];
    list.push(
      <p>
        <b>Total: </b>
        {total}
      </p>
    );
    _.forOwn(this.state.statistics, (value, key) => {
      if (key !== 'total') {
        list.push(
          <div>
            <b>
              {key}:{' '}
            </b>
            <p>
              {value.positive}
              <i className="fa fa-check is-positive" />/
              {value.negative}
              <i className="fa fa-times is-negative" />/
              {value.skipped}{" "}Skipped
            </p>
          </div>
        );
      }
    });

    return (
      <td>
        {list}
      </td>
    );
  }
}

AnnotationStatistics.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAnnotationStatistics: (id, params) => {
      return dispatch(fetchAnnotationStatistics(id, params));
    }
  };
};

const mapStateToProps = state => {
  return {};
};

const ReduxAnnotationStatistics = connect(mapStateToProps, mapDispatchToProps)(
  AnnotationStatistics
);

export default ReduxAnnotationStatistics;
