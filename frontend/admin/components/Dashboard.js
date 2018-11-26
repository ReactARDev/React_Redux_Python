import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import UserAnnotationTasks from './UserAnnotationTasks';
import InsightsCsv from './InsightsCsv';
import { Col, Row } from 'react-bootstrap';
import ContributorTasks from './ContributorTasks';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    if (!this.props.viewer.isReady) {
      return null;
    }

    // admin users have access to all pages here, qa users only have access to some
    const admin_user = this.props.viewer.user.roles.includes('admin');
    const contributor_user = this.props.viewer.user.roles.includes('contributor');

    if (contributor_user) {
      return (
        <div className="dashboard-container">
          <Row>
            <Col sm={8}>
              <h1>Contributor Dashboard</h1>
              <ContributorTasks />
            </Col>
            <Col sm={4}>
              <UserAnnotationTasks />
            </Col>
          </Row>
        </div>
      );
    }

    let document_qa_list_items = [
      <li>
        <Link to={'/incomplete-doc-tool'}>Incomplete Documents</Link>
      </li>
    ];

    let user_management = [];
    let viz_links = [];
    let topics_links = [];

    // only add the admin-specific stuff for admin users (not qa users)
    if (admin_user) {
      document_qa_list_items = document_qa_list_items.concat([
        <li>
          <Link to={'/admin-tool'}>Document Admin Tool</Link>
        </li>,
        <li>
          <Link to={'/document-update'}>Update Documents</Link>
        </li>,
        <li>
          <Link to={'/user-created-documents'}>User Created Documents</Link>
        </li>,
        <li>
          <Link to={'/skipped-documents'}>Skipped Documents</Link>
        </li>,
        <li>
          <Link to={'/contributor-statistics'}>Contributor Statistics</Link>
        </li>
      ]);

      user_management = user_management.concat([
        <li>
          <Link to={'/users'}>Users</Link>
        </li>,
        <li>
          <Link to={'/subscriptions'}>User Subscriptions</Link>
        </li>,
        <li>
          <Link to={'/invite'}>Invite Users</Link>
        </li>,
        <li>
          <Link to={'/marketing'}>Marketing Campaigns</Link>
        </li>
      ]);

      viz_links = viz_links.concat([
        <li>
          <Link to={'/volume-statistics'}>Volume Statistics</Link>
        </li>,
        <li>
          <Link to={'/google-analytics-reporting'}>Google Analytics Reporting</Link>
        </li>,
        <li>
          <Link to={'/charts'}>Charts</Link>
        </li>,
        <li>
          <Link to={'/agency-landing-page'}>Agency Landing Page</Link>
        </li>,
        <li>
          <Link to={'/publications'}>Publications</Link>
        </li>
      ]);

      topics_links = topics_links.concat([
        <li>
          <Link to={'/annotation_tasks'}>Annotation Tasks</Link>
        </li>,
        <li>
          <Link to={'/annotation_task_topic_groups'}>Annotation Task Topic Groups</Link>
        </li>,
        <li>
          <Link to={'/aggregated_annotations'}>Aggregated Annotations</Link>
        </li>,
        <li>
          <Link to={'/topics'}>Topics</Link>
        </li>,
        <li>
          <Link to={'/term-sampling-groups'}>Term Sampling Groups</Link>
        </li>,
        <li>
          <Link to={'/topics-stats'}>Topics Stats</Link>
        </li>
      ]);
    }

    let user_management_section = "";
    if (user_management.length > 0) {
      user_management_section = (
        <div>
          <h2>User Management</h2>
          <ul>{user_management}</ul>
        </div>
      );
    }

    let viz_section = "";
    if (viz_links.length > 0) {
      viz_section = (
        <div>
          <h2>Visualizations / Prototypes</h2>
          <ul>{viz_links}</ul>
        </div>
      );
    }

    let topics_section = "";
    if (topics_links.length > 0) {
      topics_section = (
        <div>
          <h2>Topics</h2>
          <ul>{topics_links}</ul>
        </div>
      );
    }

    return (
      <div className="dashboard-container">
        <Row>
          <h1>Dashboard</h1>
          <Col sm={8}>
            <h2>Document QA</h2>
            <ul>{document_qa_list_items}</ul>
            {topics_section}
            {user_management_section}
            {viz_section}
          </Col>
          <Col sm={4}>
            <UserAnnotationTasks />
          </Col>
        </Row>
        <InsightsCsv />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    viewer: state.current_user,
    current_view: state.current_view,
    errors: state.errors
  };
};

const ReduxDashboard = connect(mapStateToProps)(Dashboard);

export default ReduxDashboard;
