import 'babel-polyfill'; // TODO: Investigate if this is needed
import Bugsnag from 'bugsnag-js';
import React from 'react';
import ReactDOM from 'react-dom';
import { nodeEnv, bugsnagApiKey } from '../shared/config';
import routes from './routes';
import auth from '../shared/utils/auth';
import thunkMiddleware from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import { createStore, applyMiddleware } from 'redux';
import rootReducer from '../shared/reducers';
import { Provider } from 'react-redux';
import { syncHistoryWithStore } from 'react-router-redux';
import { Router, browserHistory } from 'react-router';
import { safe_ga, safe_mixpanel_track } from '../shared/utils/analytics';

import 'font-awesome/css/font-awesome.css';
import './styles/main.scss';

Bugsnag.apiKey = bugsnagApiKey;
Bugsnag.releaseStage = nodeEnv;
Bugsnag.notifyReleaseStages = ['production'];

// monkey patch XHR so it always has the original URL (source http://stackoverflow.com/a/26725823)
const xhrProto = XMLHttpRequest.prototype;
const origOpen = xhrProto.open;

xhrProto.open = function (method, url, ...args) {
  this._url = url;
  return origOpen.apply(this, [method, url, ...args]);
};

auth.getToken();

// setup redux
const store = createStore(
  rootReducer,
  composeWithDevTools(
    applyMiddleware(
      thunkMiddleware // lets us dispatch() functions
    )
  )
);

// Create an enhanced history that syncs navigation events with the store
const history = syncHistoryWithStore(browserHistory, store);

function routeUpdate() {
  if (this.state.location) {
    const { pathname } = this.state.location;
    safe_ga('send', 'pageview', pathname); // eslint-disable-line no-undef

    // annoying hack to add view (federal, state, topics, mainstream_news)
    // to pathname when on /sources page
    const mxp_pathname = (pathname === '/sources')
      ? `${pathname} (${this.state.location.query.view || 'federal'})`
      : pathname;

    safe_mixpanel_track('Pageview: ' + mxp_pathname, {
      hitType: 'pageview',
      page: mxp_pathname
    });
  }
}

ReactDOM.render(
  <Provider store={store}>
    <Router history={history} onUpdate={routeUpdate}>
      {routes()}
    </Router>
  </Provider>,
  document.getElementById('root')
);
