import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import trunc from 'trunc-html';
import classnames from 'classnames';
import _ from 'lodash';
import { navigateSummary } from '../utils/navigate';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import TopicsListItem from './TopicsListItem';
import DocumentSummaryLinks from './DocumentSummaryLinks';
import { getKeyDates } from '../utils/keyDates';
import { category_from_api } from '../../shared/utils/category';
import { defaultStateAgencies } from '../../shared/utils/defaultSources';
import { publication_to_spider } from '../utils/publications';

const formatDate = d => {
  if (_.isNil(d)) {
    return '';
  }
  return moment(d).format('dddd, MMMM Do, YYYY');
};

class DocumentSummary extends React.Component {
  constructor(props) {
    super(props);

    let summaryCollapsed = true;

    // special property used when rendering into a string for the send
    // email feature it should prevent loading data through redux,
    // which fails here
    if (props.renderForEmail) {
      summaryCollapsed = false;
    }

    this.state = {
      summaryCollapsed,
      state_code_id: null
    };
  }

  componentWillReceiveProps(nextProps) {
    const new_doc_selected = this.props.document.id !== nextProps.document.id;
    const is_state_code =
      nextProps.document.category === 'State Code Navigation' ||
      nextProps.document.category === 'State Code';

    if (new_doc_selected) {
      this.setState({
        summaryCollapsed: true,
        showLess: false
      });
    }
    if (is_state_code && new_doc_selected) {
      for (const state of defaultStateAgencies) {
        if (state.short_name === nextProps.document.agencies[0].jurisdiction) {
          this.setState({
            state_code_id: state.state_code_id
          });
        }
      }

      if (!_.isNil(nextProps.document.id)) {
        if (!this.props.us_state.codes[nextProps.document.id]) {
          this.props.fetchStateCode(nextProps.document.id).then(() => {
            this.props.buildStateCodeTree(nextProps.document.id);
          });
        } else {
          this.props.buildStateCodeTree(nextProps.document.id);
        }
      }
    }
  }

  // this rather annoying function the multiline-ellipsis scss
  // mixin to hide the "See More" link when the content is short
  expandShortSummary(container) {
    // make sure the document is ready
    if (!container || !this.state.summaryCollapsed || _.isEmpty(this.props.document)) {
      return;
    }

    const maxHeight = parseInt(window.getComputedStyle(container).maxHeight, 10);
    const textHeight = container.firstChild.offsetHeight;

    if (_.isNaN(maxHeight)) {
      return;
    }

    if (textHeight <= maxHeight) {
      this.setState({
        summaryCollapsed: false,
        showLess: false
      });
    }
  }

  viewRelated = e => {
    e.preventDefault();
    const document = this.props.document;

    this.context.router.push({
      pathname: '/content',
      query: {
        more_like_doc_id: document.id,
        summary_id: document.id,
        summary_page: 'summary',
        search_sort: 'relevance'
      }
    });
  };

  expandSummary(e) {
    e.preventDefault();
    this.setState({
      summaryCollapsed: false,
      showLess: true
    });
  }

  collapseSummary(e) {
    e.preventDefault();
    this.setState({
      summaryCollapsed: true
    });
  }

