import React from 'react';
import { connect } from 'react-redux';
import AnnotationsModal from './AnnotationsModal';
import { editAggregatedAnnotation, fetchAggregatedAnnotations } from '../../shared/actions';
import _ from 'lodash';

class AnnotationTaskTopicGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAnnotationsModal: false,
      topic_annotations: [],
      fields: [],
      editAggAnnNotes: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const newState = { ...nextProps };
    this.setState(newState);
  }
  getCell = (field, i) => {
    if (field === 'notes') {
      if (this.state.editAggAnnNotes) {
        return (
          <td key={i}>
            <input
              value={this.state[field]}
              onChange={e => this.handleNotesChange(e)}
              onClick={e => e.stopPropagation()}
            />
            <span className="icons">
              <i
                className="material-icons clickable edit-icons check"
                onClick={e => {
                  this.saveAggAnnEdit(e);
                }}
              >
                done
              </i>

              <i
                onClick={e => this.cancelNotesEdit(e)}
                className="material-icons clickable edit-icons"
              >
                clear
              </i>
            </span>
          </td>
        );
      }
      return (
        <td onClick={e => this.makeNotesEditable(e)} key={i}>
          {`${!_.isNil(this.state[field]) ? this.state[field] : ''}`}
        </td>
      );
    }

    return (
      <td key={i}>
        {Array.isArray(this.state[field])
          ? this.state[field].join(',')
          : `${!_.isNil(this.state[field]) ? this.state[field] : ''}`}
      </td>
    );
  };

  cancelNotesEdit = e => {
    e.stopPropagation();
    this.setState({ notes: this.props.notes, editAggAnnNotes: false });
  };
  makeNotesEditable = e => {
    e.stopPropagation();
    this.setState({ editAggAnnNotes: true });
  };
  handleNotesChange = e => {
    this.setState({ notes: e.target.value });
  };
  saveAggAnnEdit = e => {
    e.stopPropagation();
    this.props.editAggregatedAnnotation({ notes: this.state.notes }, this.props.id).then(() => {
      this.props.fetchAggregatedAnnotations(this.props.topicIdToDisplay, {
        offset: this.props.offset
      });
      this.setState({ editAggAnnNotes: false });
    });
  };
  openAnnotationsModal = () => {
    this.setState({ showAnnotationsModal: true });
  };
  closeAnnotationsModal = e => {
    this.setState({ showAnnotationsModal: false });
  };

  render() {
    return (
      <tr onClick={this.openAnnotationsModal} className="hoverRow">
        <AnnotationsModal
          showAnnotationsModal={this.state.showAnnotationsModal}
          closeAnnotationsModal={this.closeAnnotationsModal}
          topic_annotations={this.props.topic_annotations}
          doc_title={this.props.doc_title}
          gold_topic_annotation_id={this.props.gold_topic_annotation_id}
          annotation_task_group_id={this.props.annotation_task_group_id}
          aggregated_annotation_id={this.props.id}
          topicIdToDisplay={this.props.topicIdToDisplay}
          offset={this.props.offset}
        />
        {this.props.fields.map((field, i) => {
          if (field === 'gold annotation' && this.props.gold_topic_annotation_id) {
            const goldAnnotation = this.props.topic_annotations.find(topic_annotation => {
              return topic_annotation.id === this.props.gold_topic_annotation_id;
            });
            return (
              <td key={i}>{!_.isNil(goldAnnotation) ? `${goldAnnotation.is_positive}` : ''}</td>
            );
          }
          return this.getCell(field, i);
        })}
      </tr>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

const ReduxAnnotationTaskTopicGroup = connect(mapStateToProps, {
  fetchAggregatedAnnotations,
  editAggregatedAnnotation
})(AnnotationTaskTopicGroup);

export default ReduxAnnotationTaskTopicGroup;
