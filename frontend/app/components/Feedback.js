import React from 'react';
import PropTypes from 'prop-types';
import { Form, ControlLabel, Button } from 'react-bootstrap';
import request from 'reqwest';
import { apiUrl } from '../../shared/config';
import { safe_analytics } from '../../shared/utils/analytics';
import { connect } from 'react-redux';
import { addBanner } from '../../shared/actions';

class Feedback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formStatus: 'empty'
    };
  }

  componentWillUpdate(nextProps, nextState) {
    //do not render if banner in view
    const banner_in_view = this.props.current_view.banner.display;
    if (banner_in_view) {
      return;
    }

    // Render success/error banner when appropriate
    if (nextState.formStatus === 'error') {
      this.props.addBanner('error', true, 'Could not send feedback. Please try again later');
      this.props.modalClose();
    } else if (nextState.formStatus === 'success') {
      this.props.addBanner('feedback_success', true, 'Thanks. Your feedback has been sent');
      this.props.modalClose();
    }
  }

  sendFeedback = e => {
    e.preventDefault();

    safe_analytics('default', 'Feedback', 'Submit Feedback');

    const topics = this.props.topics ? this.props.topics : null;

    request({
      url: `${apiUrl}/feedback`,
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      data: JSON.stringify({ feedback: this.refs.feedback.value, topics }),
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        this.setState({ formStatus: 'success' });
      })
      .catch(error => {
        this.setState({ formStatus: 'error' });
      });
  };

  render() {
    let feedbackForm = null;

    const label = this.props.topics
      ? 'Send Us Topics Beta Feedback'
      : 'Send Compliance.ai Feedback';
    const placeholderTxt = this.props.topics || this.props.requestNewsSource ? '' : 'Describe your issue or share your ideas';

    if (this.state.formStatus !== 'success') {
      feedbackForm = (
        <Form className="feedBackForm" onSubmit={e => this.sendFeedback(e)}>
          <i className="material-icons" onClick={() => this.props.modalClose()}>
            close
          </i>
          <h3 className="feedbackHeader">
            <ControlLabel>{label}</ControlLabel>
          </h3>
          {this.props.topics ? (
            <p className="topics-instructional-txt">
              Tell us about your experience with Compliance.ai Topics. What else would you like to
              see?
            </p>
          ) : null}
          {this.props.requestNewsSource ? (
            <p className="topics-instructional-txt">
              Let us know what news sources you would like to see.
            </p>
          ) : null}
          <textarea ref="feedback" placeholder={placeholderTxt} required />

          <Button className="submit-btn" bsStyle="primary" type="submit">
            {this.state.formStatus === 'error' ? 'Resend' : 'Submit'}
          </Button>
        </Form>
      );
    }

    return (
      <div className="feedback">
        <div className="feedback-container">{feedbackForm}</div>
      </div>
    );
  }
}

// classname to apply to top level container
Feedback.className = 'feedback';

Feedback.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};

const ReduxFeedback = connect(mapStateToProps, {
  addBanner
})(Feedback);

export default ReduxFeedback;
