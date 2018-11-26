import React from 'react';
import { IndexRedirect, Route } from 'react-router';

import auth from '../shared/utils/auth.js';
import App from './components/App';
import ReduxDashboard from './components/Dashboard';
import Login from './components/Login';
import Invite from './components/Invite';
import Users from './components/Users';
import Publications from './components/Publications';
import ReduxAnnotationTasks from './components/AnnotationTasks';
import VolumeStatistics from './components/VolumeStatistics';
import AdminTool from './components/AdminTool';
import DocumentUpdate from './components/DocumentUpdate';
import GoogleAnalyticsReporting from './components/GoogleAnalyticsReporting';
import UserCreatedDocuments from './components/UserCreatedDocuments';
import marketingCampaigns from './components/marketingCampaigns';
import Charts from './components/Charts';
import Iframe from './components/Iframe';
import AnnotationTool from './components/AnnotationTool';
import TermSamplingGroups from './components/TermSamplingGroups';
import ContributorTool from './components/ContributorTool';
import ContributorStatistics from './components/ContributorStatistics';
import { appUrl } from '../shared/config';
import SkippedDocuments from './components/SkippedDocuments';
import Subscriptions from './components/Subscriptions';
import Topics from './components/Topics';
import TopicsStats from './components/TopicsStats';
import AgencyLandingPage from './components/AgencyLandingPage';
import IncompleteDocTool from './components/IncompleteDocTool';
import AnnotationTaskTopicGroups from './components/AnnotationTaskTopicGroups';
import AggregatedAnnotations from './components/AggregatedAnnotations';
import ReduxSlotTool from "./components/SlotTool";

function redirectToDashboard(nextState, replace) {
  if (auth.loggedIn()) {
    replace('/');
  }
}

function redirectToPro() {
  if (window) {
    window.location =
      appUrl + `dashboard?is_contributor=true&token=${encodeURIComponent(localStorage.token)}`;
  } else {
    // for IE
    document.location =
      appUrl + `dashboard?is_contributor=true&token=${encodeURIComponent(localStorage.token)}`;
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

function logout() {
  auth.logout();
  window.location = '/'; // XXX: Full-page refresh required.
}

export default () => {
  return (
    <Route>
      <Route path="login" component={Login} onEnter={redirectToDashboard} />
      <Route path="logout" onEnter={logout} />
      <Route path="iframe" component={Iframe} />
      <Route path="agency-landing-page" component={AgencyLandingPage} />
      <Route path="/" component={App} onEnter={requireAuth}>
        <IndexRedirect to="dashboard" />
        <Route path="dashboard" component={ReduxDashboard} />
        <Route path="invite" component={Invite} />
        <Route path="users" component={Users} />
        <Route path="publications" component={Publications} />
        <Route path="annotation_tasks" component={ReduxAnnotationTasks} />
        <Route path="annotation_task_topic_groups" component={AnnotationTaskTopicGroups} />
        <Route path="aggregated_annotations" component={AggregatedAnnotations} />
        <Route path="volume-statistics" component={VolumeStatistics} />
        <Route path="admin-tool" component={AdminTool} />
        <Route path="document-update" component={DocumentUpdate} />
        <Route path="google-analytics-reporting" component={GoogleAnalyticsReporting} />
        <Route path="user-created-documents" component={UserCreatedDocuments} />
        <Route path="marketing" component={marketingCampaigns} />
        <Route path="charts" component={Charts} />
        <Route path="annotationtool" component={AnnotationTool} />
        <Route path="term-sampling-groups" component={TermSamplingGroups} />
        <Route path="contributortool" component={ContributorTool} />
        <Route path="contributor-statistics" component={ContributorStatistics} />
        <Route path="skipped-documents" component={SkippedDocuments} />
        <Route path="subscriptions" component={Subscriptions} />
        <Route path="topics" component={Topics} />
        <Route path="topics-stats" component={TopicsStats} />
        <Route path="incomplete-doc-tool" component={IncompleteDocTool} />
        <Route path="slot-tool" component={ReduxSlotTool} />
      </Route>
      {/* keep the app from flashing on transition */}
      <Route path="pro-contributor" onEnter={redirectToPro} />
    </Route>
  );
};