  render() {
    const document = this.props.document;
    const metadata = [];

    if (!document || Object.keys(document).length === 0) {
      return null;
    }

    const agencies = document.agencies || [];
    const cfrs = _.map(document.cfr_parts || [], 'cite').sort();
    const publisher = document.publisher || '';
    const publisherFragment = <span key={publisher}> {publisher} </span>;

    const agenciesFragment = agencies.map((agency, index) => {
      let link = `/content?agency=${agency.id}`;
      defaultStateAgencies.forEach(state => {
        if (state.id === agency.id) {
          link = `/state_code?citation_selected_id=${state.state_code_id}`;
        }
      });
      return (
        <span key={agency.id}>
          <Link to={link} title={agency.name}>
            {agency.short_name || agency.name}
          </Link>
          {index < document.agencies.length - 1 ? ', ' : null}
        </span>
      );
    });

    let authors = '';
    let firm = '';

    if (document.category === 'Whitepaper') {
      if (document.whitepaper.metadata.byline) {
        firm = document.whitepaper.metadata.byline.firm;
      }
    }

    const firmFragment = <span key={firm}> {firm} </span>;

    if (category_from_api(document.category) === 'Mainstream News') {
      const publication_name = publication_to_spider(document.spider_name);
      authors = publication_name;
    }

    if (document.category === 'Whitepaper') {
      authors = document.whitepaper.metadata.authors.reduce((combinedAuthors, author) => {
        if (combinedAuthors !== '') {
          combinedAuthors += ',' + author;
        } else {
          combinedAuthors = author;
        }
        return combinedAuthors;
      }, '');
    }

    const authorFrag =
      document.category === 'Whitepaper' ||
      category_from_api(document.category) === 'Mainstream News' ? (
        <span key={authors}> {authors} </span>
        ) : (
          agenciesFragment
        );

    const handleCitationClick = e => {
      e.preventDefault();
      const selected_id = e.target.dataset.id;

      if (!this.props.us_state.codes[selected_id]) {
        this.props.fetchStateCode(selected_id);
      }

      this.props.buildStateCodeTree(selected_id);

      //update right panel summary panel
      this.props.changeDocumentView('summary', selected_id);
      navigateSummary(this.props.location, this.context.router, selected_id);

      this.context.router.push({
        pathname: '/state_code',
        query: {
          citation_selected_id: selected_id,
          location_crumb_selected: true
        }
      });
    };

    const citationFragment = (
      <a onClick={handleCitationClick} data-id={document.id}>
        {document.official_id}
      </a>
    );

    const locationBreadCrumbs = [];

    //do not render breadcrumbs for e-mail
    if (!this.props.renderForEmail) {
      const path = this.props.path;

      for (const branch_id of path) {
        const branch = this.props.us_state.codes ? this.props.us_state.codes[branch_id] : null;

        if (!_.isNil(branch)) {
          const trunc_title = trunc(branch.title, 75).text;

          locationBreadCrumbs.push(
            <span key={branch.title}>
              <a onClick={handleCitationClick} title={branch.title} data-id={branch.id}>
                {trunc_title}
              </a>
              {_.indexOf(path, branch_id) !== path.length - 1 && path.length > 1 ? ' > ' : null}
            </span>
          );
        }
      }
    }
    // replace some gnarly quote chars with real quote chars that appear
    // in some parts of the data
    // FIXME: this is better resolved upstream
    const requoted_summary = document.summary_text
      ? document.summary_text.replace(/(&ldquo;|&rdquo;)/g, '"')
      : '';

    //only if "see more" is an option "see less" should be an option
    let expandOption = (
      <a className="read-more" onClick={e => this.expandSummary(e)}>
        See More
      </a>
    );

    if (this.state.showLess && !this.state.summaryCollapsed) {
      expandOption = (
        <a className="read-less" onClick={e => this.collapseSummary(e)}>
          See Less
        </a>
      );
    }

    let summary_heading = category_from_api(document.category);

    metadata.push({
      name: 'Author',
      value: authorFrag
    });

    metadata.push({
      name: 'Published',
      value: formatDate(document.publication_date)
    });

    if (document.category === 'Whitepaper') {
      metadata.push({
        name: 'Firm',
        value: firmFragment
      });
    }

    if (document.category === 'Whitepaper') {
      metadata.push({
        name: 'Publisher',
        value: publisherFragment
      });
    }

    const topics_list = this.props.renderForEmail
      ? document.topics.map(topic => topic.name).join(', ')
      : document.topics.map(topic => (
        <TopicsListItem
          key={topic.id}
          document={document}
          topic={topic}
          location={this.props.location}
          rightPanel
        />
      ));

    if (!_.isEmpty(topics_list)) {
      metadata.push({
        name: 'Topics',
        value: topics_list
      });
    }

    //state code branch summary view
    if (
      (document.category === 'State Code Navigation' || document.category === 'State Code') &&
      !this.props.renderForEmail &&
      this.props.us_state.codes
    ) {
      summary_heading = this.props.us_state.codes[this.state.state_code_id]
        ? this.props.us_state.codes[this.state.state_code_id].title
        : '';

      metadata.push({
        name: 'Citation',
        value: citationFragment
      });

      metadata.push({
        name: 'Location',
        value: locationBreadCrumbs
      });

      metadata.push({
        name: 'Verified',
        value: formatDate(document.updated_at)
      });
    } else {
      const keyDates = getKeyDates(document, 'dddd, MMMM Do, YYYY');

      if (keyDates.length > 0) {
        metadata.push({
          name: 'Key Dates',
          value: keyDates
        });
      }

      metadata.push({
        name: 'Document Type',
        value: category_from_api(document.category)
      });

      if (!_.isEmpty(cfrs)) {
        metadata.push({
          name: 'CFR',
          value: cfrs.join(', ')
        });
      }
    }

    const locationClasses = [];
    const metadataFragment = [];
    const metadata_sorted = _.sortBy(metadata, 'name');

    //necessarily need to input seperate tables to set varing widths
    for (const m of metadata_sorted) {
      if (m.name === 'Location') {
        locationClasses.push('location-table');
      } else if (_.includes(locationClasses, 'location-table')) {
        locationClasses.pop('location-table');
      }
      const locationNameClass = {
        'location-name': m.name === 'Location',
        'doc-summary-topics-list': m.name === 'Topics'
      };
      metadataFragment.push(
        <table key={m.name} className={classnames(locationClasses)}>
          <tbody>
            <tr>
              <td>{m.name}</td>
              <td className={classnames(locationNameClass)}>{m.value}</td>
            </tr>
          </tbody>
        </table>
      );
    }

    let related_document_count = '';

    if (!_.isNil(this.props.relatedDocumentCount)) {
      related_document_count = `(${this.props.relatedDocumentCount})`;
    }

    return (
      <div className="rule-content">
        <h4 className="heading">{summary_heading}</h4>
        <h2>{document.title}</h2>
        {document.category !== 'State Code Navigation' ? (
          <section className="view-btn-container">
            <DocumentSummaryLinks
              document={document}
              toggleOverlay={this.props.toggleOverlay}
              renderForEmail={this.props.renderForEmail}
              markDocumentAsRead={this.props.markDocumentAsRead}
              location={this.props.location}
            />
          </section>
        ) : null}
        {document.category !== 'State Code Navigation' ? (
          <section>
            <h4 className="heading">Summary</h4>
            {requoted_summary !== '' ? (
              <div
                className={this.state.summaryCollapsed ? 'summary collapsed' : 'summary'}
                ref={e => this.expandShortSummary(e)}
              >
                <p>{requoted_summary}</p>
                {expandOption}
              </div>
            ) : null}
          </section>
        ) : null}
        <div className="rule-detail-content">{metadataFragment}</div>
        <div className="related-button-container" onClick={e => this.viewRelated(e)}>
          <Button
            className="center-block"
            bsClass="related-button"
            type="button"
            title="Finds similar documents in Compliance.ai"
          >
            Similar Documents {related_document_count}
          </Button>
        </div>
      </div>
    );
  }
}

DocumentSummary.contextTypes = {
  router: PropTypes.object
};

export default DocumentSummary;
