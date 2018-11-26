import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import { passwordApproved } from '../../shared/utils/password';
import { apiUrl, onboardingTooltipEnabled } from '../../shared/config';
import {
  openWarningModal,
  followAgencies,
  followEntities,
  followTopics,
  skipOnboarding
} from '../../shared/actions';
import request from 'reqwest';
import { Link } from 'react-router';
import { Row } from 'react-bootstrap';
import classnames from 'classnames';
import auth from '../../shared/utils/auth.js';
import { safe_ga, safe_mixpanel_track, safe_analytics } from '../../shared/utils/analytics';
import Bugsnag from 'bugsnag-js';
import ActivateUserForm from './ActivateUserForm';
import ActivatePersonalize from './ActivatePersonalize';
import StepIndicator from './StepIndicator';
import {
  defaultFederalAgencies,
  defaultStateAgencies,
  defaultTopics,
  update_user_preferences
} from '../../shared/utils/defaultSources';

/*

This component handles a lot of separate features, which are
controlled by the `flow` and `status` in state.

`flow`:
* "activate" - Simple user activation flow. Activates a new account
  with a preset password (currently not used)
* "password" - Reset password flow. Displays a reset password
  form. This is linked to by the reset password email.
* "invite" - Invited user flow. Activates a new account in which we
  only know the user's email address. Also has an additional
  personalization step. This is the standard flow for creating new
  accounts.

`status`:
* "waiting" - Submit activate call. Only for "activate" flow.
* "password" - Display password entry form. Only for "password"
  flow. Performs activate call on form submission.
* "invite" - Display invite user form. Basically the above with
  additional fields. Only for the "invite" flow. Moves to
  "personalize" on submit.
* "personalize" - Display user personalization view. Only for the
  "invite" flow. Performs activate call on form submission. If
  successful, logs into the app automatically.
* "success" - Success state message for "activate" and "password"
  flows.
* "error" - Unrecoverable error state. The code makes some attempt to
  allow the user to resubmit, this state is for cases that are harder
  to handle.


This component verifies the access token when it is loaded. For
testing purposes, executing `localStorage.activate_skip_validation = 1`
in the browser console will prevent this. The token will still be
validated at the end of the flow. Note that the user's state is not
saved until the end of the flow.

*/

class Activate extends React.Component {
  constructor(props) {
    super(props);

    const reset = props.location.query.reset || false;
    const invite = props.location.query.invite || false;
    const confirm = props.location.query.confirm || false;
    const token = props.location.query.token || null;
    const linkedin_sign_up = props.location.query.code || false;

    let status = 'waiting';
    let flow = 'activate';
    let numSteps = 0;

    if (linkedin_sign_up) {
      safe_analytics('default', 'Registration', 'Auth success', 'LinkedIn');
      const code = this.props.location.query.code;
      const termsAgreed = !!JSON.parse(localStorage.getItem('termsAgreed'));
      const is_contributor = !!JSON.parse(localStorage.getItem('is_contributor'));
      const marketing_campaign_token = localStorage.getItem('marketing_campaign_token');
      localStorage.removeItem('termsAgreed');
      localStorage.removeItem('is_contributor');
      localStorage.removeItem('marketing_campaign_token');

      // initializeLinkedin may set the state.
      auth.initializeLinkedin(
        this,
        code,
        'activate',
        this.props,
        termsAgreed,
        null,
        is_contributor,
        marketing_campaign_token
      );
      status = 'sign_up';
      flow = 'sign_up';
      numSteps = 3;
    } else if (invite) {
      status = 'invite';
      flow = 'invite';
      numSteps = 3;
    } else if (reset) {
      status = 'password';
      flow = 'password';
      numSteps = 2;
    } else if (confirm) {
      status = 'confirm';
      flow = 'confirm';
      numSteps = 0;
    } else if (_.isNil(token)) {
      //coming from wordpress site (no campaign or invite)
      status = 'sign_up';
      flow = 'sign_up';
      numSteps = 3;
    }

    const email_from_context = (props.location.state && props.location.state.email)
      ? props.location.state.email : '';

    this.state = {
      email: props.location.query.email || email_from_context,
      token,
      day_long_token: null,
      first_name: '',
      password: '',
      confirm_password: '',
      personalize: ActivatePersonalize.getDefaults(),
      status,
      reset,
      flow,
      numSteps,
      curStep: 0,
      termsAgreed: false
    };
  }

