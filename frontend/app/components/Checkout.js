import React from 'react';
import { connect } from 'react-redux';
import { Button, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import { subscribe, fetchSubscriptions, requestInvoice, closeOverlay } from '../../shared/actions';
import logo from '../images/Logo-Round-128px.png';
import fullLogo from '../images/Logo-Full.svg';
import team from '../images/team.svg';
import discount from '../images/TwentyPercentOffDiscount.svg';
import { stripePublicKey } from '../../shared/config';
import classnames from 'classnames';

/* eslint-disable new-cap*/
Stripe(stripePublicKey);
class Checkout extends React.Component {
  constructor(props) {
    super(props);
    this.subscription = null;
    this.state = {
      onView: 'selectPlan',
      subscriptionType: null,
      invoiceRequestSuccessAlert: false,
      postingSubscription: false
    };
  }
  componentDidMount() {
    if (this.props.current_view.overlay) {
      this.props.closeOverlay();
    }

    const that = this;
    this.handler = StripeCheckout.configure({
      key: stripePublicKey,
      image: logo,
      locale: 'auto',
      token(stripe_response) {
        //stripe callback
        that.setState({ postingSubscription: true });
        that.props
          .subscribe({
            stripe_response,
            plan: that.subscription,
            payment_type: 'stripe'
          })
          .then(res => {
            that.props.fetchSubscriptions();
            that.setState({ postingSubscription: false });
            that.context.router.push({
              pathname: '/account',
              state: { subscriptionCreated: true }
            });
          });
        // You can access the token ID with `token.id`.
        // Get the token ID to your server-side code for use.
      }
    });

    // Close Checkout on page navigation:
    window.addEventListener('popstate', () => {
      this.handler.close();
    });
  }
  beginCheckout = subscriptionType => {
    this.setState({ onView: 'checkoutType', subscriptionType });
  };

  stripeCheckout = () => {
    // Open Checkout with further options:
    const subscriptions = {
      pro_monthly_oct_2017: ['Monthly', 24900],
      pro_annual_new_oct_2017: ['Annual', 238800]
    };
    this.handler.open({
      name: 'Compliance.ai',
      description: `${subscriptions[this.state.subscriptionType][0]} Subscription`,
      amount: subscriptions[this.state.subscriptionType][1],
      zipCode: true
    });
    this.subscription = this.state.subscriptionType;
  };

  invoiceCheckout = () => {
    this.props.requestInvoice({ plan: this.state.subscriptionType }).then(res => {
      this.setState({ invoiceRequestSuccessAlert: true });
    });
  };

  render() {
    let subscriptionCategory = 'free_trial';
    // this assumes there is zero or one latest subscription
    const latestSubscription = this.props.subscriptions.subscriptions.filter(sub => sub.latest);

    if (latestSubscription.length > 0) {
      subscriptionCategory = latestSubscription[0].category;
    }

    const questions = (
      <div className="questions">
        If you have questions about subscriptions, please contact{' '}
        <a href="mailto:billing@compliance.ai">billing@compliance.ai</a>
        .
      </div>
    );

    const selectPlan = (
      <div>
        {(subscriptionCategory === 'free_trial') === 'contributor' ? (
          <div>
            <h3>Professional Edition</h3>
            <h5>For individuals looking to simplify their regulatory change management tools</h5>
          </div>
        ) : null}
        <div className="subscriptionCards">
          {subscriptionCategory === 'free_trial' || subscriptionCategory === 'contributor' ? (
            <div className="outter-subscription-card">
              <div className="inner-subscription-card">
                <h1 className="monthly">$249/month</h1>
                {/*<div className="price">$99/mo</div>*/}
                <h5>(billed monthly)</h5>
                <Button onClick={() => this.beginCheckout('pro_monthly_oct_2017')}>Buy Now</Button>
              </div>
            </div>
          ) : null}

          {subscriptionCategory === 'free_trial' || subscriptionCategory === 'contributor' ? (
            <div className="outter-subscription-card">
              <div className="inner-subscription-card">
                <img className="discount" alt="dicount_logo" src={discount} />
                <h1>$199/month</h1>
                {/*<div className="price">$89/month</div>*/}
                <h5>(billed annually)</h5>
                <Button onClick={() => this.beginCheckout('pro_annual_new_oct_2017')}>
                  Buy Now
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        {subscriptionCategory === 'free_trial' || subscriptionCategory === 'contributor'
          ? questions
          : null}

        <h3>Team Edition</h3>
        <h5>For groups with change management + collaboration needs</h5>
        <div className="teamCard">
          <div className="outter-team-card">
            <div className="inner-team-card">
              <img src={team} alt="dicount_logo" />
              <h1 className="comingSoon">Coming soon!</h1>
            </div>
          </div>
        </div>
      </div>
    );

    const checkoutType = (
      <div>
        <div className="subscriptionCards">
          <div className="outter-subscription-card">
            <div className="inner-subscription-card">
              <h1>Checkout With Stripe</h1>
              <h5 className="checkoutText stripeCheckout">Pay now with Stripe secure checkout.</h5>
              <Button onClick={() => this.stripeCheckout()}>Checkout Now</Button>
            </div>
          </div>

          <div className="outter-subscription-card">
            <div className="inner-subscription-card">
              <h1>Request an Invoice</h1>
              <h5 className="checkoutText">
                Submit your company billing information to receive an invoice via email.
              </h5>
              <Button onClick={() => this.invoiceCheckout()}>Request an Invoice</Button>
            </div>
          </div>
        </div>
        {questions}
      </div>
    );

    const invoiceRequestedAlert = this.state.invoiceRequestSuccessAlert ? (
      <Alert
        bsStyle="success"
        className="subscription-success"
        onDismiss={() => this.setState({ invoiceRequestSuccessAlert: false })}
      >
        Your invoice request has been received. A Compliance.ai team member will respond to you by
        email soon!
      </Alert>
    ) : null;

    const checkoutClasses = classnames({
      checkout: true,
      'loading-overlay-light': true,
      'loading-active': this.props.subscriptions.isFetching || this.state.postingSubscription
    });
    return (
      <div className={checkoutClasses}>
        <div className="logo">
          <img src={fullLogo} alt="dicount_logo" />
        </div>

        <div className="breadcrumbs">
          <span
            onClick={() => this.setState({ onView: 'selectPlan' })}
            className={`view ${this.state.onView === 'selectPlan' ? 'highlight' : 'clickable'}`}
          >
            Order
          </span>
          <span className="next"> &gt; </span>
          <span className={`view ${this.state.onView === 'checkoutType' ? 'highlight' : null}`}>
            Checkout
          </span>
        </div>

        {invoiceRequestedAlert}
        {this.state.onView === 'selectPlan' ? selectPlan : checkoutType}
      </div>
    );
  }
}

Checkout.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = state => {
  return {
    subscriptions: state.subscriptions,
    current_user: state.current_user,
    current_view: state.current_view
  };
};
export default connect(mapStateToProps, {
  subscribe,
  fetchSubscriptions,
  requestInvoice,
  closeOverlay
})(Checkout);
