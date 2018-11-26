import React from 'react';
import Feedback from './Feedback';
import { Modal } from 'react-bootstrap';

class TopicFeedback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      topics_feedback_display_open: false
    };
  }
  modalClose = () => this.setState({ topics_feedback_display_open: false });
  modalOpen = () => this.setState({ topics_feedback_display_open: true });
  render() {
    return (
      <div>
        <div className="topics-guide-feedback-btn" onClick={this.modalOpen}>
          <i className="material-icons">feedback</i>
        </div>
        {this.state.topics_feedback_display_open &&
          <Modal show onHide={this.modalClose} className="suggestion-box-modal">
            <Feedback topics modalClose={this.modalClose} />
          </Modal>}
      </div>
    );
  }
}

export default TopicFeedback;
