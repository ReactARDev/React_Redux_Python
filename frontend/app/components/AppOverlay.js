import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import DashboardPDFOverlay from './DashboardPDFOverlay';

const AppOverlay = props => {
  const overlay_name = _.get(props.current_view, 'overlay.name');
  if (overlay_name === 'pdf-overlay') {
    return <DashboardPDFOverlay />;
  }
  return null;
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxAppOverlay = connect(mapStateToProps, mapDispatchToProps)(AppOverlay);

export default ReduxAppOverlay;
