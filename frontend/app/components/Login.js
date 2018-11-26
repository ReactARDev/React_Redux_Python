import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Button, Alert } from 'react-bootstrap';
import auth from '../../shared/utils/auth.js';
import { passwordApproved } from '../../shared/utils/password';
import {
  openWarningModal,
  sendConfirmationEmail,
  followAgencies,
  followEntities,
  followTopics,
  skipOnboarding
} from '../../shared/actions';
import GoogleLogin from 'react-google-login';
import { googleClientId } from '../../shared/config';
import googleLogo from '../images/googleLogo.svg';
import { safe_analytics } from '../../shared/utils/analytics.js';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessage: null,
      showSendEmailButton: null,
      emailFailedMessage: null,
      emailSentMessage: null
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentWillMount() {
    const query = this.props.location.query;
    if (query.error) {
      const errorMessage = query.error_description;
      this.setState({ errorMessage });
      return;
    }
    if (query.code) {
      const code = this.props.location.query.code;
      safe_analytics('default', 'Login', 'Auth success', 'LinkedIn');
      auth.initializeLinkedin(this, code, 'login', this.props);
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({
      showSendEmailButton: false,
      emailSentMessage: false,
      emailFailedMessage: false
    });
    const email = this.refs.email.value;
    const pass = this.refs.pass.value;

    auth.login(email, pass, false, (loggedIn, errorMessage, error) => {
      if (!loggedIn) {
        if (error === 'User is not verified') {
          this.setState({ showSendEmailButton: true });
        }
        this.setState({ errorMessage });
        return;
      }
      const { location } = this.props;

      safe_analytics('default', 'Login', 'Auth success', 'Email');

      if (location.state && location.state.nextPathname) {
        this.context.router.replace(location.state.nextPathname);
      } else {
        /* gate check a legacy user's password here for strength and display warning
        if it does not meet product use standards for password strength
        ie. equal to or greater than 2 of 4 */
        if (passwordApproved(pass)) {
          this.props.openWarningModal('pswrd');
        }
        this.context.router.replace('/');
      }
    });
  }

  sendConfirmationEmail = () => {
    this.setState({ emailSentMessage: false, emailFailedMessage: false });
    const email = this.refs.email.value;
    this.props
      .sendConfirmationEmail(email)
      .then(() => {
        this.setState({ emailSentMessage: true, emailFailedMessage: false });
      })
      .catch(res => {
        this.setState({
          emailSentMessage: false,
          emailFailedMessage: JSON.parse(res.response).error
        });
      });
  };

  handleSignUp() {
    safe_analytics('default', 'Login', 'Button click', 'Sign up');
    this.context.router.push({
      pathname: '/activate',
      state: { email: this.refs.email.value }
    });
  }

  callLinkedInLogin = event => {
    event.preventDefault();

    safe_analytics('default', 'Login', 'Button click', 'Sign in with LinkedIn');
    auth.redirectToLinkedIn('loginPage');
  };

  handleGoogle = googleUser => {
    safe_analytics('default', 'Login', 'Auth success', 'Google');
    auth.responseGoogle(googleUser, this, this.props);
  };

  render() {
    return (
      <div className="container login-outer-container">
        <div className="row">
          <div className="login-container panel panel-default">
            <div className="logo-row">
              <div className="logo" />
            </div>
            <div className="panel-body">
              <form className="form-login" onSubmit={this.handleSubmit}>
                {this.state.errorMessage && (
                  <div className="error">
                    {this.state.errorMessage}{' '}
                    <div>
                      Email <a href="mailto:support@compliance.ai">support@compliance.ai</a> for
                      help.
                    </div>
                    {this.state.showSendEmailButton ? (
                      <Button
                        onClick={this.sendConfirmationEmail}
                        className="sendConfirmationEmail"
                      >
                        Resend Confirmation Email
                      </Button>
                    ) : null}
                  </div>
                )}
                {this.state.emailSentMessage ? (
                  <Alert bsStyle="success">An email was sent to {this.refs.email.value}</Alert>
                ) : null}
                {this.state.emailFailedMessage ? (
                  <Alert bsStyle="danger">{this.state.emailFailedMessage}</Alert>
                ) : null}

                <div className="form-group oauth-btn-container">
                  <div className="linkedin_btn" onClick={this.callLinkedInLogin} />
                  <GoogleLogin
                    className="google_btn"
                    onRequest={() =>
                      safe_analytics('default', 'Login', 'Button click', 'Sign in with Google')
                    }
                    clientId={googleClientId}
                    scope="email profile openid"
                    offline
                    onSuccess={this.handleGoogle}
                    buttonText={
                      <span>
                        <img
                          className="googleLogo"
                          alt="googleLogo"
                          src={googleLogo}
                        />
                          Sign in with Google
                      </span>
                    }
                  />
                </div>
                <div className="or-line">
                  <hr className="black-line" /> OR <hr className="black-line" />
                </div>
                <div className="form-group">
                  <label>
                    Email
                    <input
                      ref="email"
                      type="email"
                      className="form-control input"
                      required
                      autoFocus
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Password
                    <input ref="pass" type="password" className="form-control input" required />
                  </label>
                </div>
                <div className="btn-container">
                  <button
                    className="btn btn-default"
                    type="submit"
                    onClick={() => safe_analytics('default', 'Login', 'Button click', 'Login')}
                  >
                    Login
                  </button>
                  <div className="or-line">OR</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => this.handleSignUp()}
                    type="button"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
              <div className="sign-up-container">
                <h3>
                  <Link
                    to={'/reset-password'}
                    onClick={
                      () => safe_analytics('default', 'Login', 'Button click', 'Forgot Password')
                    }
                  >
                    Forgot your password?
                  </Link>
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Login.contextTypes = {
  router: PropTypes.object
};

Login.className = 'no-wrapper no-header';

const mapStateToProps = state => {
  return {};
};

const ReduxLogin = connect(mapStateToProps, {
  openWarningModal,
  sendConfirmationEmail,
  followAgencies,
  followEntities,
  followTopics,
  skipOnboarding
})(Login);

export default ReduxLogin;
