import React from 'react';
import { connect } from 'react-redux';
import CFPBAgency from './CFPBAgency';
import CFPBPieChart from './CFPBPieChart';
import { Grid, Row, Col } from 'react-bootstrap';
import { apiUrl, iframeApiKey } from '../../shared/config';
import CFPBRecentDocs from './CFPBRecentDocs';
import ConsumerComplaintsChart from './ConsumerComplaintsChart';

const AGENCY_INTRO =
  'Established by the Dodd-Frank Wall Street Reform ' +
  'and Consumer Protection Act of 2010, the Consumer Financial Protection ' +
  'Bureau (CFPB) is a federal agency that aims to support consumer finance markets. ' +
  'The Bureau is charged with making rules more effective, consistently and ' +
  'fairly enforcing those rules, and empowering consumers to take more control ' +
  'over their economic lives.';

class AgencyLandingPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDoc: false,
      doc_id: null
    };
  }

  showDoc = doc_id => {
    this.setState({ showDoc: true, doc_id });
  };

  render() {
    if (this.state.showDoc) {
      const src = `${apiUrl}/doc_pdf?access_token=${encodeURIComponent(iframeApiKey)}&doc_id=${
        this.state.doc_id
      }`;
      return (
        <div id="pdf-overlay">
          <div className="back-to-agency-link" onClick={() => this.setState({ showDoc: false })}>
            <i className="material-icons">navigate_before</i>
            <span>Back to agency page</span>
          </div>
          <iframe src={src} />
        </div>
      );
    }

    return (
      <div className="agency-landing-container">
        <Grid>
          <Row>
            <Col md={12}>
              <CFPBAgency showDoc={this.showDoc} />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <div className="agency-info card-container">
                <h2>About CFPB</h2>
                <p>{AGENCY_INTRO}</p>
              </div>
            </Col>
            <Col md={6}>
              <div>
                <CFPBPieChart />
              </div>
            </Col>
          </Row>
          <Row className="row-margin">
            <Col md={6}>
              <CFPBRecentDocs showDoc={this.showDoc} />
            </Col>
            <Col md={6}>
              <ConsumerComplaintsChart />
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxAgencyLandingPage = connect(mapStateToProps, mapDispatchToProps)(AgencyLandingPage);

export default ReduxAgencyLandingPage;
