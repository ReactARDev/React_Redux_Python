import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table } from 'react-bootstrap';
import SubscriptionModal from './SubscriptionModal';
import { fetchAllSubscriptions, fetchAllPlans } from '../../shared/actions';
import moment from 'moment';

class Subscriptions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  componentWillMount() {
    this.props.fetchAllSubscriptions();
    this.props.fetchAllPlans();
  }

  openModal = (id) => {
    this.setState({ showModal: true, id });
  };

  closeModal = () => {
    this.setState({ showModal: false });
  };

  updateTable = () => {
    this.props.fetchAllSubscriptions();
  };


  render() {
    if (
      !this.props.all_subscriptions ||
      !this.props.all_subscriptions.isReady
    ) {
      return null;
    }

    const list_items = [];

    const subscriptions = this.props.all_subscriptions.subscriptions;

    let user_type_display;
    let star_date_display;
    let expiration_date_display;

    subscriptions.forEach(entity => {
      user_type_display = entity.roles ? entity.roles.join() : "";
      star_date_display = moment(entity.start_date).format('MM-DD-YYYY');
      if (entity.expiration_date) {
        expiration_date_display = moment(entity.expiration_date).format('MM-DD-YYYY');
      } else {
        expiration_date_display = "n/a: recurring";
      }
      list_items.push(
        <tr key={entity.user_id} onClick={() => this.openModal(entity.subscription_id)}>
          <td>
            {entity.first_name + " " + entity.last_name}
          </td>
          <td>
            {entity.email}
          </td>
          <td>
            {user_type_display}
          </td>
          <td>
            {entity.status}
          </td>
          <td>
            {entity.status_reason}
          </td>
          <td>
            {entity.plan_name}
          </td>
          <td>
            {star_date_display}
          </td>
          <td>
            {expiration_date_display}
          </td>
          <td>
            {entity.payment_type}
          </td>
          <td>
            {entity.notes}
          </td>
        </tr>
      );
    });

    return (
      <div className="subscriptions-container">
        <h1>Subscriptions</h1>
        <Table striped condensed hover>
          <thead>
            <tr>
              <th>User Name</th>
              <th>User Email</th>
              <th>User Type</th>
              <th>Status</th>
              <th>Status Reason</th>
              <th>Plan Name</th>
              <th>{"Start Date"}</th>
              <th>{"Subscription End Date"}</th>
              <th>Payment Type</th>
              <th>Suspend Notes</th>
            </tr>
          </thead>
          <tbody>
            {list_items}
          </tbody>
        </Table>
        <SubscriptionModal
          close={this.closeModal}
          showModal={this.state.showModal}
          id={this.state.id}
          updateTable={this.updateTable}
        />
      </div>
    );
  }
}

Subscriptions.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllSubscriptions: () => {
      dispatch(fetchAllSubscriptions());
    },
    fetchAllPlans: () => {
      dispatch(fetchAllPlans());
    }
  };
};

const mapStateToProps = state => {
  return {
    all_subscriptions: state.all_subscriptions
  };
};

const ReduxSubscriptions = connect(mapStateToProps, mapDispatchToProps)(Subscriptions);

export default ReduxSubscriptions;
