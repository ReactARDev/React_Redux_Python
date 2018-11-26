import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DocumentSearchListItem from './DocumentSearchListItem';
import { Col } from 'react-bootstrap';
import {
  fetchFullDocuments,
  setDocsToSelect,
  clearSelectedItems
} from '../../shared/actions';
import { sameDocsToSelect } from '../utils/getSelected';


export class DocumentSearchList extends React.Component {
  constructor(props) {
    super(props);
    this.state={};
  }

  componentDidUpdate(prevProps, prevState) {
    const { query } = this.props.location;
    const filter_or_relevance_key =
      query.search_sort === 'date' ? 'search_results_filter' : 'search_results_relevance';

    // if the search results are not ready or if this is being filtered on a
    // mention and that mention is not ready
    if (
      !this.props[filter_or_relevance_key].isReady ||
      (query.autosuggest_filter && !this.props.filtered_mention.isReady)
    ) {
      return;
    }
    const docs = { items: this.props[filter_or_relevance_key].results.documents };
    if (sameDocsToSelect(this.props.current_view.docs_to_select, docs)
    ) {
      return;
    }
    this.props.clearSelectedItems();
    this.props.setDocsToSelect(docs);
  }


  render() {
    const { query } = this.props.location;
    const filter_or_relevance_key =
      query.search_sort === 'date' ? 'search_results_filter' : 'search_results_relevance';

    // if the search results are not ready or if this is being filtered on a
    // mention and that mention is not ready
    if (
      !this.props[filter_or_relevance_key].isReady ||
      (query.autosuggest_filter && !this.props.filtered_mention.isReady)
    ) {
      return null;
    }

    const documents = { items: this.props[filter_or_relevance_key].results.documents };
    const list_items = [];

    documents.items.forEach((document, i) => {
      list_items.push(
        <DocumentSearchListItem
          key={document.id}
          document={document}
          location={this.props.location}
          index={i}
        />
      );
    });

    return (
      <Col xs={12} className="document-search-list-container">
        <ul className="document-search-list">
          {list_items}
        </ul>
      </Col>
    );
  }
}

DocumentSearchList.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};
const mapDispatchToProps = dispatch => {
  return {
    fetchFullDocuments: id => {
      dispatch(fetchFullDocuments({ id }));
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    setDocsToSelect: (docs) => {
      dispatch(setDocsToSelect(docs));
    }
  };
};
const ReduxDocumentSearchList = connect(mapStateToProps, mapDispatchToProps)(
  DocumentSearchList
);

export default ReduxDocumentSearchList;
