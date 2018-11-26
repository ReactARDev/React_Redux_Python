import React from 'react';
import { Modal } from 'react-bootstrap';
import Feedback from './Feedback';

const SuggestionBox = props => {
  return (
    <Modal show onHide={props.modalClose} className="suggestion-box-modal">
      <Feedback modalClose={props.modalClose} />
    </Modal>
  );
};

export default SuggestionBox;
