import React from 'react';
import PropTypes from 'prop-types';
import { Navbar, FormControl } from 'react-bootstrap';
import {
  fetchAutoComplete,
  clearAutoComplete,
  fetchSavedSearches,
  postSearchQuery,
  addContributorPoints
} from '../../shared/actions';
import {
  autosuggest_filter_mapping,
  get_autosuggest_term,
  autosuggest_name_map
} from '../../shared/utils/autosuggest';
import { connect } from 'react-redux';
import _ from 'lodash';
import { get_search_view } from '../utils/search';
import { diff } from 'lo-diff';
import classnames from 'classnames';
import escapeStringRegexp from 'escape-string-regexp';
import roundLogo from '../images/Logo-Round-128px.png';

class AutocompleteSearchField extends React.Component {
  constructor(props) {
    super(props);

    // default values at page load
    let search_term = '';
    // if there is something present in the query args for our search sort, set
    // the values appropriately. note: this does get hit on close pdf overlay calls
    const query = this.props.location.query;

    if (query.search_sort === 'relevance') {
      search_term = query.search_query;
    } else if (query.search_sort === 'date') {
      if (this.props.filtered_mention.isReady) {
        const entity = this.props.filtered_mention.mention;
        search_term = get_autosuggest_term(query, entity);
      }
    }

    this.state = {
      highlightedIndex: null,
      search_term,
      savedSearchMatches: [],
      highlightSearch: false,
      stopHighlightBlinking: false
    };

    this.throttledSendAutocompleteToUrl = _.throttle(val => this.sendAutocompleteToUrl(val), 200);
  }
  /**
   * Add the autocompletes to the array after ensuring a name and id.
   */
  componentWillReceiveProps(nextProps) {
    const autoCompleteArray = nextProps.autocompletes.items;

    const { query } = nextProps.location;
    const new_state = {
      autocompletes: autoCompleteArray
    };

    /**
     * Neccesary check for when user transitions away from search clear input and matches
     **/
    const app_view = get_search_view(this.props.current_view.search_params, this.props.location);
    const next_app_view = get_search_view(nextProps.current_view.search_params, nextProps.location);
    const { diff: changed } = diff(app_view, next_app_view);

    if (next_app_view.section !== 'search' && changed.section) {
      new_state.search_term = '';
      new_state.autocompletes = [];
      new_state.savedSearchMatches = [];
    }

    /**
      When user clicks out of autosuggest menu savedSearches are cleared
      it is at this point matches should also be cleared.
      Hacky solution to try to avoid having to rewrite SavedSearches to include matches
      in the redux store.
    **/
    if (_.isEmpty(nextProps.saved_searches)) {
      new_state.savedSearchMatches = [];
    }

    // populate the search-term if we are on a search with a filtered_mention and
    // we are receiving a new filtered_mention
    if (
      query.search_sort === 'date' &&
      !this.props.filtered_mention.isReady &&
      nextProps.filtered_mention.isReady
    ) {
      const entity = nextProps.filtered_mention.mention;
      new_state.search_term = entity.name || entity.short_name;
    }

    // populate the search_term if the url params ar changing and we are on a bag of words search
    if (
      query.search_sort === 'relevance' &&
      this.props.location.search !== nextProps.location.search
    ) {
      new_state.search_term = query.search_query;
    }

    if (nextProps.current_view.highlightSearch !== this.props.current_view.highlightSearch) {
      // function to make the auto suggest will blink 5 times
      const rec = i => {
        if (i <= 0) {
          return;
        }
        this.setState({ highlightSearch: true });
        window.setTimeout(() => {
          this.setState({ highlightSearch: false });
          --i;
          window.setTimeout(() => {
            if (!this.state.stopHighlightBlinking) {
              rec(i);
            } else {
              this.setState({ highlightSearch: false, stopHighlightBlinking: false });
            }
          }, 750);
        }, 750);
      };

      rec(5);
    }
    this.setState(new_state);
  }

  /**
   * The component should only re-render if there are autocompletes
   * or if the search term changes
   */
  shouldComponentUpdate(nextProps, nextState) {
    const should_show =
      this.state.autocompletes !== undefined || this.state.search_term !== nextState.search_terms;

    return should_show;
  }

  sendAutocompleteToUrl(value) {
    this.props.fetchAutoComplete(value);
  }

  handleOnMouseEnter(index) {
    this.setState({
      highlightedIndex: index
    });
  }

  handleOnMouseLeave() {
    this.setState({
      highlightedIndex: null
    });
  }

