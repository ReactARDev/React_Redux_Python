import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Col, Row } from 'react-bootstrap';
import { fetchGoogleAnalyticsReports } from '../../shared/actions';

class GoogleAnalyticsReporting extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      event_actions: [
        'View document',
        'Received search results',
        'Download document',
        'Print document',
        'Email document'
      ]
    };
  }

  componentWillMount() {
    this.props.fetchGoogleAnalyticsReports(this.state.event_actions);
  }

  render() {
    if (!this.props.google_analytics || !this.props.google_analytics.isReady) {
      return null;
    }

    const create_table_rows = (documents, rows) => {
      documents.forEach((document, i) => {
        rows.push(
          <tr key={i}>
            <td>
              {document[0]}
            </td>
            <td className="text-right">
              {document[1]}
            </td>
          </tr>
        );
      });
    };

    const reports = this.props.google_analytics.reports;
    const top_viewed_rows = [];
    const top_searched_rows = [];
    const top_downloaded_rows = [];
    const top_printed_rows = [];
    const top_emailed_rows = [];

    reports.forEach((report, i) => {
      if (report.event_action === 'View document') {
        create_table_rows(report.documents, top_viewed_rows);
      } else if (report.event_action === 'Received search results') {
        create_table_rows(report.documents, top_searched_rows);
      } else if (report.event_action === 'Download document') {
        create_table_rows(report.documents, top_downloaded_rows);
      } else if (report.event_action === 'Print document') {
        create_table_rows(report.documents, top_printed_rows);
      } else if (report.event_action === 'Email document') {
        create_table_rows(report.documents, top_emailed_rows);
      }
    });

    return (
      <div className="main-container">
        <h1>Google Analytics reports for the past 30 days</h1>
        <Row>
          <Col sm={6}>
            <h4>Top Viewed Documents</h4>
            <Table striped condensed hover>
              <tbody>
                {top_viewed_rows}
              </tbody>
            </Table>
          </Col>
          <Col sm={6}>
            <h4> Top Searched Documents</h4>
            <Table striped condensed hover>
              <tbody>
                {top_searched_rows}
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <h4> Top Downloaded Documents</h4>
            <Table striped condensed hover>
              <tbody>
                {top_downloaded_rows}
              </tbody>
            </Table>
          </Col>
          <Col sm={6}>
            <h4> Top Printed Documents</h4>
            <Table striped condensed hover>
              <tbody>
                {top_printed_rows}
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <h4> Top Emailed Documents</h4>
            <Table striped condensed hover>
              <tbody>
                {top_emailed_rows}
              </tbody>
            </Table>
          </Col>
        </Row>
      </div>
    );
  }
}

GoogleAnalyticsReporting.contextTypes = {
  router: PropTypes.object
};
const mapDispatchToProps = dispatch => {
  return {
    fetchGoogleAnalyticsReports: event_actions => {
      dispatch(fetchGoogleAnalyticsReports(event_actions));
    }
  };
};

const mapStateToProps = state => {
  return {
    google_analytics: state.google_analytics
  };
};

const ReduxGoogleAnalyticsReporting = connect(mapStateToProps, mapDispatchToProps)(
  GoogleAnalyticsReporting
);

export default ReduxGoogleAnalyticsReporting;
