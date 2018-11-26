import React from 'react';
import { IndexRedirect, Route } from 'react-router';

import auth from '../shared/utils/auth.js';
import App from './components/App';
import AppAnon from './components/AppAnon';
import UserAccount from './components/UserAccount';
import Content from './components/Content';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Settings from './components/Settings';
import Support from './components/Support';
import ResetPassword from './components/ResetPassword';
import Activate from './components/Activate';
import Legal from './components/Legal';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Sources from './components/Sources';
import Checkout from './components/Checkout';
import Topics from './components/Topics';
import Folders from './components/Folders';
import Insights from './components/Insights';
import SocialCallback from './components/SocialCallback';
import StateCodeMenu from './components/StateCodeMenu';
import GoogleForm from './components/GoogleForm';

import { appAdminUrl } from '../shared/config';

function redirectToDashboard(nextState, replace) {
  if (auth.loggedIn()) {
    replace('/dashboard');
  }
}

function redirectToAdmin() {
  if (window) {
    window.location =
      appAdminUrl +
      `#/dashboard?is_contributor=true&token=${encodeURIComponent(localStorage.token)}`;
  } else {
    // for IE
    document.location =
      appAdminUrl +
      `#/dashboard?is_contributor=true&token=${encodeURIComponent(localStorage.token)}`;
  }
}

function requireAuth(nextState, replace) {
  if (!auth.loggedIn()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    });
  }
}

function logout(nextState, replace) {
  auth.logout();
  replace({
    pathname: '/login'
  });
}

export default () => {
  return (
    <Route>
      <Route path="logout" onEnter={logout} />
      <Route path="/" component={AppAnon}>
        <IndexRedirect to="dashboard" /> {/* will redirect to login if non-auth */}
        <Route path="login" component={Login} onEnter={redirectToDashboard} />
        <Route path="reset-password" component={ResetPassword} />
        <Route path="activate" component={Activate} />
        <Route path="privacy" component={PrivacyPolicy} />
        <Route path="terms" component={TermsOfService} />
        <Route path="nonAuthSupport" component={Support} />
        <Route path="socialcallback" component={SocialCallback} />
      </Route>
      <Route path="/" component={App} onEnter={requireAuth}>
        <Route path="dashboard" component={Dashboard} />
        <Route path="content" component={Content} />
        <Route path="account" component={UserAccount} />
        <Route path="settings" component={Settings} />
        <Route path="legal" component={Legal} />
        <Route path="sources" component={Sources} />
        <Route path="checkout" component={Checkout} />
        <Route path="topics" component={Topics} />
        <Route path="support" component={Support} />
        <Route path="folders" component={Folders} />
        <Route path="insights" component={Insights} />
        <Route path="state_code" component={StateCodeMenu} />
        <Route path="contributorsurvey" component={GoogleForm} />
      </Route>
      {/* keep the app from flashing on transition */}
      <Route path="admin-contributor" onEnter={redirectToAdmin} />
    </Route>
  );
};
