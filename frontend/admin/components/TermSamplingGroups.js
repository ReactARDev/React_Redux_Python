import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Button } from 'react-bootstrap';
import { fetchAllTermSamplingGroups } from '../../shared/actions';
import TermSamplingGroupsModal from './TermSamplingGroupsModal';

class TermSamplingGroups extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      group_id: null
    };
  }

  componentWillMount() {
    this.props.fetchAllTermSamplingGroups();
  }

  openModal = group_id => {
    this.setState({ showModal: true, group_id });
  };

  closeModal = () => {
    this.setState({ showModal: false, group_id: null });
  };

  updateGroups = () => {
    this.props.fetchAllTermSamplingGroups();
  };

  render() {
    if (!this.props.term_sampling_groups.isReady) {
      return null;
    }

    const list_items = [];

    const groups = this.props.term_sampling_groups.items.term_sampling_groups;

    groups.forEach(group => {
      list_items.push(
        <tr key={group.id} onClick={() => this.openModal(group.id)}>
          <td>
            {group.name}
          </td>
        </tr>
      );
    });

    return (
      <div>
        <h1>Term Sampling Groups</h1>
        <Button bsStyle="primary" onClick={() => this.openModal()}>
          Create
        </Button>
        <Table striped condensed hover>
          <thead>
            <tr>
              <td>Name</td>
            </tr>
          </thead>
          <tbody>
            {list_items}
          </tbody>
        </Table>
        <TermSamplingGroupsModal
          close={this.closeModal}
          showModal={this.state.showModal}
          group_id={this.state.group_id}
          updateGroups={this.updateGroups}
        />
      </div>
    );
  }
}

TermSamplingGroups.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllTermSamplingGroups: () => {
      dispatch(fetchAllTermSamplingGroups());
    }
  };
};

const mapStateToProps = state => {
  return {
    term_sampling_groups: state.term_sampling_groups
  };
};

const ReduxTermSamplingGroups = connect(mapStateToProps, mapDispatchToProps)(TermSamplingGroups);

export default ReduxTermSamplingGroups;
