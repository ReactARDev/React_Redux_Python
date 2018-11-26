import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { safe_zxcvbn, getPasswordClasses, passwordApproved } from '../../shared/utils/password';
import classnames from 'classnames';
import { FormControl, Button, ControlLabel, FormGroup } from 'react-bootstrap';
import { Link } from 'react-router';
import {
  clearCurrentUserUpdatedState,
  updateCurrentUser,
  clearErrors,
  addBanner,
  fetchCurrentUser
} from '../../shared/actions';
import _ from 'lodash';
import { nextContributorTasksDate } from '../../shared/utils/subscriptions';
import banner from '../images/FreeTrialBanner-Green.svg';
import contributorGraphic from '../images/contributorGraphic.png';

class UserAccount extends React.Component {
  constructor(props) {
    super(props);

    const view =
      props.location.state && props.location.state.fromPasswordModal ? 'profile' : 'subscription';

    this.state = {
      firstName: null,
      lastName: null,
      email: null,
      currentPassword: null,
      newPassword: null,
      newPasswordConfirmation: null,
      view,
      // use store for request errors, use state for user errors
      errorMessage: null,
      errorMessages: {}, // field errors
      pswd_indc: {},
      user_related_attr: null //tracks words related to user email/name for zxcvbn
    };
  }

  componentWillMount() {
    if (
      _.has(this.props.location, 'state.subscriptionCreated') &&
      this.props.location.state.subscriptionCreated
    ) {
      this.props.addBanner(
        'subscription_add_success',
        true,
        'Thank you! Your subscription is confirmed.'
      );
      this.waitAndCloseAlert('subscription_add_success');
    }
  }

  componentDidMount() {
    this.props.fetchCurrentUser();
    this.props.clearCurrentUserUpdatedState();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.viewer.isFetching && !nextProps.viewer.isFetching) {
      const user = nextProps.viewer.user;
      const firstName = user.first_name;
      const lastName = user.last_name;
      const email = user.email;
      const user_related_attr = [user.first_name, user.last_name, user.email];
      this.setState({ user, firstName, lastName, email, user_related_attr });
    }

    if (nextProps.errors && nextProps.errors.settings) {
      const errors = nextProps.errors.settings;

      let globalError = null;
      const fieldErrors = {};

      for (const error of errors) {
        if (error.response) {
          try {
            const response = JSON.parse(error.response).errors;

            if (response.field === 'password') {
              fieldErrors.currentPassword = 'Password is incorrect';
            }
          } catch (e) {
            // just use default
          }
        }
      }

      if (_.isEmpty(fieldErrors)) {
        globalError = 'An unknown error has occurred. Please reload the page and try again';
      }

      this.setState({
        errorMessage: globalError,
        errorMessages: fieldErrors
      });
    } else if (nextProps.viewer.updated && !this.props.viewer.updated) {
      this.setState({
        errorMessage: null,
        errorMessages: {},
        currentPassword: '',
        newPassword: '',
        newPasswordConfirmation: ''
      });
      this.props.addBanner('saved_success', true, 'Your changes have been saved.');
      this.waitAndCloseAlert('saved_success');
    }

    if (!nextProps.viewer.isUpdating) {
      this.setState({
        saveDisabled: false
      });
    }

