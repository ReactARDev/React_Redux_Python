import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import { truncate } from '../../shared/utils/string';
import { safe_analytics } from '../../shared/utils/analytics';
import { publication_to_spider } from '../utils/publications';
import { GridListTile } from 'material-ui/GridList';
import { apiUrl } from '../../shared/config';

class DashNewsItem extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  handleClick = doc => {
    if (doc.category === 'Mainstream News') {
      window.open(doc.web_url, '_blank');
    } else {
      const pathname = '/content';
      const query = {
        category: 'News',
        overlay: 'pdf-overlay',
        summary_id: doc.id,
        summary_page: 'summary'
      };
      const outerScrollContainer = document.querySelector(
        '.newDashboardContainer'
      );
      this.context.router.push({
        pathname,
        query,
        state: {
          fromDashboard: {
            outer: outerScrollContainer.scrollTop,
            news: {
              slideNumber: this.props.slideNumber
            }
          } //added to indicate the source location
        }
      });
    }
    safe_analytics('default', 'Dashboard', 'News Card Click');
  };

  render(props) {
    const mainstream_news = this.props.document
      ? this.props.document.category === 'Mainstream News'
      : null;

    if (
      !this.props.document ||
      (!this.props.document.agencies && !mainstream_news)
    ) {
      return null;
    }

    const agencyToIconClassMap = {
      FDIC: 'monetary',
      FRS: 'monetary',
      OCC: 'monetary',
      TREAS: 'monetary',
      'CA-DBO': 'state',
      CFPB: 'consumer',
      FTC: 'consumer',
      FFIEC: 'examination',
      FINRA: 'stock',
      NYSE: 'stock',
      'The Hill: Finance Regulation': 'hill',
      'The Hill: Finance Policy': 'hill',
      'American Banker': 'american_banker',
      'The Economist: Finance and Economics': 'economist'
    };

    const firstAgency =
      !mainstream_news && this.props.document.agencies[0]
        ? this.props.document.agencies[0].short_name
        : publication_to_spider(this.props.document.spider_name); // used to select icon
    const iconClass = agencyToIconClassMap[firstAgency] || 'monetary'; // monetary is backup icon

    const title = truncate(this.props.document.title, 90);

    const source = !mainstream_news
      ? this.props.document.agencies.map(agency => agency.short_name).join(',')
      : truncate(publication_to_spider(this.props.document.spider_name), 20);

    const image_present =
      !_.isNil(this.props.document.mainstream_news) &&
      !_.isNil(this.props.document.mainstream_news.image_url);

    return (
      <GridListTile>
        <div
          onClick={() => this.handleClick(this.props.document)}
          className="newsItem"
        >
          {image_present ? (
            <img
              className="news-img"
              src={apiUrl + `/document_image/` + this.props.document.id + '?access_token=' + localStorage.token}
              alt="news_img"
            />
          ) : (
            <div className={`icon ${iconClass}`} />
          )}
          <div title={this.props.document.title}>{title}</div>
          <div className="agencies">
            <h6
              title={
                mainstream_news
                  ? publication_to_spider(this.props.document.spider_name)
                  : source
              }
            >
              Source: {source}
            </h6>
          </div>
        </div>
      </GridListTile>
    );
  }
}

DashNewsItem.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = state => {
  return {};
};

const ReduxDashNewsItem = connect(mapStateToProps, {})(DashNewsItem);

export default ReduxDashNewsItem;
