import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table } from 'react-bootstrap';
import { fetchAllPublications } from '../../shared/actions';
import PublicationModal from './PublicationModal';
import moment from 'moment';

class Publications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      publication_id: null
    };
  }

  componentWillMount() {
    this.props.fetchAllPublications();
  }

  updatePublications = () => {
    this.props.fetchAllPublications({});
  };

  openModal = publication_id => {
    this.setState({ showModal: true, publication_id });
  };

  closeModal = () => {
    this.setState({ showModal: false, publication_id: null });
  };

  render() {
    if (!this.props.all_publications || !this.props.all_publications.isReady) {
      return null;
    }

    const list_items = [];

    const publications = this.props.all_publications.publications;

    publications.forEach(pub => {
      list_items.push(
        <tr key={pub.id} onClick={() => this.openModal(pub.id)}>
          <td>
            {pub.name}
          </td>
          <td>
            {pub.short_name}
          </td>
          <td>
            {pub.jurisdiction}
          </td>
          <td>
            {pub.category}
          </td>
          <td>
            {pub.active_crawls ? 'Active' : 'Inactive'}
          </td>
          <td>
            {pub.active_display ? 'Shown' : 'Hidden'}
          </td>
          <td>
            {pub.days_between_crawls}
          </td>
          <td>
            {moment(pub.last_completed).format('MM/DD/YYYY')}
          </td>
        </tr>
      );
    });

    return (
      <div className="publications-container">
        <h1>Publications</h1>
        <Table striped condensed hover>
          <thead>
            <tr>
              <td>Name</td>
              <td>Short name</td>
              <td>Jurisdiction</td>
              <td>Category</td>
              <td>Crawl status</td>
              <td>Display status</td>
              <td>Days between crawls</td>
              <td>Last completed</td>
            </tr>
          </thead>
          <tbody>
            {list_items}
          </tbody>
        </Table>
        <PublicationModal
          close={this.closeModal}
          showModal={this.state.showModal}
          updatePublications={this.updatePublications}
          publication_id={this.state.publication_id}
        />
      </div>
    );
  }
}

Publications.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllPublications: () => {
      dispatch(fetchAllPublications());
    }
  };
};

const mapStateToProps = state => {
  return {
    all_publications: state.all_publications
  };
};

const ReduxPublications = connect(mapStateToProps, mapDispatchToProps)(Publications);

export default ReduxPublications;
