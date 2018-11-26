import React from 'react';
import { FormGroup, FormControl, ControlLabel, ButtonToolbar, Button } from 'react-bootstrap';
import request from 'reqwest';
import { apiUrl } from '../../shared/config';
import { verifyEmail } from '../../shared/utils/string';

export default class Invite extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      message: '',
      status: 'entry'
    };
  }

  getValidationState() {
    if (!verifyEmail(this.state.email)) {
      return 'error';
    }
    return null;
  }

  handleChange(ev) {
    this.setState({
      email: ev.target.value.trim()
    });
  }

  doSubmit(ev) {
    ev.preventDefault();

    if (!verifyEmail(this.state.email)) {
      this.setState({
        status: 'error',
        message: 'Invalid email address'
      });
      return;
    }

    const url = apiUrl + '/invite';

    let resend = false;

    if (ev.target.id === 'resend') {
      resend = true;
    }

    request({
      url,
      data: JSON.stringify({
        email: this.state.email,
        resend
      }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        this.setState({
          status: 'success',
          message: `Invitation sent to ${this.state.email}`,
          email: ''
        });
      })
      .catch(error => {
        let message;

        try {
          const data = JSON.parse(error.responseText);

          if (data.error) {
            message = data.error;
          }
        } catch (e) {
          // handle below
        }

        if (!message) {
          message = 'Encountered an error. Please try again';
        }

        this.setState({
          status: 'error',
          message
        });
      });
  }

  render() {
    let message = null;
    if (this.state.message) {
      let messageClass = 'bg-success';

      if (this.state.status === 'error') {
        messageClass = 'bg-danger';
      }

      message = (
        <p className={messageClass}>
          {this.state.message}
        </p>
      );
    }

    return (
      <div className="invite-container">
        {message}
        <form onSubmit={e => this.doSubmit(e)}>
          <FormGroup controlId="inviteForm" validationState={this.getValidationState()}>
            <ControlLabel>Invite a user</ControlLabel>
            <FormControl
              type="text"
              value={this.state.email}
              placeholder="Email"
              onChange={e => this.handleChange(e)}
            />
            <FormControl.Feedback />
          </FormGroup>
          <ButtonToolbar>
            <Button bsStyle="primary" id="send" onClick={e => this.doSubmit(e)}>
              Send Invitation
            </Button>
            <Button bsStyle="link" id="resend" onClick={e => this.doSubmit(e)}>
              Resend
            </Button>
          </ButtonToolbar>
        </form>
      </div>
    );
  }
}
