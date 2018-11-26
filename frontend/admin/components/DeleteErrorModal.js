import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';

class DeleteErrorModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    let error_text = 'Unspecified error';
    if (this.props.errorText.includes('unsuccessful')) {
      error_text = 'Error: Delete unsuccessful. Something went wrong :(';
    } else if (this.props.errorText.includes('doesn\'t exist')) {
      error_text = `Error: ${this.props.email} not found.`;
    }

    return (
      <Modal
        show={this.props.showModal}
        onHide={this.props.close_error_modal}
      >
        <Modal.Header>
          <Modal.Title>{this.props.email}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error_text}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.close_error_modal}>Okay</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

DeleteErrorModal.contextTypes = {
  router: PropTypes.object
};

export default DeleteErrorModal;
