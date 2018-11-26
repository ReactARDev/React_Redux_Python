import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { fetchAllSkippedAnnotations } from '../../shared/actions';
import { Table } from 'react-bootstrap';
import SkippedJobItem from './SkippedJobItem';

class SkippedDocuments extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {
    this.props.fetchAllSkippedAnnotations();
  }

  render() {
    if (!this.props.all_skipped_annotations || !this.props.all_skipped_annotations.isReady) {
      return null;
    }

    const list_items = [];
    const skipped_annotations = this.props.all_skipped_annotations.skipped_annotations;

    skipped_annotations.forEach(job => {
      list_items.push(
        <SkippedJobItem
          key={job.job_id}
          job={job}
          update_table={this.props.fetchAllSkippedAnnotations}
        />
      );
    });

    return (
      <div>
        <h1>Skipped Documents</h1>
        <Table striped condensed hover>
          <thead>
            <tr>
              <th>User(annotator)</th>
              <th>Doc ID</th>
              <th>Topic</th>
              <th>Date Skipped</th>
              <th>Annotator Notes</th>
              <th>Annotate (select one)</th>
            </tr>
          </thead>
          <tbody>{list_items}</tbody>
        </Table>
      </div>
    );
  }
}

SkippedDocuments.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllSkippedAnnotations: () => {
      return dispatch(fetchAllSkippedAnnotations());
    }
  };
};

const mapStateToProps = state => {
  return {
    all_skipped_annotations: state.all_skipped_annotations
  };
};

const ReduxSkippedDocuments = connect(mapStateToProps, mapDispatchToProps)(SkippedDocuments);

export default ReduxSkippedDocuments;