    const error_banner_in_view =
      nextProps.current_view.banner.type === 'error' && nextProps.current_view.banner.display;
    if (this.state.errorMessage && !error_banner_in_view) {
      const err_msg = (
        <div className="banner-alert-container">
          <h4 className="banner-text">{this.state.errorMessage}</h4>
        </div>
      );
      this.props.addBanner('error', true, err_msg);
    }
  }

  waitAndCloseAlert(type) {
    setTimeout(() => this.props.addBanner(type, false), 5000);
  }

  clearFieldError(field) {
    const fieldErrors = this.state.errorMessages;
    delete fieldErrors[field];
    this.setState({ errorMessages: fieldErrors });
  }

  addUserAttribute(value) {
    if (!_.includes(this.state.user_related_attr, value)) {
      this.state.user_related_attr.push(value);
    }
  }

  handleFirstNameChange = event => {
    this.clearFieldError('firstName');
    this.addUserAttribute(event.target.value);
    this.setState({ firstName: event.target.value });
  };

  handleLastNameChange = event => {
    this.clearFieldError('lastName');
    this.addUserAttribute(event.target.value);
    this.setState({ lastName: event.target.value });
  };

  handleEmailChange = event => {
    this.clearFieldError('email');
    this.addUserAttribute(event.target.value);
    this.setState({ email: event.target.value });
  };

  handleCurrentPasswordChange = event => {
    this.clearFieldError('currentPassword');
    this.setState({ currentPassword: event.target.value });
  };

  handleNewPasswordChange = event => {
    this.clearFieldError('newPassword');
    const pswd_indc =
      event.target.value === ''
        ? {}
        : safe_zxcvbn(event.target.value, this.state.user_related_attr);

    this.setState({ pswd_indc, newPassword: event.target.value });
  };

  handleNewPasswordConfirmationChange = event => {
    this.clearFieldError('newPassword');
    this.setState({ newPasswordConfirmation: event.target.value, pswd_indc: {} });
  };

  handleSubmit = event => {
    event.preventDefault();

    this.props.clearErrors('settings'); // make sure the store is clean

    this.setState({
      errorMessage: null,
      errorMessages: {}
    });

    const errorMessages = {};

    if (this.state.newPassword || this.state.newPasswordConfirmation) {
      if (!this.state.currentPassword) {
        errorMessages.currentPassword = 'Current password is required to change password';
      }
      if (this.state.newPassword !== this.state.newPasswordConfirmation) {
        errorMessages.newPassword = "Password and password confirmation don't match";
      }
      /* gate check a current user's password here for strength and return error if it does not meet
       product use standards for password strength ie. equal to or greater than 3 of 4 */
      if (passwordApproved(this.state.newPassword)) {
        errorMessages.newPassword = 'The password is not strong enough';
      }
    }

    if (!_.isEmpty(errorMessages)) {
      this.setState({ errorMessages });
      return;
    }

    this.setState({ saveDisabled: true, pswd_indc: {} });

    const update = {};

    if (this.state.firstName !== this.props.viewer.user.first_name) {
      update.first_name = this.state.firstName;
    }

    if (this.state.lastName !== this.props.viewer.user.last_name) {
      update.last_name = this.state.lastName;
    }

    if (this.state.email !== this.props.viewer.user.email) {
      update.email = this.state.email;
    }

    if (this.state.currentPassword && this.state.newPassword) {
      update.current_password = this.state.currentPassword;
      update.new_password = this.state.newPassword;
    }

    if (this.state.emailUpdates !== this.props.viewer.user.properties.email_updates) {
      update.properties = { email_updates: this.state.emailUpdates };
    }

    this.props.updateCurrentUser(this.props.viewer.user.email, update);
  };

  render() {
    const inputError = field => {
      if (this.state.errorMessages[field]) {
        return <p className="bg-danger help-block">{this.state.errorMessages[field]}</p>;
      }

      return null;
    };

    let suggestions = null;

    if (!_.isEmpty(this.state.pswd_indc)) {
      for (const feedback of this.state.pswd_indc.feedback.suggestions) {
        suggestions = <li className="settings-form-pwd-feedback">{feedback}</li>;
      }
    }

    let warning = null;

    if (!_.isEmpty(this.state.pswd_indc)) {
      if (this.state.pswd_indc.feedback.warning !== '') {
        warning = (
          <li className="settings-form-pwd-feedback">{this.state.pswd_indc.feedback.warning}</li>
        );
      }
    }

    let latestSubscriptionToDisplay = 'free_trial';
    let subscriptionCategory = 'free_trial';

    // this assumes there is zero or one latest subscription
    const latestSubscription = this.props.subscriptions.subscriptions.filter(
      subscription => subscription.latest
    )[0];

    const freeTrialText = `You are on a free trial ending ${
      latestSubscription ? latestSubscription.expirationDate : 'soon'
    }.`;

    const freePlanText = 'You are on a free plan.';

    const subscriptions = {
      free_trial: [freeTrialText, ''],
      free_trial_2months: [freeTrialText, ''],
      free_trial_120months: [freePlanText, ''],
      free_trial_extension: [freeTrialText, ''],
      free_trial_2months_extension: [freeTrialText, ''],

      // TODO refactor when server provides nextBillDate for non-stripe paid subscriptions
      pro_monthly_oct_2017: [
        'Your subscription is up to date.',
        latestSubscription && latestSubscription.payment_type === 'stripe'
          ? `You'll be billed on ${latestSubscription.nextBillDate}`
          : '(billed monthly)'
      ],
      pro_monthly_recur: [
        'Your subscription is up to date.',
        latestSubscription && latestSubscription.payment_type === 'stripe'
          ? `You'll be billed on ${latestSubscription.nextBillDate}`
          : '(billed monthly)'
      ],
      pro_annual_new_oct_2017: [
        'Your subscription is up to date.',
        latestSubscription && latestSubscription.payment_type === 'stripe'
          ? `You'll be billed on ${latestSubscription.nextBillDate}`
          : '(billed annually)'
      ],
      pro_annual_recur: [
        'Your subscription is up to date.',
        latestSubscription && latestSubscription.payment_type === 'stripe'
          ? `You'll be billed on ${latestSubscription.nextBillDate}`
          : '(billed annually)'
      ],
      team_monthly_recur: [
        'Your subscription is up to date.',
        latestSubscription && latestSubscription.payment_type === 'stripe'
          ? `You'll be billed on ${latestSubscription.nextBillDate}`
          : '(billed monthly)'
      ],
      team_annual_recur: [
        'Your subscription is up to date.',
        latestSubscription && latestSubscription.payment_type === 'stripe'
          ? `You'll be billed on ${latestSubscription.nextBillDate}`
          : '(billed annually)'
      ],
      pro_annual_recur_preexisting: ['Your subscription is up to date.', '(billed annually)']
    };
    if (latestSubscription) {
      latestSubscriptionToDisplay = latestSubscription.stripe_id;
      subscriptionCategory = latestSubscription.stripe_id === 'free_trial_120months'
        ? 'free_trial_120months'
        : latestSubscription.category;
    }

    let subscription = null;

    if (this.state.view === 'subscription') {
      const proClasses = classnames({
        proEdition: subscriptionCategory === 'paid'
      });

      const subscriptionClasses = classnames({
        'outter-subscription-card': true,
        'loading-overlay-light': true,
        'loading-active': this.props.subscriptions.isFetching
      });

      const freeTrialClasses = classnames({
        trialInfo: true,
        red: latestSubscription ? latestSubscription.within10dayofExpiration : false
      });

      subscription = (
        <div className={subscriptionClasses}>
          {subscriptionCategory === 'contributor' ? (
            <div className="contributor">
              <img src={contributorGraphic} alt="banner" className="banner" />
            </div>
          ) : (
            <div className="inner-subscription-card">
              {subscriptionCategory === 'free_trial' ? (
                <div className="freeTrial">
                  <img src={banner} alt="banner" className="banner" />
                  <p className={freeTrialClasses}>{subscriptions[subscriptionCategory][0]}</p>
                </div>
              ) : null}

              {subscriptionCategory === 'free_trial_120months' ? (
                <div className="freeTrial">
                  <img src={banner} alt="banner" className="banner" />
                  <p className={freeTrialClasses}>{subscriptions[subscriptionCategory][0]}</p>
                </div>
              ) : null}

              {subscriptionCategory !== 'contributor' && subscriptionCategory !== 'team' ? (
                <h1 className={proClasses}>Professional Edition</h1>
              ) : null}

              {subscriptionCategory === 'team' ? (
                <h1 className={proClasses}>Team Edition</h1>
              ) : null}

              {subscriptionCategory === 'paid' || subscriptionCategory === 'team' ? (
                <div className="paid">
                  <i className="material-icons check">check_circle</i>
                  <p className="currentPlan">{subscriptions[latestSubscriptionToDisplay][0]}</p>
                </div>
              ) : null}

              {subscriptionCategory !== 'contributor' ? (
                <p className="billing">{subscriptions[latestSubscriptionToDisplay][1]}</p>
              ) : null}

              <Link to="/checkout">
                {subscriptionCategory === 'free_trial' ? (
                  <Button>Purchase Subscription</Button>
                ) : null}
              </Link>
            </div>
          )}
        </div>
      );
    }

    let profile = null;

    if (this.state.view === 'profile') {
      profile = (
        <div className="profile-container">
          <div className="panel panel-default">
            <div className="panel-body">
              <form action="" onSubmit={this.handleSubmit}>
                <FormGroup>
                  <ControlLabel>First Name</ControlLabel>
                  <FormControl
                    type="text"
                    value={this.state.firstName}
                    onChange={this.handleFirstNameChange}
                    bsStyle={this.state.errorMessages.firstName ? 'error' : null}
                    required
                  />
                  {inputError('firstName')}
                </FormGroup>
                <FormGroup>
                  <ControlLabel>Last Name</ControlLabel>
                  <FormControl
                    type="text"
                    label="Last Name"
                    value={this.state.lastName}
                    onChange={this.handleLastNameChange}
                    help={this.state.errorMessages.lastName}
                    bsStyle={this.state.errorMessages.lastName ? 'error' : null}
                    required
                  />
                  {inputError('lastName')}
                </FormGroup>
                <FormGroup>
                  <ControlLabel>Email</ControlLabel>
                  <FormControl
                    type="email"
                    label="Email"
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                    help={this.state.errorMessages.email}
                    bsStyle={this.state.errorMessages.email ? 'error' : null}
                    required
                  />
                  {inputError('email')}
                </FormGroup>
                <FormGroup>
                  <ControlLabel>Current Password</ControlLabel>
                  <FormControl
                    type="password"
                    label="Current Password"
                    value={this.state.currentPassword}
                    onChange={this.handleCurrentPasswordChange}
                    bsStyle={this.state.errorMessages.currentPassword ? 'error' : null}
                  />
                  {inputError('currentPassword')}
                </FormGroup>
                <FormGroup>
                  <ControlLabel>New Password</ControlLabel>
                  {this.state.pswd_indc.score <= 1 ? (
                    <ul className="pwd-feedback">
                      {suggestions}
                      {warning}
                    </ul>
                  ) : null}
                  <FormControl
                    type="password"
                    label="New Password"
                    value={this.state.newPassword}
                    onChange={this.handleNewPasswordChange}
                    help={this.state.errorMessages.newPassword}
                    bsStyle={this.state.errorMessages.newPassword ? 'error' : null}
                  />
                  <div className={classnames(getPasswordClasses(this.state.pswd_indc))} />
                  {inputError('newPassword')}
                </FormGroup>
                <FormGroup>
                  <ControlLabel>Confirm New Password</ControlLabel>
                  <FormControl
                    type="password"
                    label="Confirm New Password"
                    value={this.state.newPasswordConfirmation}
                    onChange={this.handleNewPasswordConfirmationChange}
                  />
                  {inputError('newPasswordConfirmation')}
                </FormGroup>
                <FormGroup className="btn-container">
                  <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
                    Update
                  </Button>
                </FormGroup>
              </form>
            </div>
          </div>
        </div>
      );
    }

    const subSelectionClasses = {
      selected: this.state.view === 'subscription'
    };

    const profileSelectionClasses = {
      selected: this.state.view === 'profile'
    };
    return (
      <div className="account-settings-container">
        <div className="account-selections">
          <span
            className={classnames(subSelectionClasses)}
            onClick={() =>
              this.setState({
                view: 'subscription'
              })
            }
          >
            Subscription
          </span>
          <span
            className={classnames(profileSelectionClasses)}
            onClick={() =>
              this.setState({
                view: 'profile'
              })
            }
          >
            Profile
          </span>
        </div>
        {subscription}
        {profile}

        {this.state.view === 'subscription' ? (
          <div className="subText">
            {subscriptionCategory === 'contributor' &&
            this.props.subscriptions.subscriptions.length > 0 ? (
              <div className="taskStatus">
                <div>
                  See your <Link to="/dashboard">dashboard </Link>to access this month's tasks!
                </div>
                <div>
                  New tasks coming your way on{' '}
                  {nextContributorTasksDate(this.props.subscriptions.subscriptions)}.
                </div>
              </div>
            ) : null}
            <div className="questions">
              If you have questions about subscriptions, please contact{' '}
              <a href="mailto:billing@compliance.ai">billing@compliance.ai</a>
              .
            </div>
            {subscriptionCategory === 'contributor' ? (
              <div className="upgradeFromContrib">
                Upgrade to Professional
                <Link to="/checkout">
                  <Button>Buy Now</Button>
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
}

// classname to apply to top level container
UserAccount.className = 'user-account';

UserAccount.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ current_user, current_view, subscriptions, errors }) => {
  return {
    viewer: current_user,
    current_view,
    subscriptions,
    errors
  };
};

export default connect(mapStateToProps, {
  updateCurrentUser,
  fetchCurrentUser,
  clearCurrentUserUpdatedState,
  clearErrors,
  addBanner
})(UserAccount);
