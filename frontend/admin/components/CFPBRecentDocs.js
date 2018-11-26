import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchIframeDocs } from '../../shared/actions';
import moment from 'moment';

const CFPB_AGENCY_ID = 573;

class CFPBRecentDocs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      documents: null,
      view_all: false
    };
  }

  componentDidMount() {
    this.props
      .fetchIframeDocs({
        agency_id: CFPB_AGENCY_ID,
        category: 'News',
        feature_name: 'cfpb_landing_page'
      })
      .then(response => {
        this.setState({
          documents: response.documents
        });
      });
  }

  pdf_overlay = null;

  openDocument = id => {
    this.props.showDoc(id);
  };

  formatDate = date => {
    if (!date) {
      return '';
    }
    return moment(date).format('MM/DD/YYYY');
  };

  render() {
    if (!this.state.documents) {
      return null;
    }
    const list_items = [];
    this.state.documents.forEach((doc, i) => {
      list_items.push(
        <li key={i} onClick={() => this.openDocument(doc.id)}>
          <div>
            <b>{doc.title}</b>
          </div>
          <div>{this.formatDate(doc.publication_date)}</div>
        </li>
      );
    });

    return (
      <div className="agency-info card-container">
        <h2>{'Latest News'}</h2>
        <ul className="recent-docs-list news-container">{list_items}</ul>
      </div>
    );
  }
}

CFPBRecentDocs.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    all_documents: state.all_documents
  };
};

const ReduxCFPBRecentDocs = connect(mapStateToProps, {
  fetchIframeDocs
})(CFPBRecentDocs);

export default ReduxCFPBRecentDocs;
