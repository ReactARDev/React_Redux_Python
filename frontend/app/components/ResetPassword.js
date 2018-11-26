import React from 'react';
import { Link } from 'react-router';
import { apiUrl } from '../../shared/config';
import request from 'reqwest';
import _ from 'lodash';
import { safe_ga, safe_mixpanel_track, safe_analytics } from '../../shared/utils/analytics';
import Bugsnag from 'bugsnag-js';
import { verifyEmail } from '../../shared/utils/string';

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      status: 'entry',
      error: ''
    };
  }

  checkEmail(data) {
    return request({
      url: apiUrl + '/check_email',
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json'
    }).catch(error => {
      if (_.isNil(error.status)) {
        // don't notify on XHR errors
        safe_ga('send', 'exception', {
          exDescription: 'Check Email Activation error',
          exFatal: true
        });
        safe_mixpanel_track('Exception – Check Email Activation error', {
          hitType: 'exception',
          exDescription: 'Check Email Activation error',
          exFatal: true
        });
        Bugsnag.notifyException(error, null);
      }

      this.setState({
        error: 'Unable to activate your account. Please try again later'
      });
    });
  }

  doSubmit(event) {
    if (event) {
      event.preventDefault();
    }

    safe_analytics('default', 'Reset Password', 'Button click', 'Reset Password');

    this.checkEmail({ email: this.state.email }).then(res => {
      const { email_in_use } = res;
      if (!email_in_use) {
        this.setState({
          error: (
            <span>
              This account does not exist. Please
              <Link to={'/activate'}>Sign Up</Link>
              or enter a different email.
            </span>
          )
        });
        return;
      }
      //Send e-mail
      const reqData = {
        email: this.state.email
      };

      if (this.state.status === 'entry') {
        if (!this.state.email) {
          this.setState({
            error: 'Please enter your email address.'
          });
          return;
        }
        if (!verifyEmail(this.state.email)) {
          this.setState({
            error: 'Please enter a valid email address.'
          });
          return;
        }
      }

      request({
        url: apiUrl + '/reset',
        method: 'POST',
        data: JSON.stringify(reqData),
        crossOrigin: true,
        type: 'json',
        contentType: 'application/json'
      })
        .then(response => {
          this.setState({
            status: 'success'
          });
        })
        .catch(error => {
          // XXX check for formatted error from server
          /* this.setState({
         *  errors: response.errors,
         *});
         */

          this.setState({
            error: 'Unable to reset your password. Please try again later'
          });
        });
    });
  }

  handleChange(event) {
    const field = event.target.name || event.target.id;
    const value = event.target.value;

    this.setState({
      [field]: value
    });
  }

  render() {
    let contents = <h3>Please wait...</h3>;

    if (this.state.status === 'success') {
      contents = (
        <div className="row success-container">
          <div className="col-md-8 col-md-offset-2">
            <p className="bg-success">
              <span>Your account has been reset! Please check</span>
              <span>
                <strong>
                  {this.state.email}
                </strong>
              </span>
              <span>for instructions.</span>
            </p>
          </div>
        </div>
      );
    } else {
      let errorContents = null;

      if (this.state.error) {
        errorContents = (
          <div className="row">
            <p className="bg-danger">
              {this.state.error}
            </p>
          </div>
        );
      }

      contents = (
        <form onSubmit={e => this.doSubmit(e)} className="reset-form">
          <div className="row">
            <div className="panel panel-default">
              <div className="logo-row">
                <div className="logo" />
              </div>
              {errorContents}
              <div className="form-group">
                <label className="input-row required">
                  <span>Email:</span>
                  <input
                    type="text"
                    className="form-control"
                    id="email"
                    value={this.state.email}
                    onChange={e => this.handleChange(e)}
                  />
                </label>
              </div>
              <button className="btn btn-primary" disabled={this.state.disable_form}>
                Reset Password
              </button>
            </div>
          </div>
        </form>
      );
    }

    return (
      <div className="register-container reset-container reset-password">
        <div className="container">
          {contents}
        </div>
      </div>
    );
  }
}

ResetPassword.className = 'no-header no-wrapper';

export default ResetPassword;
