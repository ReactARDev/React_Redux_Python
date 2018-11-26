import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { fetchPopularDocs } from '../../shared/actions';
import { safe_analytics } from '../../shared/utils/analytics';

class DashPopularDocuments extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.props.fetchPopularDocs();
  }
  handleClick = doc => {
    const pathname = '/content';
    const query = {
      overlay: 'pdf-overlay',
      summary_id: doc.doc_id,
      summary_page: 'summary'
    };
    const outerScrollContainer = document.querySelector('.newDashboardContainer');
    this.context.router.push({
      pathname,
      query,
      state: {
        fromDashboard: {
          outer: outerScrollContainer.scrollTop
        } //added to indicate the source location
      }
    });
    safe_analytics(
      'Dashboard – Popular Document Click',
      'Dashboard',
      'Popular Document Click',
      doc.title
    );
  };

  render() {
    return (
      <div className="summaryContainer popularDocuments">
        <div className="summary">
          <h3>Trending Documents</h3>
          {this.props.popular_docs.map((doc, i) =>
            <div onClick={() => this.handleClick(doc)} key={i}>
              <h5>
                {doc.title}
              </h5>
            </div>
          )}
        </div>
      </div>
    );
  }
}

DashPopularDocuments.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ popular_docs }) => {
  return { popular_docs: popular_docs.popular_docs };
};

const ReduxDashPopularDocuments = connect(mapStateToProps, { fetchPopularDocs })(
  DashPopularDocuments
);

export default ReduxDashPopularDocuments;
