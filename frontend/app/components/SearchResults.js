import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DocumentSearchList from './DocumentSearchList';
import { changeDocumentView } from '../../shared/actions';
import classnames from 'classnames';

class SearchResults extends React.Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    //needed to reset doc summary view when results load
    this.props.changeDocumentView('', null);
  }

  render() {
    const searchTimelineClasses = {
      'dashboard-timeline-container': true,
      'loading-overlay-light': true,
      'loading-active': this.props.isLoading
    };

    return (
      <div className={classnames(searchTimelineClasses)}>
        <DocumentSearchList
          location={this.props.location}
          search_results_relevance={this.props.search_results_relevance}
          search_results_filter={this.props.search_results_filter}
          current_view={this.props.current_view}
          filtered_mention={this.props.filtered_mention}
          documents_full={this.props.documents_full}
        />
      </div>
    );
  }
}

SearchResults.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    search_results_relevance: state.search_results_relevance,
    search_results_filter: state.search_results_filter,
    documents_full: state.documents_full,
    filtered_mention: state.filtered_mention,
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    }
  };
};

const ReduxSearchResults = connect(mapStateToProps, mapDispatchToProps)(SearchResults);

export default ReduxSearchResults;
