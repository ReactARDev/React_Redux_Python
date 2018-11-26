import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Col, Row } from 'react-bootstrap';
import yearOnAgenda from '../images/yearOnAgendaChart.png';
import consumerCompliants from '../images/consumerCompliantsChart.png';
import { agencyLandingPageUrl } from '../../shared/config';

class AgencyBanner extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    // display link to agency landing page if user searches for agency
    const landing_page_desc =
      'View the latest Regulatory Agenda activity, ' + 'recent news, and visual insights for the';
    const agency_id_info_map = {
      573: landing_page_desc + ' Consumer Financial Protection Bureau.',
      194: landing_page_desc + ' Financial Crimes Enforcement Network.',
      466: landing_page_desc + ' Securities and Exchange Commission.',
      188: landing_page_desc + ' Federal Reserve System.',
      164: landing_page_desc + ' Federal Deposit Insurance Corporation.',
      80: landing_page_desc + ' Comptroller of the Currency.',
      192: landing_page_desc + ' Federal Trade Commission.'
    };

    const selected_agency_id = this.props.filtered_mention.mention.id;
    const list_items = [];
    if (agency_id_info_map[selected_agency_id]) {
      list_items.push(
        <li className="blue-color document-result">
          <a
            className="link-to-agency-page"
            href={agencyLandingPageUrl + '?blur=false&id=' + selected_agency_id}
            target="_blank"
          >
            <div className="document-result-content">
              <Row className="document-result-row header">
                <div className="document-result-title">
                  {'Agency Landing Page: ' + this.props.filtered_mention.mention.short_name}
                  <div className="document-result-summary-text">
                    {agency_id_info_map[selected_agency_id]}
                  </div>
                </div>
                <div className="chart-img-container">
                  <img src={yearOnAgenda} alt="img-container" />
                </div>
                <div className="chart-img-container">
                  <img src={consumerCompliants} alt="img-container" />
                </div>
              </Row>
            </div>
          </a>
        </li>
      );
    }

    return (
      <Col xs={12} className="document-search-list-container">
        <ul className="document-search-list">{list_items}</ul>
      </Col>
    );
  }
}

AgencyBanner.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    filtered_mention: state.filtered_mention
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxAgencyBanner = connect(mapStateToProps, mapDispatchToProps)(AgencyBanner);

export default ReduxAgencyBanner;
