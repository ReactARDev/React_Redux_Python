/* eslint-disable max-len */
import React from 'react';
import { connect } from 'react-redux';
import escapeStringRegexp from 'escape-string-regexp';
import _ from 'lodash';
import { fetchIframeAutoComplete, fetchIframeDocs, fetchMention } from '../../shared/actions';
import { autosuggest_name_map, autosuggest_filter_mapping } from '../../shared/utils/autosuggest';
import { Modal } from 'react-bootstrap';
import IframeDocs from './IframeDocs';
import logo from '../images/Logo-Round-128px.png';

class Iframe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: '',
      autocompletes: [],
      docs: [],
      showModal: false,
      autosuggestItem: {},
      neverShowModal: false,
      showNoAutocompletesMessage: false
    };
  }
  componentWillMount() {
    this.handleUrlQuery(this.props);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.location.search !== this.props.location.search) {
      this.handleUrlQuery(nextProps);
    }
    this.setState({ autocompletes: nextProps.autocompletes.items });
  }

  handleUrlQuery = props => {
    // code to gather instructions from params in iframe src url
    const rawQuery = props.location.query;
    if (!_.isNil(rawQuery.item)) {
      //TODO: add extra check for key and id and other important params
      const searchTerm = rawQuery.searchTerm;
      this.setState({ searchTerm });
      const item = JSON.parse(rawQuery.item);
      delete rawQuery.item;
      delete rawQuery.searchTerm;
      const query = {
        ...rawQuery
      };

      this.fetchDocs(query, item);
    }
    if (rawQuery.neverShowModal) {
      this.setState({ neverShowModal: rawQuery.neverShowModal });
    }
  };

  fetchDocs = (query, item) => {
    query.limit = 5;
    this.props.fetchIframeDocs(query).then(response => {
      const docs = response.documents;
      this.setState({
        docs,
        showModal: true,
        autosuggestItem: item,
        autocompletes: []
      });
    });
  };

  handleOnChange = e => {
    const searchTerm = e.target.value;
    this.setState({ searchTerm });
    if (searchTerm.length > 1) {
      this.props.fetchIframeAutoComplete({ query: searchTerm }).then(res => {
        if (res.results <= 0) {
          this.setState({ showNoAutocompletesMessage: true });
        } else {
          this.setState({ showNoAutocompletesMessage: false });
        }
      });
    }
  };

  handleAutosuggestItemClick(item, display_match) {
    const filter_type = item._type;
    const filter_mapping = autosuggest_filter_mapping[filter_type];
    const searchTerm = display_match.term;
    this.setState({
      searchTerm
    });
    if (filter_mapping) {
      const key = filter_mapping.filter;
      const query = {
        [key]: item.id
      };
      const message = {
        url: `${key}=${item.id}&item=${JSON.stringify(item)}&searchTerm=${searchTerm}`
      };

      // TODO IMPORTANT: ADD SECURITY TO POST MESSAGE
      window.parent.postMessage(message, '*');
      this.fetchDocs(query, item);
    }
  }
  closeModal = () => {
    this.setState({ showModal: false });
  };

  handleNext() {
    this.setState({ page: this.state.page + 1 });
  }
  render() {
    let autosuggest_dropdown = null;

    if (this.state.showNoAutocompletesMessage && this.state.searchTerm.length > 1) {
      autosuggest_dropdown = (
        <div ref="menu" className="augosuggestDropdown">
          <div className="item">Please try another search term</div>
        </div>
      );
    }

    const display_matches = [];
    if (
      this.state.autocompletes &&
      this.state.autocompletes.length > 0 &&
      this.state.searchTerm.length > 0
    ) {
      const items = this.state.autocompletes;

      let menu_items = [];
      /* eslint-disable no-unused-vars */
      let index = 0;

      const search_term_regex = new RegExp(escapeStringRegexp(this.state.searchTerm), 'gi');
      const term_counts = {};

      for (const item of items) {
        let short_names = [];
        if (_.isString(item.short_name)) {
          short_names = [item.short_name];
        } else if (_.isArray(item.short_name)) {
          short_names = item.short_name;
        }
        for (const matched_query_field of item._matched_queries) {
          if (matched_query_field === 'name') {
            const term = item.name;
            display_matches.push({ key: 'name', term, item });
            const lowercase_term = term.toLowerCase();
            if (term_counts[lowercase_term]) {
              term_counts[lowercase_term] += 1;
            } else {
              term_counts[lowercase_term] = 1;
            }
          } else {
            short_names.forEach((short_name, inner_index) => {
              // n.b. only other option supported by api is short_name
              // use the short name if it matches our regex, since elastic tells us
              // that the field matched, not which indices in the array matched
              if (search_term_regex.test(short_name)) {
                display_matches.push({
                  key: 'short_name',
                  term: short_name,
                  index: inner_index,
                  item
                });
                const lowercase_term = short_name.toLowerCase();
                if (term_counts[lowercase_term]) {
                  term_counts[lowercase_term] += 1;
                } else {
                  term_counts[lowercase_term] = 1;
                }
              }
            });
          }
        }
      }

      for (const display_match of display_matches) {
        // n.b. this is kinda weird but otherwise the index stuff below doesn't work
        const item = display_match.item;
        const entity = autosuggest_name_map[item._type];

        let display_name = display_match.term;
        // if there are duplicate names in the list here, we need to resolve it somehow
        // n.b. this does get very specific but i think it probably has to since
        // the display
        if (term_counts[display_name.toLowerCase()] > 1) {
          if (display_match.key === 'short_name') {
            display_name += ' (' + item.name + ')';
          } else if (item._type === 'regulations' || item._type === 'named_regulations') {
            display_name += ' (' + item.issue + ')';
          }
        }
        let topicsLogo = '';
        if (item._type === 'topics') {
          topicsLogo = <img src={logo} alt="roundLogo" className="roundLogo" />;
        }
        const entitySpan = <span className="entity-span">{` (${entity})`}</span>;
        if (!_.isNil(display_name) && !_.isNil(entity)) {
          menu_items.push(
            <div
              className="item"
              onClick={() => this.handleAutosuggestItemClick(item, display_match)}
            >
              {topicsLogo}
              {display_name}
              {entitySpan}
            </div>
          );
          index += 1;
        }
      }

      if (menu_items.length > 0) {
        window.parent.postMessage('autosuggestItemsWillLoad', '*');
        menu_items = menu_items.slice(0, 5);
      } else {
        window.parent.postMessage('noAutosuggestItems', '*');
      }

      autosuggest_dropdown = (
        <div ref="menu" className="augosuggestDropdown" children={menu_items} />
      );
    }
    return (
      <div className="complianceAIIframe">
        <input
          type="text"
          value={this.state.searchTerm}
          onChange={e => this.handleOnChange(e)}
          placeholder="Search Compliance.ai"
        />
        {autosuggest_dropdown}
        <div className="modal-container">
          <Modal
            show={this.state.showModal && !this.state.neverShowModal}
            onHide={this.closeModal}
            container={document.querySelector('.modal-container')}
            enforceFocus={false}
            autoFocus={false}
          >
            <Modal.Header closeButton>Compliance.ai</Modal.Header>
            <IframeDocs docs={this.state.docs} autosuggestItem={this.state.autosuggestItem} />
            <Modal.Footer>Sign up button could possiby go here</Modal.Footer>
          </Modal>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    autocompletes: state.autocompletes
  };
};

const ReduxIframe = connect(mapStateToProps, {
  fetchIframeAutoComplete,
  fetchIframeDocs,
  fetchMention
})(Iframe);
export default ReduxIframe;
