import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import classnames from 'classnames';
import {
  changeSubmenuTarget,
  changeDocumentView,
  showEmptyTimeline,
  hideEmptyTimeline
} from '../../shared/actions';
import { explicit_filter_function } from '../utils/filter';
import { latestSubscription } from '../../shared/utils/subscriptions';

class LeftNavSubMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillReceiveProps(nextProps) {
    //hide state_code submenu here as doing so elsewhere causes DOM manipulation bug
    if (
      !_.isNil(this.props.current_view.submenu_target) &&
      nextProps.current_view.submenu_target === 'state_code'
    ) {
      this.props.changeSubmenuTarget(null);
    }
  }

  displayStateCode(state) {
    explicit_filter_function(
      { selectedStateCode: state },
      this.props.location,
      this.context.router,
      {},
      this.props
    );
  }

  hideSubMenu(setting) {
    this.props._setHighlightState('user_settings');
    if (!_.isNil(this.props.current_view.submenu_target)) {
      this.props.changeSubmenuTarget(null);
    }

    this.context.router.push({
      pathname: '/' + setting
    });
  }

  render() {
    if (_.isNil(this.props.current_view.submenu_target)) {
      return null;
    }

    let subMenu = null;

    if (this.props.current_view.submenu_target === 'user_settings') {
      /*
        User Settings Left Nav Sub Menu
      */
      subMenu = (
        <div className="left-panel-account-settings">
          <a className="left-panel-account-setting" onClick={() => this.hideSubMenu('account')}>
            Account
            {this.props.subscriptions.isReady &&
            latestSubscription(this.props.subscriptions.subscriptions).within10dayofExpiration
              ? <span className="notif-bubble" />
              : null}
          </a>
          <a className="left-panel-account-setting" onClick={() => this.hideSubMenu('state_code')}>
            State Codes
          </a>
          <a className="left-panel-account-setting" onClick={() => this.hideSubMenu('settings')}>
            Settings
          </a>
          <a className="left-panel-account-setting" onClick={() => this.hideSubMenu('support')}>
            Support
          </a>
          <a className="left-panel-account-setting" onClick={() => this.hideSubMenu('legal')}>
            Legal
          </a>
          <a className="left-panel-account-setting" onClick={() => this.hideSubMenu('logout')}>
            Log Out
          </a>
        </div>
      );
    }

    const submenuContainerClasses = {
      'left-nav-submenu-container': true,
      user_settings: this.props.current_view.submenu_target === 'user_settings',
      state_code: this.props.current_view.submenu_target === 'state_code'
    };

    return (
      <div
        className={classnames(submenuContainerClasses)}
        style={{ top: this.props.top }}
        onMouseLeave={() => this.props.changeSubmenuTarget(null)}
      >
        {subMenu}
      </div>
    );
  }
}

LeftNavSubMenu.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view,
    agencies: state.agencies,
    subscriptions: state.subscriptions
  };
};

export default connect(mapStateToProps, {
  changeSubmenuTarget,
  changeDocumentView,
  showEmptyTimeline,
  hideEmptyTimeline
})(LeftNavSubMenu);
