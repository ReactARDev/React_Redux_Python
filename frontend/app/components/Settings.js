import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Button, ControlLabel, FormGroup } from 'react-bootstrap';
import Select from 'react-select';
import { connect } from 'react-redux';
import {
  clearCurrentUserUpdatedState,
  updateCurrentUser,
  clearErrors,
  addBanner
} from '../../shared/actions';

class Settings extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errorMessage: null,
      saveDisabled: false,
      email_updates: {
        agency_daily: false,
        agency_weekly: true, //default to weekly
        topics_weekly: true //default to weekly
      }
    };
  }

  componentDidMount() {
    this.props.clearCurrentUserUpdatedState();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.viewer && nextProps.viewer.isReady) {
      const user = nextProps.viewer.user;

      this.setState({
        email_updates: {
          agency_daily: user.properties.email_updates.agency_daily,
          agency_weekly: user.properties.email_updates.agency_weekly,
          topics_weekly: user.properties.email_updates.topics_weekly
        }
      });
    }

    if (nextProps.errors && nextProps.errors.settings) {
      const errors = nextProps.errors.settings;

      let globalError = null;

      for (const error of errors) {
        if (error.response) {
          try {
            globalError = JSON.parse(error.response).errors;
          } catch (e) {
            // just use default
          }
        }
      }

      if (_.isNil(globalError)) {
        globalError =
          'An unknown error has occurred. Please reload the page and try again';
      }

      this.setState({
        errorMessage: globalError
      });
    } else if (nextProps.viewer.updated && !this.props.viewer.updated) {
      this.setState({
        errorMessage: null,
        errorMessages: {}
      });
      this.props.addBanner(
        'saved_success',
        true,
        'Your changes have been saved.'
      );
      this.waitAndCloseAlert('saved_success');
    }

    if (!nextProps.viewer.isUpdating) {
      this.setState({
        saveDisabled: false
      });
    }

    const error_banner_in_view =
      nextProps.current_view.banner.type === 'error' &&
      nextProps.current_view.banner.display;

    if (this.state.errorMessage && !error_banner_in_view) {
      const err_msg = (
        <div className="banner-alert-container">
          <h4 className="banner-text">{this.state.errorMessage}</h4>
        </div>
      );
      this.props.addBanner('error', true, err_msg);
    }
  }

  handleEmailUpdatesChange = (type, selectedValue) => {
    const value = selectedValue.value === 'Yes';
    const updated_state = { ...this.state };
    updated_state.email_updates[type] = value;

    this.setState(updated_state);
  };

  waitAndCloseAlert(type) {
    setTimeout(() => this.props.addBanner(type, false), 5000);
  }

  handleSubmit = event => {
    event.preventDefault();

    this.props.clearErrors('settings'); // make sure the store is clean

    this.setState({
      errorMessage: null,
      saveDisabled: true
    });

    const updates = { properties: { email_updates: this.state.email_updates } };

    if (
      this.state.email_updates.agency_daily !==
      this.props.viewer.user.properties.email_updates.agency_daily
    ) {
      updates.properties.email_updates.agency_daily = this.state.email_updates.agency_daily;
    }

    if (
      this.state.email_updates.agency_weekly !==
      this.props.viewer.user.properties.email_updates.agency_weekly
    ) {
      updates.properties.email_updates.agency_weekly = this.state.email_updates.agency_weekly;
    }

    if (
      this.state.email_updates.topics_weekly !==
      this.props.viewer.user.properties.email_updates.topics_weekly
    ) {
      updates.properties.email_updates.topics_weekly = this.state.email_updates.topics_weekly;
    }

    this.props.updateCurrentUser(this.props.viewer.user.email, updates);
  };

  render() {
    if (!this.props.viewer.isReady) {
      return null;
    }

    const settingOptions = [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' }
    ];

    return (
      <div className="settings">
        <div className="settings-container">
          <h1>Settings</h1>
          <div className="panel panel-default">
            <div className="panel-body">
              <form action="" onSubmit={this.handleSubmit}>
                <FormGroup>
                  <ControlLabel>Daily Agency Summary Email</ControlLabel>
                  <Select
                    options={settingOptions}
                    value={this.state.email_updates.agency_daily ? 'Yes' : 'No'}
                    onChange={selectedValue =>
                      this.handleEmailUpdatesChange(
                        'agency_daily',
                        selectedValue
                      )
                    }
                    searchable={false}
                    clearable={false}
                  />
                  <ControlLabel>Weekly Agency Summary Email</ControlLabel>
                  <Select
                    options={settingOptions}
                    value={
                      this.state.email_updates.agency_weekly ? 'Yes' : 'No'
                    }
                    onChange={selectedValue =>
                      this.handleEmailUpdatesChange(
                        'agency_weekly',
                        selectedValue
                      )
                    }
                    searchable={false}
                    clearable={false}
                  />
                  <ControlLabel>Weekly Topics Summary Email</ControlLabel>
                  <Select
                    options={settingOptions}
                    value={
                      this.state.email_updates.topics_weekly ? 'Yes' : 'No'
                    }
                    onChange={selectedValue =>
                      this.handleEmailUpdatesChange(
                        'topics_weekly',
                        selectedValue
                      )
                    }
                    searchable={false}
                    clearable={false}
                  />
                </FormGroup>
                <FormGroup className="btn-container">
                  <Button
                    bsStyle="primary"
                    type="submit"
                    disabled={this.state.saveDisabled}
                  >
                    Save
                  </Button>
                </FormGroup>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// classname to apply to top level container
Settings.className = 'settings';

Settings.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    viewer: state.current_user,
    current_view: state.current_view,
    errors: state.errors
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateCurrentUser: (email, data) => {
      dispatch(updateCurrentUser(email, data));
    },
    clearCurrentUserUpdatedState: () => {
      dispatch(clearCurrentUserUpdatedState());
    },
    clearErrors: component => {
      dispatch(clearErrors(component));
    },
    addBanner: (banner_type, banner_status, content) => {
      dispatch(addBanner(banner_type, banner_status, content));
    }
  };
};

const ReduxSettings = connect(mapStateToProps, mapDispatchToProps)(Settings);

export default ReduxSettings;
