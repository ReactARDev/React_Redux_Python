import React from 'react';
import { safe_zxcvbn, getPasswordClasses } from '../../shared/utils/password';
import { connect } from 'react-redux';
import _ from 'lodash';
import classnames from 'classnames';
import GoogleLogin from 'react-google-login';
import { Modal, Checkbox } from 'react-bootstrap';
import TermsOfService from './TermsOfService';
import { googleClientId } from '../../shared/config';
import googleLogo from '../images/googleLogo.svg';
import linkedinlogo from '../images/linkedinlogo.png';
import { safe_analytics } from '../../shared/utils/analytics.js';
import regHero from '../images/RegHero-illustration.png';
import desktopImg from '../images/compliance-desktop-invite.png';

class ActivateUserForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pswd_indc: {},
      user_related_attr: [], //tracks words related to user email/username for zxcvbn,
      showForm: !!this.props.reset || this.props.status === 'invite' || this.props.email,
      user_role: this.props.location.query.user_role
    };
  }

  onGoogleAuthSuccess = e => {
    safe_analytics('default', 'Registration', 'Auth success', 'Google');
    this.props.handleGoogleSuccess(e);
  };

  handleChange(event) {
    const field = event.target.name || event.target.id;
    const value = event.target.value;

    //if non-marketing campaign user add pre-set email
    if (!_.isNil(this.props.email) && !_.includes(this.state.user_related_attr, this.props.email)) {
      this.state.user_related_attr.push(this.props.email);
    }

    if (field === 'email') {
      if (!_.includes(this.state.user_related_attr, value)) {
        this.state.user_related_attr.push(value);
      }
    } else if (field === 'password') {
      const pswd_indc = value === '' ? {} : safe_zxcvbn(value, this.state.user_related_attr);
      this.setState({ pswd_indc });
    } else if (field === 'confirm_password') {
      this.setState({ pswd_indc: {} });
    }

    this.props.handleChange(field, value);
  }
  handleSubmit = e => {
    safe_analytics('default', 'Registration', 'Button click', 'Start free trial');
    this.props.doSubmit(e, this.props.termsAgreed);
  };
  openTerms(e) {
    e.preventDefault();

    safe_analytics('default', 'Registration', 'Button click', 'Terms of Service');

    this.setState({
      showTerms: true
    });
  }

  closeTerms() {
    this.setState({
      showTerms: false
    });
  }

  handleLinkedInLogin(e) {
    safe_analytics('default', 'Registration', 'Button click', 'Sign in with LinkedIn');
    this.props.callLinkedInLogin(e);
  }

  handleShowForm() {
    safe_analytics('default', 'Registration', 'Button click', 'Sign up with email (show form)');
    this.setState({ showForm: true });
  }

  handleCheckBox(e) {
    safe_analytics('default', 'Registration', 'Check box click', 'Agree to ToS');
    this.props.handleTermChange(e);
  }

  renderTerms() {
    if (!this.state.showTerms) {
      return null;
    }

    return (
      <Modal show onHide={() => this.closeTerms()} className="terms-modal">
        <Modal.Header closeButton>
          <Modal.Title>Compliance.ai Terms of Service</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TermsOfService />
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-default" onClick={() => this.closeTerms()}>
            Close
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  // form for password reset, invite, and anonymous sign up flow
  render() {
    let errorContents = null;

    if (this.props.error) {
      errorContents = <p className="bg-danger">{this.props.error}</p>;
    }

    let buttonText = 'Reset Password';
    if (this.props.status === 'invite' || this.props.status === 'sign_up') {
      buttonText = 'Start Your 30-Day Free Trial';
    }

    let suggestions = null;

    if (!_.isEmpty(this.state.pswd_indc)) {
      for (const feedback of this.state.pswd_indc.feedback.suggestions) {
        if (feedback !== '') {
          suggestions = <li className="activation-form-pwd-feedback">{feedback}</li>;
        }
      }
    }

    let warning = null;

    if (!_.isEmpty(this.state.pswd_indc)) {
      if (this.state.pswd_indc.feedback.warning !== '') {
        warning = (
          <li className="activation-form-pwd-feedback">{this.state.pswd_indc.feedback.warning}</li>
        );
      }
    }

    const userContainerClasses = {
      'user-form-container': true,
      reset_pass: this.props.reset
    };

    const termsClass = classnames({
      terms: true
    });

    return (
      <div className="activate-container">
        {this.renderTerms()}
        <div className="row">
          <div className="panel panel-default">
            {errorContents}
            <div className="form-explainer-container">
              {!this.props.reset ? (
                <div className="activate-user-explainer-container">
                  <div className="activate-user-explainer-card">
                    {this.state.user_role === 'contributor' ? (
                      <i className="material-icons">gavel</i>
                    ) : (
                      <i className="material-icons">timer</i>
                    )}
                    <div className="explainer-text-container">
                      {this.state.user_role === 'contributor' ? (
                        <h3 className="explainer-header">Join our community of contributors</h3>
                      ) : (
                        <h3 className="explainer-header">Easy Onboarding</h3>
                      )}
                      <p className="explainer-text">
                        {this.state.user_role === 'contributor'
                          ? 'Get full access to content'
                          : 'Set your preferences and access insights in under a minute.'}
                      </p>
                    </div>
                  </div>
                  <div className="activate-user-explainer-card">
                    <i className="material-icons">search</i>
                    <div className="explainer-text-container">
                      <h3 className="explainer-header">Regulatory Research Tools</h3>
                      <p className="explainer-text">
                        Search our comprehensive, continually updated database of federal and state
                        documents.
                      </p>
                    </div>
                  </div>
                  {this.state.user_role !== 'contributor' ? (
                    <div className="activate-user-explainer-card">
                      <i className="material-icons">assignment</i>
                      <div className="explainer-text-container">
                        <h3 className="explainer-header">Real-Time Activity Tracking</h3>
                        <p className="explainer-text">
                          Follow regulatory agencies and monitor industry trends.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <img
                    src={this.state.user_role === 'contributor' ? regHero : desktopImg}
                    className="desktop-img"
                    alt="dicount_logo"
                  />
                </div>
              ) : null}
              <div className={classnames(userContainerClasses)}>
                {!this.props.reset ? (
                  <div className="oauth-and-or-line-container">
                    <div className="form-group oauth-btn-container">
                      <button className="linkedin_btn" onClick={e => this.handleLinkedInLogin(e)}>
                        <span>
                          <img className="linkedinLogo" alt="logo" src={linkedinlogo} />Sign in with
                          Linkedin
                        </span>
                      </button>
                      <GoogleLogin
                        className="google_btn"
                        clientId={googleClientId}
                        onRequest={() =>
                          safe_analytics(
                            'default',
                            'Registration',
                            'Button click',
                            'Sign in with Google'
                          )
                        }
                        scope="email profile openid"
                        offline
                        onSuccess={e => this.onGoogleAuthSuccess(e)}
                        buttonText={
                          <span>
                            <img className="googleLogo" alt="logo" src={googleLogo} />Sign in with
                            Google
                          </span>
                        }
                      />

                      <div className={termsClass}>
                        <div className="text-center">
                          <Checkbox
                            inline
                            checked={this.props.termsAgreed}
                            onChange={e => this.handleCheckBox(e)}
                          >
                            <span>
                              I agree to the Compliance.ai
                              <a onClick={e => this.openTerms(e)}>Terms of Service</a>
                            </span>
                          </Checkbox>
                        </div>
                      </div>
                    </div>
                    <div className="or-line">
                      <hr className="black-line" /> OR <hr className="black-line" />
                    </div>
                  </div>
                ) : null}
                {this.state.showForm ? (
                  <div>
                    {!this.props.reset ? (
                      <div className="form-group not-required">
                        <label className="input-row">
                          <span>Email</span>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={this.props.email}
                            onChange={e => this.handleChange(e)}
                          />
                        </label>
                      </div>
                    ) : null}
                    <div className="form-group">
                      <label className="input-row required">
                        <span>Password</span>
                        {this.state.pswd_indc.score <= 1 ? (
                          <ul className="pwd-feedback">
                            {suggestions}
                            {warning}
                          </ul>
                        ) : null}
                        <input
                          type="password"
                          className="form-control"
                          id="password"
                          value={this.props.password}
                          onChange={e => this.handleChange(e)}
                        />
                        <div className={classnames(getPasswordClasses(this.state.pswd_indc))} />
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="input-row required">
                        <span>Confirm password</span>
                        <input
                          type="password"
                          className="form-control"
                          id="confirm_password"
                          value={this.props.confirm_password}
                          onChange={e => this.handleChange(e)}
                        />
                      </label>
                    </div>
                    <div className="btn-row">
                      <button className="sign-up-btn" onClick={e => this.handleSubmit(e)}>
                        {buttonText}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="btn-row">
                    <div className="signUpWithEmail" onClick={() => this.handleShowForm()}>
                      Sign up with email
                    </div>{' '}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
const mapStateToProps = ({ current_view }) => {
  return { current_view };
};
export default connect(mapStateToProps)(ActivateUserForm);
