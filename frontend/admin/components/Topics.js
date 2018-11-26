import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Button } from 'react-bootstrap';
import TopicModal from './TopicModal';
import { fetchAllTopics } from '../../shared/actions';

class Topics extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  componentWillMount() {
    this.props.fetchAllTopics();
  }

  openModal = (id) => {
    this.setState({ showModal: true, id });
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  updateTable = () => {
    this.props.fetchAllTopics();
  };


  render() {
    if (
      !this.props.all_topics ||
      !this.props.all_topics.isReady
    ) {
      return null;
    }

    const list_items = [];

    const topics = this.props.all_topics.items.topics;


    topics.forEach(entity => {
      list_items.push(
        <tr key={entity.id} onClick={() => this.openModal(entity.id)}>
          <td>
            {entity.name}
          </td>
          <td>
            {entity.description}
          </td>
          <td>
            {entity.active_streaming ? "True" : "False"}
          </td>
          <td>
            {entity.active_backfill ? "True" : "False"}
          </td>
          <td>
            {entity.active_indexer ? "True" : "False"}
          </td>
          <td>
            {
              // note: 0.99 is the default system (not topic-specific) threshold
              entity.prediction_surfacing_threshold ? entity.prediction_surfacing_threshold : 0.99
            }
          </td>
        </tr>
      );
    });

    return (
      <div className="topics-container">
        <h1>Topics</h1>
        <Button bsStyle="primary" onClick={() => this.openModal()}>
          Create
        </Button>
        <Table striped condensed hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Active Streaming</th>
              <th>Active Backfill</th>
              <th>Active Indexer</th>
              <th>Prediction surfacing threshold</th>
            </tr>
          </thead>
          <tbody>
            {list_items}
          </tbody>
        </Table>
        <TopicModal
          close={this.closeModal}
          showModal={this.state.showModal}
          id={this.state.id}
          updateTable={this.updateTable}
        />
      </div>
    );
  }
}

Topics.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllTopics: () => {
      dispatch(fetchAllTopics());
    }
  };
};

const mapStateToProps = state => {
  return {
    all_topics: state.all_topics
  };
};

const ReduxTopics = connect(mapStateToProps, mapDispatchToProps)(Topics);

export default ReduxTopics;
