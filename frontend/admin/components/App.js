import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Link } from 'react-router';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap';
import { fetchCurrentUser, fetchDefaultSources, fetchTopicsStats } from '../../shared/actions';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { subscribeToNotifications } from '../../shared/utils/socket';
import auth from '../../shared/utils/auth';

let subscribedToNotifications = false;
class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetchCurrentUser();
    this.props.fetchDefaultSources();
  }

  componentWillReceiveProps(nextProps) {
    // check for auth errors
    // for now, just force the user to logout
    if (nextProps.errors && nextProps.errors.auth && nextProps.errors.auth.length > 0) {
      this.context.router.replace({
        pathname: 'logout'
      });
    }

    if (this.props.viewer.isFetching && !nextProps.viewer.isFetching) {
      const user_id = !_.isNil(_.get(nextProps.viewer, 'user.id'))
        ? _.get(nextProps.viewer, 'user.id').toString()
        : '';
      const is_internal = !_.isNil(nextProps.viewer.user.is_internal_user)
        ? nextProps.viewer.user.is_internal_user.toString()
        : '';
      const roles = !_.isNil(nextProps.viewer.user.roles)
        ? nextProps.viewer.user.roles.toString()
        : '';

      this.user = nextProps.viewer.user;
      if (typeof mixpanel !== 'undefined') {
        mixpanel.people.set({
          $email: this.user.email,
          user_id,
          is_internal,
          roles
        });
        mixpanel.identify(this.user.email);
      }
      if (auth.loggedIn() && !subscribedToNotifications) {
        subscribeToNotifications(nextProps, true);
        subscribedToNotifications = true;
      }
    }
  }

  render() {
    if (!this.props.viewer || this.props.viewer.isFetching) {
      return null;
    }

    const navbar = (
      <Navbar inverse staticTop>
        <Navbar.Header>
          <div className="logo">
            <Link to={'/dashboard'} />
          </div>
        </Navbar.Header>
        <Nav>
          <LinkContainer to={'/dashboard'}>
            <NavItem>Dashboard</NavItem>
          </LinkContainer>
        </Nav>
        <Nav pullRight>
          <NavDropdown
            id="settings-dropdown"
            title={[this.props.viewer.user.first_name, this.props.viewer.user.last_name].join(' ')}
          >
            <LinkContainer to={'/settings'}>
              <MenuItem>
                <i className="fa fa-cog fa-fw" />&nbsp;Settings
              </MenuItem>
            </LinkContainer>
            <LinkContainer to={'/support'}>
              <MenuItem>
                <i className="fa fa-question-circle fa-fw" />&nbsp;Support
              </MenuItem>
            </LinkContainer>
            <MenuItem divider />
            <LinkContainer to={'/logout'}>
              <MenuItem>
                <i className="fa fa-power-off fa-fw" />&nbsp;Logout
              </MenuItem>
            </LinkContainer>
          </NavDropdown>
        </Nav>
      </Navbar>
    );

    const admin_container_classes = {
      container: this.props.location.pathname !== `/users`
    };
    return (
      <div>
        {navbar}
        <div className={classnames(admin_container_classes)}>{this.props.children}</div>
      </div>
    );
  }
}

App.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    viewer: state.current_user,
    value: state.value,
    errors: state.errors
  };
};

const ReduxApp = connect(mapStateToProps, { fetchCurrentUser, fetchDefaultSources })(App);

export default ReduxApp;
