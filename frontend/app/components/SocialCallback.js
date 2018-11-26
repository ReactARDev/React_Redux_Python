import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import { Checkbox, Alert } from 'react-bootstrap';
import auth from '../../shared/utils/auth.js';
import { safe_analytics } from '../../shared/utils/analytics.js';
import { skipOnboarding } from '../../shared/actions';

class SocialCallback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      termsAgreed: false,
      error: false,
      accessToken: null,
      page: null,
      linkedinToken: null
    };
  }
  componentWillMount() {
    if (this.props.location.state) {
      this.setState({
        accessToken: this.props.location.state.accessToken,
        page: this.props.location.state.page,
        linkedinToken: this.props.location.state.linkedinToken
      });
    }
  }

  handleSocialVerification = () => {
    safe_analytics('default', 'Social Callback', 'Button click', 'Start free trial');
    const is_contributor = this.props.location.query.user_role === 'contributor';
    const marketing_campaign_token = this.props.location.query.token;
    if (!this.state.accessToken && !this.state.linkedinToken) {
      this.context.router.push('/activate');
    } else if (!this.state.termsAgreed) {
      this.setState({ error: true });
    } else if (this.props.location.query.loginType === 'google') {
      if (marketing_campaign_token) {
        this.state.token = marketing_campaign_token;
      }
      auth.responseGoogle({ accessToken: this.state.accessToken }, this, this.props);
    } else if (this.props.location.query.loginType === 'linkedin') {
      auth.initializeLinkedin(
        this,
        this.state.accessToken,
        'socialcallback',
        this.props,
        this.state.termsAgreed,
        this.state.linkedinToken,
        is_contributor,
        marketing_campaign_token
      );
    }
  };
  handleTermChange(e) {
    this.setState({
      termsAgreed: e.target.checked
    });
    if (e.target.checked) {
      this.setState({ error: false });
    }

    safe_analytics('default', 'Social Callback', 'Check box click', 'Agree to ToS');
  }

  render() {
    return (
      <div className="socialCallbackContainer">
        {this.state.error ? (
          <Alert bsStyle="danger">Please agree to the Terms of Service.</Alert>
        ) : null}
        <div className="terms-link-container">
          <p className="text-center">
            <Checkbox
              inline
              checked={this.state.termsAgreed}
              onChange={e => this.handleTermChange(e)}
            >
              <span>
                I agree to the Compliance.ai
                <Link to="terms" target="_blank">
                  Terms of Service
                </Link>
              </span>
            </Checkbox>
          </p>
        </div>
        <div className="btn-row">
          <button onClick={this.handleSocialVerification} className="sign-up-btn">
            Start Your 30-Day Free Trial
          </button>
        </div>
      </div>
    );
  }
}

SocialCallback.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {};
};

const ReduxSocialCallback = connect(mapStateToProps, {
  skipOnboarding
})(SocialCallback);

export default ReduxSocialCallback;
