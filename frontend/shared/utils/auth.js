import React from 'react';
import request from 'reqwest';
import _ from 'lodash';
import moment from 'moment';
import {
  apiUrl,
  linkedInClientId,
  linkedInLoginRedirectUrl,
  linkedInActivateRedirectUrl,
  googleLoginRedirectUrl,
  googleActivateRedirectUrl,
  onboardingTooltipEnabled
} from '../../shared/config';
import { safe_analytics } from '../../shared/utils/analytics';
import { latestSubscription } from './subscriptions';
import { browserName } from '../../app/utils/browser';

function loginRequest(email, password, callback) {
  request({
    url: `${apiUrl}/login`,
    method: 'POST',
    crossOrigin: true,
    type: 'json',
    contentType: 'application/json',
    data: JSON.stringify({ email, password }),
    error: error => {
      let message = 'An unknown error occured. Please try again later.';
      let response_body = {};

      try {
        response_body = JSON.parse(error.response);
      } catch (e) {
        // noop
      }

      if (error.status === 401) {
        if (response_body.error === 'User is not enabled') {
          message =
            'This account is not yet activated. ' +
            'Please check your inbox for your activation email.';
        } else if (response_body.error === 'User is not verified') {
          message =
            'This account is not yet confirmed. ' +
            'Please check your inbox for your confirmation email and verify your email ' +
            'address to log in.';
        } else if (response_body.error === 'User is suspended') {
          message = 'Account suspended.';
        } else {
          message = 'Invalid email or password.';
        }
      }
      callback({ authenticated: false, errorMessage: message, error: response_body.error });
    },
    success: response => {
      const jwt = response.jwt_token;
      const roles = response.roles || [];

      if (!jwt) {
        callback({ authenticated: false });
        return;
      }
      callback({ authenticated: true, token: jwt, roles });
    }
  });
}

function confirmationRequest(email, token, callback) {
  request({
    url: `${apiUrl}/confirm`,
    method: 'POST',
    crossOrigin: true,
    type: 'json',
    contentType: 'application/json',
    data: JSON.stringify({ email, token }),
    error: error => {
      let message = 'An unknown error occured. Please try again later.';
      let response_body = {};

      try {
        response_body = JSON.parse(error.response);
      } catch (e) {
        // noop
      }

      if (error.status === 400) {
        message = response_body.error;
      }
      callback({ authenticated: false, errorMessage: message });
    },
    success: () => {
      safe_analytics('default', 'Registration', 'Login', 'Email');
      callback({ authenticated: true });
    }
  });
}

function getGoogleData(
  { accessToken, termsAgreed, is_contributor, marketing_campaign_token },
  page,
  callback
) {
  const redirect_uri = page === 'login' ? googleLoginRedirectUrl : googleActivateRedirectUrl;
  const data = {
    accessToken,
    redirect_uri,
    termsAgreed,
    is_contributor
  };

  if (marketing_campaign_token) {
    data.token = marketing_campaign_token;
  }

  request({
    url: `${apiUrl}/auth_google_token`,
    method: 'POST',
    crossOrigin: true,
    data,
    error: error => {
      const message = 'An unknown error occured. Please try again later.';
      callback({ authenticated: false, errorMessage: message });
    },
    success: result => {
      callback({
        authenticated: true,
        token: result.jwt_token,
        from_login: result.from_login,
        is_new: result.is_new,
        following_agency: result.following_agency,
        loginType: result.loginType,
        redirectToCallback: result.redirectToCallback,
        email: result.email
      });
    }
  });
}

