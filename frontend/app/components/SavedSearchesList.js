import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import moment from 'moment';
import _ from 'lodash';
import SavedSearchesItem from './SavedSearchesItem';
import { fetchSavedSearches, deleteSavedSearch, clearErrors } from '../../shared/actions';

class SavedSearchesList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDeleteAlert: false,
      searchToDelete: null,
      sortField: 'updated_at',
      sortedSearches: [],
      sortDirection: 'descending',
      saveSearchModalOpen: false
    };
  }

  componentWillMount() {
    // saved searches are fetched in App.js
    const sortedSearches = this.sortedSearches(this.props.saved_searches);
    this.setState({ sortedSearches });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isReady) {
      const sortedSearches = this.sortedSearches(nextProps.saved_searches);
      this.setState({ sortedSearches });
    }
  }

  getIcons(sortField) {
    if (this.state.sortField !== sortField) {
      return (
        <span className="sort-icons">
          <i className="material-icons header-arrow">keyboard_arrow_down</i>
          <i className="material-icons header-arrow">keyboard_arrow_up</i>
        </span>
      );
    }
    if (this.state.sortDirection === 'descending') {
      return <i className="material-icons header-arrow active">keyboard_arrow_down</i>;
    }
    return <i className="material-icons header-arrow active">keyboard_arrow_up</i>;
  }

  handleDelete = savedSearch => {
    this.setState({
      showDeleteAlert: true,
      searchToDelete: savedSearch
    });
  };

  executeDelete = () => {
    this.props.deleteSavedSearch(this.state.searchToDelete.id).then(() => {
      this.setState({ showDeleteAlert: false });
      this.props.fetchSavedSearches();
    });
  };

  cancelDelete = () => {
    this.setState({ showDeleteAlert: false });
  };

  handleSortClick = (savedSearches, sortField) => {
    if (sortField !== this.state.sortField) {
      if (sortField === 'updated_at') {
        const sortDirection = 'descending';
        const sortedSearches = this.sortedSearches(savedSearches, sortField, sortDirection);
        this.setState({ sortedSearches, sortField, sortDirection });
      } else {
        const sortDirection = 'ascending';
        const sortedSearches = this.sortedSearches(savedSearches, sortField, sortDirection);
        this.setState({ sortedSearches, sortField, sortDirection });
      }
    } else if (this.state.sortDirection === 'descending') {
      const sortDirection = 'ascending';
      const sortedSearches = this.sortedSearches(savedSearches, sortField, sortDirection);
      this.setState({ sortedSearches, sortField, sortDirection });
    } else {
      const sortDirection = 'descending';
      const sortedSearches = this.sortedSearches(savedSearches, sortField, sortDirection);
      this.setState({ sortedSearches, sortField, sortDirection });
    }
  };

  sortedSearches(savedSearches = [], sortField = 'updated_at', sortDirection = 'descending') {
    savedSearches = savedSearches ? [...savedSearches] : [];
    if (sortField === 'updated_at') {
      return savedSearches.sort((a, b) => {
        if (sortDirection === 'descending') {
          return moment(new Date(b.updated_at)).diff(moment(new Date(a.updated_at)));
        }
        return moment(new Date(a.updated_at)).diff(moment(new Date(b.updated_at)));
      });
    }
    if (sortField === 'name' || sortField === 'searchCriteria') {
      return savedSearches.sort((a, b) => {
        if (sortDirection === 'descending') {
          if (a[sortField].toUpperCase() < b[sortField].toUpperCase()) {
            return 1;
          }
          return -1;
        }
        if (b[sortField].toUpperCase() < a[sortField].toUpperCase()) {
          return 1;
        }
        return -1;
      });
    }
    return savedSearches;
  }

  searchCriteria(savedSearch) {
    // takes in and returns a formatted string of search criteria
    const search = savedSearch.search_args;

    const removeLast2 = string => string.slice(0, string.length - 2);
    const addSemi = string => `${string}; `;

    let criteriaString = '';
    if (!_.isNil(savedSearch.entity)) {
      if (Array.isArray(savedSearch.entity)) {
        const etn_ename = savedSearch.entity.find(ent => { return ent.name || ent.shor_name; });
        const name_criter = etn_ename.name || etn_ename.short_name;
        criteriaString += `${name_criter}; `;
      } else {
        // used when user clicked on autosuggest item
        const name_criter = savedSearch.entity.name || savedSearch.entity.short_name;
        criteriaString += `${name_criter}; `;
      }
    } else {
      // used when user searches for bag of words
      if (search.search_query) {
        criteriaString += `${search.search_query}; `;
      }
    }

    if (search.agency) {
      let agencyNames = 'Sources: ';
      search.agency = _.flatten([search.agency]);
      search.agency.forEach(agencyId => {
        const agencyObj = _.find(this.props.agencies.items, agency => {
          return agency.id === Number(agencyId);
        });
        if (agencyObj) {
          const agencyName = agencyObj.short_name || agencyObj.name;
          agencyNames += `${agencyName}, `;
        }
      });
      criteriaString += addSemi(removeLast2(agencyNames));
    }

    if (search.category) {
      search.category = _.flatten([search.category]);
      let s = 'Document type: ';
      for (const el of search.category) {
        s += `${el}, `;
      }
      s = removeLast2(s);
      criteriaString += addSemi(s);
    }

    if (search.published_from || search.published_to) {
      let s = 'Published: ';
      if (search.published_from) {
        s += `${moment(new Date(search.published_from)).format('MM/DD/YYYY')}`;
      } else {
        s += '...';
      }
      if (search.published_to) {
        s += ` - ${moment(new Date(search.published_to)).format('MM/DD/YYYY')}`;
      } else {
        s += ' - ...';
      }
      criteriaString += addSemi(s);
    }

    if (search.key_date_from || search.key_date_to) {
      let s = 'Key dates: ';
      if (search.key_date_from) {
        s += `${moment(new Date(search.key_date_from)).format('MM/DD/YYYY')}`;
      } else {
        s += '...';
      }
      if (search.key_date_to) {
        s += ` - ${moment(new Date(search.key_date_to)).format('MM/DD/YYYY')}`;
      } else {
        s += ' - ...';
      }
      criteriaString += addSemi(s);
    }

    if (search.read === true) {
      criteriaString += 'read';
    }

    if (search.read === false) {
      criteriaString += 'unread';
    }
    criteriaString = removeLast2(criteriaString);
    return criteriaString;
  }

  render() {
    const alertModal = this.state.showDeleteAlert ? (
      <Modal show={this.state.showDeleteAlert} onHide={this.props.close} backdrop>
        <Modal.Body>
          <h1>Are you sure you want to delete Saved Search:</h1>
          <h1>{`${this.state.searchToDelete.name}?`}</h1>
          <div className="delete-saved-search-buttons">
            <Button className="btn btn-primary delete-button" onClick={this.executeDelete}>
              Delete
            </Button>
            <Button className="btn-sm delete-button" onClick={this.cancelDelete}>
              Cancel
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    ) : null;

    return (
      <div className="saved-search-list">
        {alertModal}
        <table className="table table-hover">
          <thead>
            <tr>
              <th onClick={() => this.handleSortClick(this.props.saved_searches, 'name')}>
                Name
                {this.getIcons('name')}
              </th>
              <th onClick={() => this.handleSortClick(this.props.saved_searches, 'searchCriteria')}>
                Search Criteria
                {this.getIcons('searchCriteria')}
              </th>
              <th onClick={() => this.handleSortClick(this.props.saved_searches, 'updated_at')}>
                Date Updated
                {this.getIcons('updated_at')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.state.sortedSearches.map((savedSearch, i) => {
              savedSearch.searchCriteria = this.searchCriteria(savedSearch);
              return (
                <SavedSearchesItem
                  savedSearch={savedSearch}
                  key={i}
                  handleDelete={this.handleDelete}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

const mapStateToProps = ({ saved_searches, agencies, filtered_mention, errors }) => {
  return {
    saved_searches: saved_searches.saved_searches,
    isReady: saved_searches.isReady,
    agencies,
    filtered_mention,
    errors
  };
};

export default connect(mapStateToProps, {
  deleteSavedSearch,
  fetchSavedSearches,
  clearErrors
})(SavedSearchesList);
