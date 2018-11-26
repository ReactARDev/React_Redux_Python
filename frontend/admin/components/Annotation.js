import React from 'react';
import { connect } from 'react-redux';
import EditAnnotationModal from './EditAnnotationModal';
import _ from 'lodash';

class Annotation extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showEditAnnotationModal: false };
  }
  closeEditAnnotationModal = () => {
    this.setState({ showEditAnnotationModal: false });
  };
  openEditAnnotationModal = () => {
    this.setState({ showEditAnnotationModal: true });
  };

  render() {
    return (
      <tr onClick={this.openEditAnnotationModal} className="hoverRow">
        <EditAnnotationModal
          {...this.props}
          aggregated_annotation_id={this.props.aggregated_annotation_id}
          showEditAnnotationModal={this.state.showEditAnnotationModal}
          closeEditAnnotationModal={this.closeEditAnnotationModal}
          topicIdToDisplay={this.props.topicIdToDisplay}
          offset={this.props.offset}
        />

        {this.props.fields.map((field, i) => {
          if (field === 'judge') {
            return <td key={i}>{this.props.annotation.annotation_job.user_id}</td>;
          }
          if (field === 'Gold Standard') {
            return (
              <td key={i}>
                {`${this.props.annotation.gold_topic_annotation_id === this.props.annotation.id}`}
              </td>
            );
          }
          if (
            field === 'was_skipped' ||
            field === 'notes' ||
            field === 'user_difficulty' ||
            field === 'arbitrary_tags'
          ) {
            return (
              <td key={i}>
                {`${
                  !_.isNil(this.props.annotation.annotation_job[field])
                    ? this.props.annotation.annotation_job[field]
                    : ''
                }`}
              </td>
            );
          }
          return (
            <td key={i}>
              {Array.isArray(this.props.annotation[field])
                ? this.props.annotation[field].join(',')
                : `${
                    !_.isNil(this.props.annotation[field]) ? `${this.props.annotation[field]}` : ''
                  }`}
            </td>
          );
        })}
      </tr>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

const ReduxAnnotation = connect(mapStateToProps, {})(Annotation);

export default ReduxAnnotation;
