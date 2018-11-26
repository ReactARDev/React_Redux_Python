import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormGroup, ControlLabel, Radio, FormControl } from 'react-bootstrap';
import _ from 'lodash';
import DatePicker from 'react-datepicker';
import { updateUserSubscription } from '../../shared/actions';
import moment from 'moment';

class SubscriptionModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: null,
      extend_date: null,
      expiration_date: null,
      convert_to: null,
      saveDisabled: false,
      format_str: 'YYYY-MM-DD',
      notes: '',
      payment_type: null,
      existed_plan_type: '',
      current_start_date: '',
      current_end_date: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    const all_subscriptions = this.props.all_subscriptions.subscriptions;
    let start_date_display;
    let expiration_date_display = 'n/a: recurring';

    if (nextProps.id) {
      const subscription = _.find(all_subscriptions, { subscription_id: nextProps.id });

      start_date_display = moment(subscription.start_date).format('MM-DD-YYYY');
      if (subscription.expiration_date) {
        expiration_date_display = moment(subscription.expiration_date).format('MM-DD-YYYY');
      }

      const new_state = {
        id: subscription.subscription_id,
        email: subscription.email,
        extend_date: null,
        expiration_date: null,
        notes: '',
        convert_to: null,
        payment_type: null,
        existed_plan_type: subscription.plan_name,
        current_start_date: start_date_display,
        current_end_date: expiration_date_display
      };
      this.setState(new_state);
    }
  }

  getParams = () => {
    const params = {};
    if (this.state.extend_date) {
      params.expiration_date = this.state.extend_date.format(this.state.format_str);
    }
    if (this.state.expiration_date) {
      params.expiration_date = this.state.expiration_date.format(this.state.format_str);
    }
    if (this.state.notes) {
      params.notes = this.state.notes;
    }
    if (this.state.convert_to) {
      params.plan_id = parseInt(this.state.convert_to, 10);
    }
    if (this.state.payment_type) {
      params.payment_type = this.state.payment_type;
    }
    return params;
  };

  closeModal = () => {
    this.props.close();
  };

  handleExtDateChange = date => {
    this.setState({
      extend_date: date,
      expiration_date: null,
      notes: '',
      convert_to: null,
      payment_type: null
    });
  };

  handleExpDateChange = date => {
    this.setState({
      expiration_date: date,
      extend_date: null,
      convert_to: null,
      payment_type: null
    });
  };

  // empty other fields, since we allow to update only one field for subscription
  emptyFields = (changed_field, state) => {
    if (changed_field === 'notes') {
      state.extend_date = null;
      state.convert_to = null;
      state.payment_type = null;
    }
    if (changed_field === 'convert_to') {
      state.notes = '';
      state.payment_type = null;
      state.expiration_date = null;
      state.extend_date = null;
    }
    if (changed_field === 'payment_type') {
      state.notes = '';
      state.convert_to = null;
      state.expiration_date = null;
      state.extend_date = null;
    }
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    this.emptyFields(changedfieldname, new_state);
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  handleSubmit = event => {
    event.preventDefault();
    this.props.close();
    this.props.updateUserSubscription(this.state.id, this.getParams()).then(() => {
      this.props.updateTable();
    });
  };

  render() {
    const plans_to_display = [];
    if (this.props.all_plans && this.props.all_plans.items) {
      this.props.all_plans.items.forEach(plan => {
        plans_to_display.push(
          <Radio
            key={plan.id}
            name="convert_to"
            value={plan.id}
            checked={this.state.convert_to === plan.id.toString()}
            onChange={e => this.handleFieldChange('convert_to', e)}
          >
            {plan.name}
          </Radio>
        );
      });
    }

    return (
      <Modal show={this.props.showModal} onHide={this.closeModal}>
        <Modal.Header>
          <Modal.Title>
            <p>
              {'Manage Subscription for '}
              {this.state.email}
            </p>
            <div className="subscription-header">
              <p>Plan Name: {this.state.existed_plan_type}</p>
              <p>
                {'Start Date: '}
                {this.state.current_start_date}
              </p>
              <p>
                {'End Date: '}
                {this.state.current_end_date}
              </p>
            </div>
          </Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup>
              <ControlLabel>Extend to</ControlLabel>
              <div className="subscription-date">
                <DatePicker
                  selected={this.state.extend_date}
                  onChange={this.handleExtDateChange}
                  isClearable
                />
              </div>
              <ControlLabel>Convert to</ControlLabel>
              <div>{plans_to_display}</div>
              <ControlLabel>Change payment to:</ControlLabel>
              <div>
                <Radio
                  name="payment_type"
                  value="stripe"
                  checked={this.state.payment_type === 'stripe'}
                  onChange={e => this.handleFieldChange('payment_type', e)}
                >
                  {'stripe'}
                </Radio>
                <Radio
                  name="payment_type"
                  value="invoice"
                  checked={this.state.payment_type === 'invoice'}
                  onChange={e => this.handleFieldChange('payment_type', e)}
                >
                  {'invoice'}
                </Radio>
              </div>

              <ControlLabel>Expire on</ControlLabel>
              <div className="subscription-date">
                <DatePicker
                  selected={this.state.expiration_date}
                  onChange={this.handleExpDateChange}
                  isClearable
                />
              </div>
              <ControlLabel>{'Enter text - reason why expired'}</ControlLabel>
              <FormControl
                componentClass="textarea"
                value={this.state.notes}
                onChange={e => this.handleFieldChange('notes', e)}
              />
            </FormGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.closeModal}>Close</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              Update
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

SubscriptionModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    updateUserSubscription: (subscription_id, data) => {
      return dispatch(updateUserSubscription(subscription_id, data));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_subscriptions: state.all_subscriptions,
    all_plans: state.all_plans
  };
};

const ReduxSubscriptionModal = connect(mapStateToProps, mapDispatchToProps)(SubscriptionModal);

export default ReduxSubscriptionModal;
