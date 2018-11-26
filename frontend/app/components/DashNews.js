import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { explicit_filter_function } from '../utils/filter';
import { fetchDocuments } from '../../shared/actions';
import moment from 'moment';
import DashNewsItem from './DashNewsItem';
import { GridList } from 'material-ui/GridList';
import _ from 'lodash';

class DashNews extends React.Component {
  constructor(props) {
    super(props);

    let slideNumber = 0;
    if (_.has(props.location, 'state.fromDashboard.news.slideNumber')) {
      slideNumber = props.location.state.fromDashboard.news.slideNumber;
    }

    this.state = {
      slideNumber
    };
  }

  componentWillMount() {
    const today = moment(Date.now()).format('MM/DD/YYYY');
    this.props.fetchDocuments({
      category: ['News', 'Mainstream News'],
      published_from: today,
      published_to: today
    });
  }

  componentWillReceiveProps(nextProps) {
    if (_.has(nextProps.location, 'state.fromDashboard.news.slideNumber')) {
      this.setState({ slideNumber: nextProps.location.state.fromDashboard.news.slideNumber });
    }
  }
  viewAllNews = () => {
    explicit_filter_function(
      { newsSourcesView: true },
      this.props.location,
      this.context.router,
      { category: ['News', 'Mainstream News'] },
      this.props
    );
  };

  render() {
    const news_docs = this.props.documents.combined_list;
    const carouselItems =
      news_docs.length <= 0 ? (
        <div />
      ) : (
        news_docs.map((doc, i) => (
          <div className="newsItemContainer" key={i}>
            <DashNewsItem document={doc} slideNumber={this.state.slideNumber} />
          </div>
        ))
      );

    return (
      <div className="news">
        <h1>{"Today's News"}</h1>
        <div onClick={this.viewAllNews}>
          <h5 className="subTitle">View All News</h5>
        </div>
        {news_docs.length <= 0 ? (
          <div className="noNews">
            <h3>No news from your sources yet today. Check again later.</h3>
            <div onClick={this.viewAllNews}>
              <h5 className="subTitle">View All News</h5>
            </div>
          </div>
        ) : (
          <GridList className="slickContainer">{carouselItems}</GridList>
        )}
      </div>
    );
  }
}

DashNews.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = state => {
  return {
    documents: state.documents
  };
};

const ReduxDashNews = connect(mapStateToProps, {
  fetchDocuments
})(DashNews);

export default ReduxDashNews;
