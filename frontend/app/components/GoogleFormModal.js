import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { contributorFormUri } from '../../shared/config';

export default props => {
  return (
    <Modal className="contributorFormModal" show>
      <Modal.Body className="modalBody">
        <div className="formContainer">
          <iframe src={contributorFormUri} />
        </div>
        <Modal.Footer>
          <Button onClick={props.submittedGoogleForm}>I have submitted the form</Button>
        </Modal.Footer>
      </Modal.Body>
    </Modal>
  );
};
