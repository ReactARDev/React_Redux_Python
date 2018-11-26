import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import moment from 'moment';
import { category_from_api } from '../../shared/utils/category';
import {
  safe_highlight_and_truncate,
  get_highlighted_string_fragments
} from '../../app/utils/string';

const MAX_EXCERPT_LENGTH = 175;

class IframeDoc extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  getSearchTerms(autosuggestItem) {
    const search_terms = [];
    const filtered_item = autosuggestItem;

    // make sure the name, short_name, id for the filtered item all get highlighted
    if (filtered_item) {
      if (filtered_item.name) {
        // n.b. dockets have no name
        search_terms.push(filtered_item.name);
      }
      if (filtered_item.short_name) {
        search_terms.push(filtered_item.short_name);
      }
      if (filtered_item.nicknames && filtered_item.nicknames.constructor === Array) {
        for (const nickname of filtered_item.nicknames) {
          search_terms.push(nickname);
        }
      }
    }
    return search_terms;
  }

  handleClick = (e, doc) => {
    this.props.showDoc(doc);
  };

  renderAgencyNames(document) {
    let text = null;
    if (document.agencies) {
      text = document.agencies
        .map(a => {
          return a.short_name || a.name;
        })
        .sort()
        .join(', ');
    }

    return text;
  }

  render() {
    const { doc, autosuggestItem } = this.props;

    const search_terms = this.getSearchTerms(autosuggestItem);
    const summary_text = [];

    const full_texts = get_highlighted_string_fragments(
      _.get(doc, 'full_text'),
      search_terms,
      'em'
    );

    if (full_texts) {
      let i = 0;
      for (const full_text of full_texts) {
        if (full_text) {
          const highlighted = safe_highlight_and_truncate(
            full_text,
            search_terms,
            'em',
            MAX_EXCERPT_LENGTH
          );
          const key = `${document.id}-${i}`;

          const initial = i === 0 ? '…' : '';

          summary_text.push(
            <span
              key={key}
              dangerouslySetInnerHTML={{
                __html: `${initial} ${highlighted} …`
              }}
            />
          );

          i++;
        }
      }
    }
    return (
      <tr className="doc" onClick={e => this.handleClick(e, doc)}>
        <td>
          <div className="title">{doc.title}</div>
          <div className="publicationDate">
            {doc.publication_date && doc.publication_date.length > 0 ? (
              <span>Publication Date: </span>
            ) : null}
            <span>{moment(doc.publication_date).format('MM/DD/YYYY')}</span>
          </div>
          <div className="metadata">
            <span className="agency">{this.renderAgencyNames(doc)} </span>
            <span className="category">{category_from_api(doc.category)}</span>
          </div>
          <div className="summaryText">
            {summary_text && summary_text.length > 0 ? <span>Summary: </span> : null}
            {summary_text}
          </div>
        </td>
      </tr>
    );
  }
}
IframeDoc.contextTypes = {
  router: PropTypes.object
};

export default IframeDoc;
