import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';
import { fetchSavedSearches, editSavedSearch, saveSearch, clearErrors } from '../../shared/actions';
import { Alert } from 'react-bootstrap';
import { examine_error } from '../utils/errors';
import SaveSearchModal from './SaveSearchModal';

class SavedSearchesItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      saveSearchModalOpen: false,
      name: this.props.savedSearch.name,
      editMode: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ name: nextProps.savedSearch.name });
  }

  handleDeleteSavedSearch(e, savedSearch) {
    e.stopPropagation(); // this prevents the onclick handler for the
    // parent element from being invoked.
    this.props.clearErrors('saved_searches');
    this.props.handleDelete(savedSearch);
  }

  handleCopy = (e, savedSearch) => {
    e.stopPropagation();
    this.props.clearErrors('post_saved_search');
    this.setState({ saveSearchModalOpen: true });
  };

  createSavedSearchCopy = searchName => {
    this.props.clearErrors('post_saved_search');
    const savedSearchCopy = { name: searchName, search_args: this.props.savedSearch.search_args };

    if (savedSearchCopy.name.length > 0) {
      this.props.saveSearch(savedSearchCopy).then(() => {
        this.props.fetchSavedSearches();
        this.setState({
          saveSearchModalOpen: false
        });
      });
    }
  };

  handleEdit(e) {
    e.stopPropagation(); // this prevents the onclick handler for the
    // parent element from being invoked.
    this.props.clearErrors('saved_searches');
    this.setState({
      editMode: true
    });
  }

  handleSearchClick(savedSearch) {
    if (this.state.editMode === false) {
      this.context.router.push({
        pathname: '/content',
        query: {
          ...savedSearch.search_args,
          on_saved_search: savedSearch.id
        }
      });
    }
  }

  handleSaveEdit(e, savedSearch, data) {
    e.stopPropagation(); // this prevents the onclick handler for the
    // parent element from being invoked.
    if (data.name.length !== 0) {
      this.props.editSavedSearch(savedSearch.id, data).then(() => {
        this.setState({ editMode: false });
        this.props.fetchSavedSearches();
      });
    }
  }

  handleCancelEdit(e) {
    e.stopPropagation(); // this prevents the onclick handler for the
    // parent element from being invoked.
    this.setState({
      editMode: false,
      name: this.props.savedSearch.name
    });
    this.props.clearErrors('saved_searches');
  }

  handleChange(e) {
    this.setState({ name: e.target.value });
  }

  handleKeyUp(e) {
    e.preventDefault();

    if (e.keyCode === 13) {
      this.handleSaveEdit(e, this.props.savedSearch, {
        name: this.state.name.trim()
      });
    }
  }
  close_modal = () => {
    this.setState({ saveSearchModalOpen: false });
  };

  render() {
    const renderErrors = () => {
      const errors = this.props.errors || {};
      if (
        (errors.saved_searches && errors.saved_searches.length > 0) ||
        (errors.post_saved_search && errors.post_saved_search.length > 0)
      ) {
        // get the id of the search with the error and display that error
        const id = url => Number(url.match(/.*\/(.*?)$/)[1]);
        const has = e => {
          const url = e.responseURL;
          const searchId = id(url);
          return searchId === this.props.savedSearch.id;
        };

        let e;
        if (errors.saved_searches) {
          e = _.find(errors.saved_searches, has);
        } else {
          e = errors.post_saved_search[errors.post_saved_search.length - 1];
        }

        if (!_.isNil(e)) {
          return (
            <Alert
              bsStyle="danger"
              className="left-panel-error-container"
              onClick={() => this.props.clearErrors('saved_searches')}
            >
              {examine_error(e, 'saved_searches').text}
            </Alert>
          );
        }
      }
      return null;
    };

    const searchName = () => {
      if (this.state.editMode) {
        return (
          <td>
            {renderErrors()}
            <input
              value={this.state.name}
              onChange={e => this.handleChange(e)}
              onKeyUp={e => this.handleKeyUp(e)}
            />
            <span className="icons">
              <i
                className="material-icons clickable edit-icons check"
                onClick={e => {
                  this.handleSaveEdit(e, this.props.savedSearch, {
                    name: this.state.name.trim()
                  });
                }}
              >
                done
              </i>

              <i
                onClick={e => this.handleCancelEdit(e)}
                className="material-icons clickable edit-icons"
              >
                clear
              </i>
            </span>
          </td>
        );
      }

      return (
        <td className="search-name">
          {this.state.name}
          <span onClick={e => this.handleEdit(e)} className="clickable edit">
            Edit
          </span>
        </td>
      );
    };

    return (
      <tr onClick={() => this.handleSearchClick(this.props.savedSearch)}>
        {searchName()}
        <td>
          {this.props.savedSearch.searchCriteria}
        </td>
        <td>
          {moment(new Date(this.props.savedSearch.updated_at)).format('MM/DD/YYYY')}
        </td>
        <td className="table-icons">
          <i
            className="material-icons clickable saved-search-action"
            onClick={e => this.handleCopy(e, this.props.savedSearch)}
            title="copy saved search"
          >
            content_copy
          </i>
          <i
            className="material-icons clickable saved-search-action"
            onClick={e => this.handleDeleteSavedSearch(e, this.props.savedSearch)}
            title="delete saved search"
          >
            cancel
          </i>
          <SaveSearchModal
            createBtnTitle="Create Copy"
            modalTitle="Copy Saved Search"
            saveSearchModalOpen={this.state.saveSearchModalOpen}
            renderErrors={renderErrors}
            searchName={'Copy of ' + this.props.savedSearch.name}
            createSavedSearch={this.createSavedSearchCopy}
            close_modal={this.close_modal}
          />
        </td>
      </tr>
    );
  }
}

SavedSearchesItem.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ errors }) => {
  return {
    errors
  };
};

const ReduxSavedSearchesItem = connect(mapStateToProps, {
  fetchSavedSearches,
  editSavedSearch,
  saveSearch,
  clearErrors
})(SavedSearchesItem);

export default ReduxSavedSearchesItem;
