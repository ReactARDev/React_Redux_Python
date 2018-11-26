import 'babel-polyfill'; // TODO: Investigate if this is needed

import createHashHistory from 'history/lib/createHashHistory';
import Bugsnag from 'bugsnag-js';
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, useRouterHistory } from 'react-router';

import { nodeEnv, bugsnagApiKey } from '../shared/config';
import routes from './routes';
import auth from '../shared/utils/auth';

import thunkMiddleware from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import { createStore, applyMiddleware } from 'redux';
import rootReducer from '../shared/reducers';
import { Provider } from 'react-redux';
import { safe_ga, safe_mixpanel_track } from '../shared/utils/analytics';

import 'font-awesome/css/font-awesome.css';
import './styles/main.scss';

Bugsnag.apiKey = bugsnagApiKey;
Bugsnag.releaseStage = nodeEnv;
Bugsnag.notifyReleaseStages = ['production'];

auth.getToken();

const history = useRouterHistory(createHashHistory)({ queryKey: false });

// setup redux
let store = null;
if (process.env.NODE_ENV === 'production') {
  store = createStore(
    rootReducer,
    composeWithDevTools(
      applyMiddleware(
        thunkMiddleware // lets us dispatch() functions
      )
    )
  );
} else {
  store = createStore(
    rootReducer,
    composeWithDevTools(
      applyMiddleware(
        thunkMiddleware, // lets us dispatch() functions
      )
    )
  );
}

function routeUpdate() {
  if (this.state.location) {
    const { pathname } = this.state.location;

    safe_ga('send', 'pageview', pathname); // eslint-disable-line no-undef
    safe_mixpanel_track('Pageview: ' + pathname, {
      hitType: 'pageview',
      page: pathname
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
