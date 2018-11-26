import React from 'react';
import { Modal, Table, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import Annotation from './Annotation';

class AnnotationsModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = { showAnnotationsModal: false };
    this.fields = [
      'doc_id',
      'doc_title',
      'judge',
      'is_positive',
      'was_skipped',
      'notes',
      'user_difficulty',
      'arbitrary_tags',
      'Gold Standard',
      'admin_notes'
    ];
  }

  render() {
    return (
      <Modal show={this.props.showAnnotationsModal} dialogClassName="annotationsModal">
        <Modal.Body>
          <h1>Annotations</h1>
          <Table>
            <thead>
              <tr>{this.fields.map((field, i) => <th key={i}>{field}</th>)}</tr>
            </thead>
            <tbody>
              {this.props.topic_annotations.map(annotation => (
                <Annotation
                  aggregated_annotation_id={this.props.aggregated_annotation_id}
                  annotation_task_group_id={this.props.annotation_task_group_id}
                  annotation={{
                    ...annotation,
                    ...{
                      doc_title: this.props.doc_title,
                      gold_topic_annotation_id: this.props.gold_topic_annotation_id
                    }
                  }}
                  fields={this.fields}
                  key={annotation.id}
                  topicIdToDisplay={this.props.topicIdToDisplay}
                  offset={this.props.offset}
                />
              ))}
            </tbody>
          </Table>
          <Button
            onClick={e => {
              e.stopPropagation();
              this.props.closeAnnotationsModal();
            }}
          >
            close
          </Button>
        </Modal.Body>
      </Modal>
    );
  }
}

const mapStateToProps = state => {
  return { all_annotation_tasks: state.all_annotation_tasks.annotation_tasks };
};

const ReduxAnnotationsModal = connect(mapStateToProps, {})(AnnotationsModal);

export default ReduxAnnotationsModal;