  componentWillMount() {
    if (this.state.status === 'waiting') {
      this.doSubmit();
      return;
    }
    if (this.props.location.state && this.props.location.state.fromSocialCallback) {
      this.setState({
        flow: this.props.location.state.flow,
        numSteps: this.props.location.state.numSteps,
        status: this.props.location.state.status
      });
    }
  }

  componentDidMount() {
    if (this.props.location.state && this.props.location.state.fromSocialCallback) {
      return;
    }
    if (
      this.state.flow === 'invite' ||
      this.state.flow === 'sign_up' ||
      this.state.flow === 'oauth_sign_up'
    ) {
      this.validateQueryParams();
      //ignore event if came from linkedin auth
      if (!this.props.location.query.code) {
        safe_analytics('default', 'Onboarding', 'Advance step', 'Step 1');
      }
    }

    if (this.state.flow === 'confirm' && !this.state.error) {
      auth.confirm_user(this.state.email, this.state.token, (loggedIn, errorMessage) => {
        if (errorMessage === 'User is already enabled') {
          this.context.router.replace('/');
          return;
        }
        if (!loggedIn) {
          this.setState({
            error: (
              <span>
                Failed to log in. Please contact
                <a href="mailto:support@compliance.ai">support@compliance.ai</a>
                .
              </span>
            ),
            status: 'error'
          });
          return;
        }

        this.setState({
          status: 'success'
        });
      });
    }

    if (auth.loggedIn()) {
      auth.logout();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // handle submission from the personalize form, redirect back to the app
    if (
      (this.state.flow === 'invite' || this.state.flow === 'sign_up') &&
      this.state.status === 'success' &&
      !this.state.error
    ) {
      /*
        Special case for users that come from marketing campaign or sign up from wordpress site,
        only grant 24hr token access until confirmed
      */
      if (this.state.day_long_token) {
        //store 24hr token in browser
        localStorage.token = this.state.day_long_token;
        //open warning modal
        this.props.openWarningModal('campaign');
        //bring user to dashboard_view
        if (this.state.curStep === this.state.numSteps - 1) {
          this.context.router.replace('/');
        }
      } else {
        auth.login(this.state.email, this.state.password, false, (loggedIn, errorMessage) => {
          if (!loggedIn) {
            this.setState({
              error: (
                <span>
                  Failed to log in. Please contact
                  <a href="mailto:support@compliance.ai">support@compliance.ai</a>
                  .
                </span>
              ),
              status: 'error'
            });
            return;
          }
          this.context.router.replace('/');
        });
      }
    }
  }

  // called from personalize component
  setPersonalizeState(state) {
    this.setState({
      personalize: {
        ...this.state.personalize,
        ...state
      }
    });
  }

  validateQueryParams() {
    try {
      // don't perform the initial dry run for testing purposes
      if (localStorage.activate_skip_validation) {
        return;
      }
    } catch (e) {
      // this is mostly for Safari in private mode
      this.setState({
        error: 'Cannot access local storage. You may need to leave private browsing mode.'
      });
    }

    const reqData = {
      email: this.state.email,
      token: this.state.token,
      dry_run: true
    };
    request({
      url: apiUrl + '/activate',
      method: 'POST',
      data: JSON.stringify(reqData),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json'
    })
      .then(response => {})
      .catch((error, ...args) => {
        let response_body = {};
        try {
          response_body = JSON.parse(error.response);
        } catch (e) {
          // noop
        }

        if (error && error.status === 400 && response_body.error) {
          if (response_body.error === 'User is already enabled') {
            this.context.router.replace('/'); // redirect to login
          } else {
            this.setState({
              error: (
                <span>
                  The activation link was invalid. Please confirm that the link was entered
                  correctly. If this issue persists, please contact
                  <a href="mailto:support@compliance.ai">support@compliance.ai</a>.
                </span>
              ),
              status: 'error'
            });
          }
        } else {
          this.setState({
            error: 'An unknown error has occurred. Please reload the page and try again.',
            status: 'error'
          });
        }
      });
  }

  doAnalytics(reqData) {
    if (this.state.flow === 'activate') {
      safe_analytics('default', 'Activation', 'Activate', 'New Account');
    } else if (this.state.flow === 'password') {
      safe_analytics('default', 'Settings', 'Reset Password');
    } else if (
      this.state.flow === 'invite' ||
      this.state.flow === 'sign_up' ||
      this.state.flow === 'oauth_sign_up'
    ) {
      for (const agency_id of reqData.agencies) {
        let agency = _.find(defaultFederalAgencies, { id: agency_id });
        //cover those state agencies with ids
        if (!agency) {
          agency = _.find(defaultStateAgencies, { id: agency_id });
        }
        safe_analytics('default', 'Personalization', 'Agency', agency.short_name);
      }

      for (const state_short_name of reqData.state_agencies) {
        const state = _.find(defaultStateAgencies, { short_name: state_short_name });
        safe_analytics('default', 'Personalization', 'State Agency', state.short_name);
      }

      for (const topic of reqData.topics) {
        safe_analytics('default', 'Personalization', 'Topic', topic);
      }

      if (reqData.other_agencies) {
        safe_analytics(
          'Feedback – New Source Request',
          'Feedback',
          'New Source Request',
          reqData.other_agencies
        );
      }

      if (reqData.other_state_agencies) {
        safe_analytics(
          'Personalization – Other State Agencies',
          'Personalization',
          'Other State Agencies',
          reqData.other_state_agencies
        );
      }

      if (reqData.other_topics) {
        safe_analytics(
          'Personalization – Other Topics',
          'Personalization',
          'Other Topics',
          reqData.other_topics
        );
      }
    }
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
  selectAll = sourceType => {
    const sources = {};
    if (sourceType === 'agencies') {
      ActivatePersonalize.allAgencies().forEach(agency => {
        sources[agency.id] = true;
      });
    }
    if (sourceType === 'topics') {
      defaultTopics.forEach(topic => {
        sources[topic.id] = true;
      });
    }
    if (sourceType === 'stateAgencies') {
      ActivatePersonalize.stateAgencies().forEach(agency => {
        if (_.isNil(agency.id)) {
          sources[agency.short_name] = true;
        } else {
          sources[agency.id] = true;
        }
      });
    }
    const newState = { ...this.state };
    newState.personalize[sourceType] = sources;
    this.setState(newState);
  };

  clearAll = sourceType => {
    let sources = {};
    if (sourceType === 'agencies') {
      sources = {};
    }
    if (sourceType === 'topics') {
      sources = [];
    }
    if (sourceType === 'stateAgencies') {
      sources = ActivatePersonalize.getDefaults().stateAgencies;
    }
    const newState = { ...this.state };
    newState.personalize[sourceType] = sources;
    this.setState(newState);
  };

  doSubmit(event) {
    if (event) {
      event.preventDefault();
    }
    // clear error so it doesn't stick around
    this.setState({ error: null });

    const reqData = {
      email: this.state.email,
      token: this.state.token
    };

    if (
      this.state.status === 'password' ||
      this.state.status === 'invite' ||
      this.state.status === 'sign_up'
    ) {
      if (!this.state.termsAgreed && !this.state.reset) {
        safe_analytics('default', 'Registration', 'Error', 'Please agree to ToS');
        this.setState({
          error: 'Please agree to the Terms of Service.'
        });
        return;
      }
      const requiredFields = ['password', 'confirm_password'];

      for (const field of requiredFields) {
        if (!this.state[field]) {
          safe_analytics('default', 'Registration', 'Error', 'All fields required');
          this.setState({
            error: 'All fields are required.'
          });
          return;
        }
      }

      if (this.state.password !== this.state.confirm_password) {
        safe_analytics('default', 'Registration', 'Error', 'Password mismatch');
        this.setState({
          error: 'The passwords do not match.'
        });
        return;
      }
      /* gate check a new user's password here for strength and return error if it does not meet
       product use standards for password strength ie. equal to or greater than 2 of 4 */
      if (passwordApproved(this.state.password)) {
        safe_analytics('default', 'Registration', 'Error', 'Weak password');
        this.setState({
          error: 'The password is not strong enough.'
        });
        return;
      }

      // no errors, move onto personalize step
      if (this.state.status === 'invite' || this.state.status === 'sign_up') {
        this.checkEmail({ email: this.state.email }).then(res => {
          const { email_in_use } = res;
          if (email_in_use) {
            safe_analytics('default', 'Registration', 'Error', 'Account already exists');
            this.setState({
              error: (
                <span>
                  This account already exists. Please
                  <Link to={'/login'}>login</Link>
                  or enter a different email.
                </span>
              )
            });
            return;
          }
          const isContributor = this.props.location.query.user_role === 'contributor';
          //ACTIVATE
          reqData.new_password = this.state.password;
          reqData.first_name = this.state.first_name;
          if (isContributor) {
            reqData.is_contributor = isContributor;
          }
          this.activateUser(reqData).then(() => {
            const invite_status = this.state.flow;
            safe_analytics('default', 'Activation', 'Activate', invite_status);
            mixpanel.alias(this.state.email);

            // user is new and a contributor:
            if (onboardingTooltipEnabled && isContributor) {
              this.props.skipOnboarding();
              this.context.router.push({
                pathname: '/',
                state: { newContributorSignup: true }
              });
              return;
            }

            if (onboardingTooltipEnabled) {
              this.props.skipOnboarding();
              this.context.router.push('/');
              return;
            }
            if (this.state.status === 'invite') {
              this.context.router.push('/');
              return;
            }
            this.setState({
              status: 'personalize',
              curStep: 1
            });
          });
        });
        // XXX: commented out because we're skipping the personalize step
        // if we add it back in we will need to uncomment this code (and probably move it)
        //safe_analytics('default', 'Onboarding', 'Advance step', 'Step 2');
        return;
      }

      // otherwise fall through and submit the password change
      reqData.new_password = this.state.password;
    } else if (
      this.state.status === 'personalize' &&
      (this.state.flow === 'invite' ||
        this.state.flow === 'sign_up' ||
        this.state.flow === 'oauth_sign_up')
    ) {
      //combine those state agencies with id's and reg agencies
      const reg_agencies = Object.keys(this.state.personalize.agencies).map(a => parseInt(a, 10));
      const state_ids = Object.keys(this.state.personalize.stateAgencies)
        .filter(a => {
          if (_.isNaN(parseInt(a, 10))) {
            return null;
          }
          return a;
        })
        .map(a => parseInt(a, 10));

      const state_short_names = Object.keys(this.state.personalize.stateAgencies).filter(a => {
        if (!_.isNaN(parseInt(a, 10))) {
          return null;
        }
        return a;
      });

      safe_analytics('default', 'Registration', 'Complete registration', 'Go to dashboard');

      reqData.agencies = [...reg_agencies, ...state_ids];
      reqData.state_agencies = state_short_names;
      reqData.topics = Object.keys(this.state.personalize.topics);
      reqData.other_agencies = this.state.personalize.otherAgencies;
      reqData.other_state_agencies = this.state.personalize.otherStateAgencies;
      reqData.other_topics = this.state.personalize.otherTopics;
    }
    this.setState({ status: 'success' });
    this.doAnalytics(reqData);
    if (this.state.reset) {
      this.activateUser(reqData);
      return;
    }
    update_user_preferences(reqData, this.props);
    if (this.state.flow === 'oauth_sign_up') {
      this.context.router.replace('/');
    }
  }
  activateUser = reqData => {
    return request({
      url: apiUrl + '/activate',
      method: 'POST',
      data: JSON.stringify(reqData),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json'
    })
      .then(response => {
        this.setState({
          status: 'success',
          day_long_token: response.jwt_token
        });
      })
      .catch(error => {
        if (_.isNil(error.status)) {
          // don't notify on XHR errors
          safe_ga('send', 'exception', {
            exDescription: 'Activation error',
            exFatal: true
          });
          safe_mixpanel_track('Exception – Activation error', {
            hitType: 'exception',
            exDescription: 'Activation error',
            exFatal: true
          });
          Bugsnag.notifyException(error, null);
        }

        this.setState({
          error: 'Unable to activate your account. Please try again later'
        });
      });
  };
  handlePersonalizeChange(data) {
    this.setState({
      personalize: {
        ...this.state.personalize,
        ...data
      }
    });
  }

  advanceStep() {
    const newStep = this.state.curStep + 1;
    if (
      this.state.flow === 'invite' ||
      this.state.flow === 'sign_up' ||
      this.state.flow === 'oauth_sign_up'
    ) {
      let eventStep = newStep + 1;
      //offset required for social signup because oauth flow has one less step than regular signup
      if (this.state.flow === 'oauth_sign_up') {
        eventStep++;
      }
      safe_analytics('default', 'Onboarding', 'Advance step', `Step ${eventStep}`);
    }

    this.setState({
      curStep: newStep
    });
  }

  handleUserFormChange(field, value) {
    if (field === 'email') {
      //For email, pass Local-Part as first_name
      const first_name = !_.isNil(value.match(/.*(?=(\@))/)) ? value.match(/.*(?=(\@))/) : '';
      this.setState({ first_name: first_name[0] });
    }
    if (field === 'email') {
      //For email, pass Local-Part as first_name
      const first_name = !_.isNil(value.match(/.*(?=(\@))/)) ? value.match(/.*(?=(\@))/) : '';
      this.setState({ first_name: first_name[0] });
    }
    this.setState({
      [field]: value
    });
  }
  handleTermChange(e) {
    this.setState({
      termsAgreed: e.target.checked
    });
    if (e.target.checked && this.state.error === 'Please agree to the Terms of Service.') {
      this.setState({ error: null });
    }
  }
  callLinkedInLogin(event) {
    event.preventDefault();
    const is_contributor = this.props.location.query.user_role === 'contributor';
    localStorage.setItem('is_contributor', is_contributor);
    localStorage.setItem('termsAgreed', this.state.termsAgreed);
    localStorage.setItem('marketing_campaign_token', this.state.token);
    auth.redirectToLinkedIn('fromOnboarding');
  }

  handleGoogleSuccess = googleUser => {
    auth.responseGoogle(googleUser, this, this.props);
  };
  render() {
    let contents = <h3>Please wait...</h3>;
    let stepContainer = null;
    if (this.state.numSteps > 0) {
      stepContainer = (
        <Row className="step-container">
          <StepIndicator
            numSteps={this.state.numSteps}
            curStep={this.state.curStep}
            padding={60}
            radius={10}
            stroke={2}
          />
        </Row>
      );
    }

    if (this.state.status === 'success' && this.state.flow !== 'password') {
      contents = (
        <Row className="success-container">
          <div className="col-md-8 col-md-offset-2">
            <p className="bg-success">
              <span>Your account has been activated!</span>
              <span>
                <Link to={'/login'}>Click here</Link>
              </span>
              <span>to login</span>
            </p>
          </div>
        </Row>
      );
    } else if (this.state.status === 'success' && this.state.flow === 'password') {
      contents = (
        <Row className="success-container">
          <div className="col-md-8 col-md-offset-2">
            <p className="bg-success">
              <span>Your password has been changed.</span>
              <span>
                {' '}
                Please<Link to={'/login'}>log in.</Link>
              </span>
            </p>
          </div>
        </Row>
      );
    } else if (
      this.state.status === 'password' ||
      this.state.status === 'invite' ||
      this.state.status === 'sign_up'
    ) {
      contents = (
        <ActivateUserForm
          status={this.state.status}
          error={this.state.error}
          email={this.state.email}
          first_name={this.state.first_name}
          password={this.state.password}
          confirm_password={this.state.confirm_password}
          doSubmit={e => this.doSubmit(e)}
          handleChange={(f, v) => this.handleUserFormChange(f, v)}
          stepContainer={stepContainer}
          handleTermChange={e => this.handleTermChange(e)}
          callLinkedInLogin={e => this.callLinkedInLogin(e)}
          handleGoogleSuccess={this.handleGoogleSuccess}
          termsAgreed={this.state.termsAgreed}
          reset={this.state.reset}
          location={this.props.location}
        />
      );
    } else if (this.state.status === 'personalize') {
      contents = (
        <ActivatePersonalize
          doSubmit={() => this.doSubmit()}
          handleChange={state => this.handlePersonalizeChange(state)}
          selectAll={this.selectAll}
          clearAll={this.clearAll}
          advanceStep={() => this.advanceStep()}
          data={this.state.personalize}
          error={this.state.error}
          stepContainer={stepContainer}
        />
      );
    } else {
      // error
      const text = this.state.error;
      if (!_.isNil(text)) {
        contents = <p className="bg-danger">{text}</p>;
      }
    }

    const classes = [
      'register-container',
      'reset-container',
      `${this.state.flow}-flow`,
      `step-${this.state.curStep}`
    ];

    return (
      <div className={classnames(classes)}>
        <div className="logo-row">
          <div className="logo" />
        </div>
        <div className="container">{contents}</div>
      </div>
    );
  }
}

Activate.contextTypes = {
  router: PropTypes.object
};

Activate.className = 'no-header no-wrapper activate-component';

const mapStateToProps = state => {
  return {};
};

const ReduxActivate = connect(mapStateToProps, {
  openWarningModal,
  followAgencies,
  followEntities,
  followTopics,
  skipOnboarding
})(Activate);

export default ReduxActivate;