  handleAutosuggestItemClick(item, display_match) {
    const filter_type = item._type;

    const filter_mapping = autosuggest_filter_mapping[filter_type];

    if (filter_mapping) {
      this.setState(
        {
          highlightedIndex: null,
          search_term: display_match.term
        },
        () => {
          const default_sort = filter_mapping.default_sort;
          const search_query =
            filter_mapping.default_sort === 'relevance' ? display_match.term : null;
          const new_query = {
            search_query,
            autosuggest_filter: filter_type,
            search_sort: default_sort,
            limit: 20,
            summary: null,
            summary_id: 'summary'
          };
          // note: for name-based resolutions, pass the short name or long name that was
          // specified, otherwise use the already-resolved id (which is better)
          //
          // n.b. because short_name is an array, we need to store both the key of the
          // field and the index into the array
          if (filter_mapping.value === 'name') {
            new_query[filter_mapping.filter] = display_match.term;
            let mapper_value = display_match.key;
            if (_.has(display_match, 'index')) {
              mapper_value += '-' + display_match.index;
            }
            new_query.autosuggest_mapper = mapper_value;
          } else {
            new_query[filter_mapping.filter] = item[filter_mapping.value];
          }
          this.context.router.push({
            pathname: '/content',
            query: {
              ...new_query
            }
          });

          this.props.clearAutoComplete();
          this.setState({ savedSearchMatches: [] });

          // postSearchQuery keeps track of search term count
          const itemMap = {
            agencies: 'agency_id',
            acts: 'act_id',
            named_regulations: 'regulation_id',
            citations: 'citation_id',
            concepts: 'concept_id',
            banks: 'bank_id',
            topics: 'topic_id'
          };

          const idName = itemMap[item._type];
          if (item.id && idName) {
            const searchQuery = {
              search_args: { [idName]: item.id }
            };
            this.props.postSearchQuery(searchQuery);
          }
        }
      );
    }
  }

  sendSearchTermToUrl(new_search_term) {
    const search_query = {
      limit: 20,
      autosuggest_filter: null,
      summary_id: null
    };

    // only send non-blank terms
    // this ensures we get back to timeline on a blank query
    if (new_search_term) {
      search_query.search_query = new_search_term;
      search_query.search_sort = 'relevance';

      // postSearchQuery keeps track of search term count
      const searchQuery = {
        search_args: { query: new_search_term }
      };
      this.props.postSearchQuery(searchQuery);
    }

    const new_query = _.omitBy({ ...search_query }, _.isNil);

    //adding these two properties obviates the need to click back button twice
    const final_query = { ...new_query, summary_id: null, summary_page: 'summary' };
    this.context.router.push({
      pathname: '/content',
      query: final_query
    });
  }

  savedSearchMatches(searchTerm) {
    // returns savedSearch match elements
    const savedSearchMatchesArray = [<div className="item item-header">Saved Searches</div>];
    const matches = this.props.saved_searches
      .filter(savedSearch => {
        return savedSearch.name.toLowerCase().startsWith(searchTerm.toLowerCase());
      })
      .map(savedSearch => {
        const el = (
          <div
            className="saved-search-item item"
            onClick={() => {
              this.context.router.push({
                pathname: '/content',
                query: {
                  ...savedSearch.search_args,
                  on_saved_search: savedSearch.id
                }
              });
              this.setState({ savedSearchMatches: [] });
              // postSearchQuery keeps track of search term and stores query
              // in store for if/when user votes on its resutls
              const searchQuery = {
                search_args: { query: savedSearch.name }
              };
              this.props.postSearchQuery(searchQuery);
              this.props.clearAutoComplete();
            }}
          >
            {savedSearch.name}
          </div>
        );
        return el;
      });
    if (matches.length > 0) {
      savedSearchMatchesArray.push(matches);
      this.setState({ savedSearchMatches: savedSearchMatchesArray });
    } else {
      this.setState({ savedSearchMatches: [] });
    }
  }

  handleKeyUp(event, display_matches) {
    const new_state = {};

    // activate an autosuggest transition if something is selected.
    // if nothing selected and hit enter, fetch autosuggest terms – then, if only
    // one term AND exact match, activate autosuggest transistion.
    if (event.keyCode === 13) {
      if (this.state.highlightedIndex === null && event.target.value === '') {
        return;
      } else if (this.state.highlightedIndex === null) {
        const query = event.target.value;
        this.props.fetchAutoComplete(event.target.value).then((res) => {
          const new_display_matches = this.createAutoSuggestDropdown().display_matches;
          if (
            new_display_matches.length === 1 &&
            new_display_matches[0].term.toLowerCase() === query.toLowerCase()
          ) {
            const item = new_display_matches[0].item;
            const display_match = new_display_matches[0];
            // pass through to the click handler method
            this.handleAutosuggestItemClick(item, display_match);
          } else {
            new_state.search_term = query;
            this.props.clearAutoComplete();
            this.setState({ savedSearchMatches: [] });
            this.sendSearchTermToUrl(this.state.search_term);
          }
        });
      } else {
        const item = display_matches[this.state.highlightedIndex].item;
        const display_match = display_matches[this.state.highlightedIndex];
        // pass through to the click handler method
        this.handleAutosuggestItemClick(item, display_match);
      }
    } else if (event.keyCode === 38) {
      // up arrow handling, make sure we null it at the top
      if (this.state.highlightedIndex !== null) {
        if (this.state.highlightedIndex === 0) {
          new_state.highlightedIndex = null;
        } else {
          new_state.highlightedIndex = this.state.highlightedIndex - 1;
        }
      }
    } else if (event.keyCode === 40) {
      // down arrow handling, make sure we stop incrementing at the bottom
      if (this.state.highlightedIndex === null) {
        new_state.highlightedIndex = 0;
      } else if (this.state.highlightedIndex < display_matches.length - 1) {
        new_state.highlightedIndex = this.state.highlightedIndex + 1;
      }
    } else {
      const value = event.target.value;
      if (value.length > 2) {
        this.throttledSendAutocompleteToUrl(value);
      } else {
        this.props.clearAutoComplete();
      }
      new_state.search_term = value;
      new_state.highlightedIndex = null;
    }
    this.setState(new_state);
  }

