import React from 'react';
import Rule from './Rule';
import RecentActivity from './RecentActivity';
import _ from 'lodash';
import { connect } from 'react-redux';
import { get_search_view } from '../utils/search';

const RightPanel = props => {
  const documentId = props.current_view.id;
  const app_view = get_search_view(props.current_view.search_params);
  let contents;

  if (_.isNil(documentId)) {
    if (app_view.section === 'search') {
      contents = (
        <div>
          <h2>Search Results</h2>
          <p>Select a Document to view summary.</p>
        </div>
      );
    } else {
      contents = <RecentActivity location={props.location} />;
    }
  } else {
    contents = <Rule location={props.location} />;
  }

  return (
    <div className="right-panel">
      {contents}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    errors: state.errors,
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxRightPanel = connect(mapStateToProps, mapDispatchToProps)(RightPanel);

export default ReduxRightPanel;
