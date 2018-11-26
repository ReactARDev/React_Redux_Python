import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table } from 'react-bootstrap';
import { fetchTopicsStats } from '../../shared/actions';

class TopicsStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  componentWillMount() {
    this.props.fetchTopicsStats();
  }

  render() {
    if (
      !this.props.topics_stats ||
      !this.props.topics_stats.isReady
    ) {
      return null;
    }

    const list_items = [];

    const topics = this.props.topics_stats.items.stats;

    const threshhold_89_index = 0;
    const threshhold_92_index = 1;
    const threshhold_94_index = 2;
    const threshhold_96_index = 3;
    const threshhold_98_index = 4;
    const threshhold_100_index = 5;

    topics.forEach(entity => {
      list_items.push(
        <tr key={entity.id} >
          <td>
            {entity.name}
          </td>
          <td>
            {entity.judged}
          </td>
          <td>
            {entity.judged_sum}
          </td>
          <td>
            {entity.positively_judged}
          </td>
          <td>
            {entity.positively_judged_sum}
          </td>
          <td>
            {entity.threshholds[threshhold_89_index].count}
          </td>
          <td>
            {entity.threshholds[threshhold_92_index].count}
          </td>
          <td>
            {entity.threshholds[threshhold_94_index].count}
          </td>
          <td>
            {entity.threshholds[threshhold_96_index].count}
          </td>
          <td>
            {entity.threshholds[threshhold_98_index].count}
          </td>
          <td>
            {entity.threshholds[threshhold_100_index].count}
          </td>
        </tr>
      );
    });

    return (
      <div className="topics-container">
        <h1>Topics Statistics</h1>
        <Table striped condensed hover>
          <thead>
            <tr>
              <th>Topic</th>
              <th>Judged</th>
              <th>Judged sum</th>
              <th>Positvely judged</th>
              <th>Positvely judged sum</th>
              <th>0.0-0.89</th>
              <th>0.90-0.92</th>
              <th>0.93-0.94</th>
              <th>0.95-0.96</th>
              <th>0.97-0.98</th>
              <th>0.99-1.0</th>
            </tr>
          </thead>
          <tbody>
            {list_items}
          </tbody>
        </Table>
      </div>
    );
  }
}

TopicsStats.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchTopicsStats: () => {
      dispatch(fetchTopicsStats());
    }
  };
};

const mapStateToProps = state => {
  return {
    topics_stats: state.topics_stats
  };
};

const ReduxTopicsStats = connect(mapStateToProps, mapDispatchToProps)(TopicsStats);

export default ReduxTopicsStats;