  handleOnChange(event) {
    event.preventDefault();
    const new_search_term = event.target.value;

    //highlightSearch is true for 5 seconds when user click "Try It" in dashboard profile
    this.setState({ highlightSearch: false });
    if (!this.props.saved_searches_store.isFetching) {
      this.props.fetchSavedSearches();
    }
    // only fire the handler if the search term changed
    // and either the old one or new one is non-empty
    // this prevents the handler from gratuitously changing the URL in IE
    // 😐🔫
    if (this.state.search_term !== new_search_term && (this.state.search_term || new_search_term)) {
      this.setState({ search_term: new_search_term });

      if (new_search_term.length > 0) {
        this.savedSearchMatches(new_search_term);
        this.props.addContributorPoints('firstsearch');
      } else {
        this.setState({ savedSearchMatches: [] });
      }
    }
  }

  createAutoSuggestDropdown() {
    let autosuggest_dropdown = null;

    const display_matches = [];
    if (this.state.autocompletes && this.state.autocompletes.length > 0) {
      const items = this.state.autocompletes;
      const menu_items = [];
      let index = 0;
      const search_term_regex = new RegExp(escapeStringRegexp(this.state.search_term), 'gi');
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
        const current_index = index;
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
        const entitySpan = <span className="entity-span">{` (${entity})`}</span>;

        //FIXME a temporary hack to remove lending concepts.
        //this should be removed when the data team removes lending concepts
        const lendingConcept = display_name === 'Lending' && entity === 'concept';
        if (!_.isNil(display_name) && !_.isNil(entity) && !lendingConcept) {
          menu_items.push(
            <div
              className={this.state.highlightedIndex === current_index ? 'highlightedItem' : 'item'}
              onMouseEnter={() => this.handleOnMouseEnter(current_index)}
              onMouseLeave={() => this.handleOnMouseLeave()}
              onClick={() => this.handleAutosuggestItemClick(item, display_match)}
              ref={'autosuggest-item-' + current_index}
            >
              {item._type === 'topics' ? (
                <img src={roundLogo} alt="roundLogo" className="roundLogo" />
              ) : null}
              {display_name}
              {entitySpan}
            </div>
          );
          index += 1;
        }
      }

      // add saved searches to autosuggest
      menu_items.push(this.state.savedSearchMatches);
      autosuggest_dropdown = <div ref="menu" className="menuStyle" children={menu_items} />;
    } else if (this.state.savedSearchMatches.length > 0) {
      autosuggest_dropdown = (
        <div ref="menu" className="menuStyle" children={this.state.savedSearchMatches} />
      );
    }
    return { autosuggest_dropdown, display_matches };
  }

  render() {
    const autosuggest = this.createAutoSuggestDropdown();
    const autosuggest_dropdown = autosuggest.autosuggest_dropdown;
    const display_matches = autosuggest.display_matches;

    /*
    captures the user direct input or selected autosuggest
    search term upon search
    */
    const searchClasses = classnames({
      'search-input': true,
      highlightSearch: this.state.highlightSearch
    });
    return (
      <Navbar.Form role="search">
        <i className="material-icons search">search</i>
        <div className="search-menu">
          <FormControl
            bsClass={searchClasses}
            type="text"
            placeholder="Search Compliance.ai"
            onKeyUp={event => this.handleKeyUp(event, display_matches)}
            onChange={event => this.handleOnChange(event)}
            onClick={() => this.setState({ stopHighlightBlinking: true })}
            value={this.state.search_term}
          />
          {autosuggest_dropdown}
        </div>
      </Navbar.Form>
    );
  }
}

AutocompleteSearchField.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    autocompletes: state.autocompletes,
    filtered_mention: state.filtered_mention,
    current_view: state.current_view,
    errors: state.errors,
    saved_searches: state.saved_searches.saved_searches,
    saved_searches_store: state.saved_searches
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAutoComplete: params => {
      return dispatch(fetchAutoComplete(params));
    },
    fetchSavedSearches: () => {
      dispatch(fetchSavedSearches());
    },
    clearAutoComplete: () => {
      dispatch(clearAutoComplete());
    },
    postSearchQuery: data => {
      dispatch(postSearchQuery(data));
    },
    addContributorPoints: short_name => {
      dispatch(addContributorPoints(short_name));
    }
  };
};

const ReduxAutocompleteSearchField = connect(mapStateToProps, mapDispatchToProps)(
  AutocompleteSearchField
);

export default ReduxAutocompleteSearchField;