export default {
  login(email, pass, requireAdmin, callback) {
    let token;
    try {
      // throws an error if local storage is disabled (safari private mode):
      token = localStorage.token;
    } catch (e) {
      callback(false, 'Cannot access local storage. You may need to leave private browsing mode.');
      return;
    }

    if (token) {
      if (callback) callback(true);
      return;
    }

    loginRequest(email, pass, res => {
      if (res.authenticated) {
        // n.b. admin/qa/contributor roles required for admin site login, dashboard limits things
        // further for qa users
        if (
          requireAdmin &&
          !(
            res.roles.includes('admin') ||
            res.roles.includes('qa') ||
            res.roles.includes('contributor')
          )
        ) {
          if (callback) callback(false, 'Your account does not have admin access');
          return;
        }
        try {
          localStorage.token = res.token;
        } catch (e) {
          callback(
            false,
            'Cannot access local storage. You may need to leave private browsing mode.'
          );
          return;
        }

        if (callback) callback(true);
      } else {
        if (callback) callback(false, res.errorMessage, res.error);
      }
    });
  },

  confirm_user(email, reset_token, callback) {
    confirmationRequest(email, reset_token, res => {
      if (res.authenticated) {
        if (callback) callback(true);
      } else {
        if (callback) callback(false, res.errorMessage);
      }
    });
  },

  redirectToLinkedIn(page) {
    let s = '';
    const amount = 21;
    while (s.length < amount) {
      s += String.fromCharCode(Math.random() * 127).replace(/\W|\d|_/g, '');
    }
    const state = s;

    /*
      fromLogin flag applied here when user signed up from login and finished onboarding
      return to login/dashboard
    */
    const redirect_uri =
      page === 'loginPage' || page === 'fromLogin'
        ? linkedInLoginRedirectUrl
        : linkedInActivateRedirectUrl;

    window.location =
      'https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=' +
      linkedInClientId +
      '&redirect_uri=' +
      redirect_uri +
      '&state=' +
      state;
  },

  initializeLinkedin(
    context,
    code,
    page,
    props,
    termsAgreed = null,
    linkedinToken = null,
    is_contributor,
    marketing_campaign_token
  ) {
    this.getLinkedInToken(
      { code, termsAgreed, linkedinToken, is_contributor, marketing_campaign_token },
      page,
      obj => {
        if (obj.is_new) {
          mixpanel.alias(obj.email);
        }

        const errorMessage = obj.errorMessage;
        if (!obj.authenticated) {
          context.setState({ errorMessage });
          return;
        }
        if (obj.redirectToCallback) {
          const query = { loginType: obj.loginType, user_role: obj.user_role };
          if (obj.marketing_campaign_token) {
            query.token = marketing_campaign_token;
          }
          context.context.router.push({
            pathname: obj.redirectToCallback,
            query,
            state: { page, linkedinToken: obj.linkedinToken }
          });
          return;
        }
        localStorage.token = obj.token;

        if (!obj.is_new && obj.following_agency) {
          // if user already signup via google, redirect them to dashboard.
          safe_analytics('default', 'Registration', 'Redirect to dashboard', 'Already registered');
          context.context.router.replace('/');
          return;
        }

        // user is new and a contributor:
        if (onboardingTooltipEnabled && is_contributor) {
          props.skipOnboarding();
          context.context.router.push({
            pathname: '/',
            state: { newContributorSignup: true }
          });
          return;
        }

        // user is new:
        if (onboardingTooltipEnabled) {
          props.skipOnboarding();
          context.context.router.replace('/');
          return;
        }

        if (page === 'activate') {
          safe_analytics('default', 'Onboarding', 'Advance step', 'Step 2');
          context.setState({
            status: 'personalize',
            flow: 'oauth_sign_up',
            numSteps: 2,
            fromSocialCallback: true
          });
          return;
        }
        safe_analytics('default', 'Onboarding', 'Advance step', 'Step 2');
        context.context.router.push({
          pathname: '/activate',
          state: {
            status: 'personalize',
            flow: 'oauth_sign_up',
            numSteps: 2,
            fromSocialCallback: true
          }
        });
      }
    );
  },
  getLinkedInToken(
    { code, termsAgreed, linkedinToken = null, is_contributor, marketing_campaign_token },
    page,
    callback
  ) {
    const redirect_uri = page === 'login' ? linkedInLoginRedirectUrl : linkedInActivateRedirectUrl;
    const data = {
      code,
      termsAgreed,
      redirect_uri,
      page,
      linkedinToken,
      is_contributor
    };
    if (marketing_campaign_token) {
      data.token = marketing_campaign_token;
    }
    request({
      url: `${apiUrl}/auth_linkedin_token`,
      method: 'POST',
      crossOrigin: true,
      data,
      error: error => {
        const message = 'An unknown error occured. Please try again later.';
        callback({ authenticated: false, errorMessage: message });
      },
      success: result => {
        callback({
          authenticated: true,
          token: result.jwt_token,
          from_login: result.from_login,
          is_new: result.is_new,
          following_agency: result.following_agency,
          loginType: result.loginType,
          redirectToCallback: result.redirectToCallback,
          accessToken: code,
          linkedinToken: result.token,
          email: result.email,
          user_role: result.user_role,
          marketing_campaign_token: result.marketing_campaign_token
        });
      }
    });
  },
  responseGoogle(googleUser, activateContext, props) {
    // activateContext is 'this' in Activate.js
    let location;
    if (window.location.pathname === '/login') {
      location = 'login';
    } else if (window.location.pathname === '/activate') {
      location = 'activate';
    }

    const isContributor = activateContext.props.location.query.user_role === 'contributor';

    getGoogleData(
      {
        accessToken: googleUser.accessToken,
        termsAgreed: activateContext.state.termsAgreed,
        is_contributor: isContributor,
        marketing_campaign_token: activateContext.state.token
      },
      location,
      obj => {
        if (obj.is_new) {
          mixpanel.alias(obj.email);
        }

        activateContext.setState({ error: null });

        const errorMessage = obj.errorMessage;
        if (!obj.authenticated) {
          activateContext.setState({ errorMessage });
          return;
        }

        localStorage.token = obj.token;

        if (!obj.is_new && obj.following_agency) {
          // if user already signup via google, redirect them to dashboard.
          safe_analytics('default', 'Registration', 'Redirect to dashboard', 'Already registered');
          activateContext.context.router.replace('/');
          return;
        }

        if (obj.redirectToCallback) {
          //redirect to social login agree-to-terms page
          const query = { loginType: obj.loginType, user_role: obj.user_role };
          if (activateContext.state.token) {
            query.token = activateContext.state.token;
          }
          const navData = {
            pathname: obj.redirectToCallback,
            query,
            state: { accessToken: googleUser.accessToken }
          };
          if (isContributor) {
            navData.query.user_role = 'contributor';
          }
          activateContext.context.router.push(navData);
          return;
        }

        // user is new and a contributor:
        if (onboardingTooltipEnabled && isContributor) {
          props.skipOnboarding();
          activateContext.context.router.push({
            pathname: '/',
            state: { newContributorSignup: true }
          });
          return;
        }

        // user is new:
        if (onboardingTooltipEnabled) {
          props.skipOnboarding();
          activateContext.context.router.replace('/');
          return;
        }

        if (location === 'activate') {
          safe_analytics('default', 'Onboarding', 'Advance step', 'Step 2');
          activateContext.setState({
            status: 'personalize',
            flow: 'oauth_sign_up',
            numSteps: 2,
            fromSocialCallback: true
          });
          return;
        }
        safe_analytics('default', 'Onboarding', 'Advance step', 'Step 2');
        activateContext.context.router.push({
          pathname: '/activate',
          state: {
            status: 'personalize',
            flow: 'oauth_sign_up',
            numSteps: 2,
            fromSocialCallback: true
          }
        });
      }
    );
  },
  getToken: () => {
    try {
      return localStorage.token;
    } catch (e) {
      return null;
    }
  },

  logout: callback => {
    try {
      delete localStorage.token;
      delete localStorage.user;
    } catch (e) {
      // ignore
    }
    if (callback) callback();
  },

  loggedIn: () => {
    //user token passed when switching between pro to admin site as contributor
    const token =
      browserName() !== 'ie' ? window.location.hash.slice(38) : document.location.hash.slice(38);
    const url = browserName() !== 'ie' ? window.location.hash : document.location.hash;

    if (token && _.includes(url, 'is_contributor')) {
      //prevent loop
      localStorage.token = token;
    }

    try {
      return !!localStorage.token;
    } catch (e) {
      return false;
    }
  },

  lockoutOnExpiredFreeTrial: (user, subscriptions, props, router, addBanner) => {
    if (_.isNil(user) || _.isNil(subscriptions)) {
      return;
    }
    const latestSub = latestSubscription(subscriptions);
    const expirationDate = latestSub.expirationDate;
    const today = moment().format('l');
    const expired = moment(expirationDate).isBefore(today);

    if (latestSub.category === 'free_trial' && expired) {
      if (props.location.pathname !== '/account' && props.location.pathname !== '/checkout') {
        router.push({
          pathname: '/checkout'
        });
        const bannerContent = (
          <div className="buyNowBanner">
            {`Your free trial has ended as of ${expirationDate}.  Please purchase a subscription.`}
          </div>
        );
        addBanner('error', true, bannerContent, true);
      }
    }
  }
};
