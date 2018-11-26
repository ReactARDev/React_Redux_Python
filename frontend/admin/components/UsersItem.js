import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import {
  updateSpecifiedUser,
  sendConfirmationEmail,
  fetchSpecifiedUser,
  deleteUser
} from '../../shared/actions';
import _ from 'lodash';
import { Button } from 'react-bootstrap';

class UsersItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isEnabled: false,
      isQA: false,
      isSuspended: false,
      isContributor: false,
      createdAt: null
    };
  }

  componentWillMount() {
    this.checkUserIsEnabledAndSetState(this.props);
    this.checkUserAndSetState(this.props);
    this.checkUserSuspendedStatus(this.props);
    this.checkUserIsContributorAndSetState(this.props);
    this.getCreatedAtAndSetState(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.checkUserIsEnabledAndSetState(nextProps);
    this.checkUserAndSetState(nextProps);
    this.checkUserSuspendedStatus(nextProps);
    this.checkUserIsContributorAndSetState(nextProps);
  }

  getCreatedAtAndSetState(props) {
    if (!_.isNil(props.user)) {
      return this.setState({ createdAt: props.user.created_at });
    }
    return this.setState({ createdAt: null });
  }

  checkUserIsEnabledAndSetState(props) {
    // checks if user has been enabled or not and sets state accordingly
    if (!_.isNil(props.user)) {
      if (props.user.enabled) {
        return this.setState({ isEnabled: true });
      }
    }
    return this.setState({ isEnabled: false });
  }

  checkUserAndSetState(props) {
    // checks if user has qa role or not and set's state accordingly
    if (!_.isNil(props.user)) {
      if (!_.isNil(props.user.roles)) {
        if (!_.isNil(props.user.roles.find(role => role === 'qa'))) {
          return this.setState({ isQA: true });
        }
      }
    }
    return this.setState({ isQA: false });
  }

  checkUserIsContributorAndSetState(props) {
    // checks if user has contributor role or not and set's state accordingly
    if (!_.isNil(props.user)) {
      if (!_.isNil(props.user.roles)) {
        if (!_.isNil(props.user.roles.find(role => role === 'contributor'))) {
          return this.setState({ isContributor: true });
        }
      }
    }
    return this.setState({ isContributor: false });
  }

  checkUserSuspendedStatus(props) {
    // checks if user is suspended and set state accordingly
    if (!_.isNil(props.user)) {
      if (props.user.suspended) {
        return this.setState({ isSuspended: true });
      }
    }
    return this.setState({ isSuspended: false });
  }

  handleEnabled(e, user) {
    const isEnabled = !this.state.isEnabled;
    if (isEnabled) {
      this.setState({ isEnabled });
      this.props.updateSpecifiedUser(user.email, { enabled: isEnabled }).then(res => {
        // get all users and rerender only if the this.state.isEnabled
        // doesn't match the server enabled
        if (res.user.enabled !== this.state.isEnabled) {
          this.props.fetchSpecifiedUser(user.email);
        }
      });
    }
  }

  handleQA(e, user) {
    const isQA = !this.state.isQA;
    this.setState({ isQA });
    this.props.updateSpecifiedUser(user.email, { isQA }).then(res => {
      // get all users and rerender only if the this.state.isQA
      // role doesn't match the server qa role
      const serverRoles = res.user.roles;
      const isQAServer = !_.isNil(serverRoles.find(role => role === 'qa'));
      if (isQAServer !== this.state.isQA) {
        this.props.fetchSpecifiedUser(user.email);
      }
    });
  }

  handleSuspendClick = e => {
    e.preventDefault();
    if (!this.state.isSuspended) {
      this.props.open_suspend_modal(this.props.user.email);
    } else {
      this.props.updateSpecifiedUser(this.props.user.email, { suspended: false }).then(() => {
        this.props.fetchSpecifiedUser(this.props.user.email);
      });
    }
  };

  handleDeleteClick = e => {
    e.preventDefault();
    this.props.open_delete_modal(this.props.user.email);
  }

  handleContributorToggle(e, user) {
    const isContributor = !this.state.isContributor;
    this.setState({ isContributor });
    this.props.updateSpecifiedUser(user.email, { isContributor }).then(res => {
      // get all users and rerender only if the this.state.isQA
      // role doesn't match the server qa role
      const serverRoles = res.user.roles;
      const isContributorServer = !_.isNil(serverRoles.find(role => role === 'contributor'));
      if (isContributorServer !== this.state.isContributor) {
        this.props.fetchSpecifiedUser(user.email);
      }
    });
  }

  render() {
    const { open_user_modal, user } = this.props;

    const userEnabled = (
      <input
        name="isEnabled"
        type="checkbox"
        checked={this.state.isEnabled}
        onClick={e => e.stopPropagation()}
        onChange={e => this.handleEnabled(e, user)}
        className="qa-checkbox"
      />
    );

    const userQA = (
      <input
        name="isQA"
        type="checkbox"
        checked={this.state.isQA}
        onClick={e => e.stopPropagation()}
        onChange={e => this.handleQA(e, user)}
        className="qa-checkbox"
        disabled={this.state.isContributor}
      />
    );

    const suspend_button = (
      <input
        type="checkbox"
        checked={this.state.isSuspended}
        onClick={e => e.stopPropagation()}
        onChange={e => this.handleSuspendClick(e)}
        className="qa-checkbox"
      />
    );

    const userContributor = (
      <input
        name="isContributor"
        type="checkbox"
        checked={this.state.isContributor}
        onClick={e => e.stopPropagation()}
        onChange={e => this.handleContributorToggle(e, user)}
        className="qa-checkbox"
        disabled={this.state.isQA}
      />
    );

    const lastLogin = user.enabled
      ? moment(user.properties.session_end).format('MM/DD/YYYY')
      : 'N/A';

    const activatedTime =
      user.properties && user.properties.activation_time
        ? moment(user.properties.activation_time).format('MM/DD/YYYY')
        : null;

    const invited = user.properties && !!user.properties.invited_by ? 'Yes' : 'No';

    const reinvited_date =
      user.properties && user.properties.resent_invite_time
        ? moment(user.properties.resent_invite_time).format('MM/DD/YYYY')
        : null;

    const reconfirmed_date =
      user.properties && user.properties.confirmation_resent_time
        ? moment(user.properties.confirmation_resent_time).format('MM/DD/YYYY')
        : null;

    const na_or_null = invited === 'Yes' ? 'Invited User' : 'Has Not Confirmed';

    const confirmed_date =
      user.properties && user.properties.confirmed_date
        ? moment(user.properties.confirmed_date).format('MM/DD/YYYY')
        : na_or_null;

    const user_created_on_time = moment(this.state.createdAt).format('MM/DD/YYYY');
    const sendConfirmationEmailButton = (
      <Button
        onClick={e => {
          e.stopPropagation();
          this.props.sendConfirmationEmail(user.email).then(() => {
            this.props.fetchSpecifiedUser(user.email);
          });
        }}
      >
        send
      </Button>
    );

    const deleteUserButton = (
      <Button
        onClick={e => {
          e.stopPropagation();
          this.handleDeleteClick(e);
        }}
      >
        delete
      </Button>
    );

    const user_team = !_.isNil(user.team_id)
      ? _.find(this.props.teams, team => {
        return team.id === user.team_id;
      })
      : { name: '' };

    return (
      <tr onClick={() => open_user_modal(user.email)}>
        <td>{user.email}</td>
        <td>{user.first_name + ' ' + user.last_name}</td>
        <td>{invited}</td>
        <td>{reinvited_date}</td>
        <td>{userEnabled}</td>
        <td>{user.company}</td>
        <td>{!user_team ? '' : user_team.name}</td>
        <td>{user.industry}</td>
        <td>{user.discipline}</td>
        <td>{user.level}</td>
        <td>{userQA}</td>
        <td>{userContributor}</td>
        <td>{user_created_on_time}</td>
        <td>{confirmed_date}</td>
        <td>{activatedTime}</td>
        <td>{lastLogin}</td>
        <td>{this.state.isSuspended ? 'Suspended' : 'Active'}</td>
        <td>{suspend_button}</td>
        <td>{this.state.isSuspended ? user.suspended_reason : ''}</td>
        <td>{reconfirmed_date}</td>
        <td>{sendConfirmationEmailButton}</td>
        {window.location.host.indexOf('pro') === -1 ? (
          <td>{deleteUserButton}</td>
        ) : null}
      </tr>
    );
  }
}
const mapStateToProps = state => {
  return {
    teams: state.teams.all_teams
  };
};
export default connect(mapStateToProps, {
  updateSpecifiedUser,
  sendConfirmationEmail,
  fetchSpecifiedUser,
  deleteUser
})(UsersItem);
