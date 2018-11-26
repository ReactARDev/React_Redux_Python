import React from 'react';
import { connect } from 'react-redux';
import { apiUrl } from '../../shared/config';

const DashboardPDFOverlay = props => {
  const id = props.current_view.id;
  const url = `${apiUrl}/document_pdf/${id}?access_token=${localStorage.token}`;
  return (
    <div id="pdf-overlay">
      <iframe src={url} />
    </div>
  );
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxDashboardPDFOverlay = connect(mapStateToProps, mapDispatchToProps)(DashboardPDFOverlay);

export default ReduxDashboardPDFOverlay;
