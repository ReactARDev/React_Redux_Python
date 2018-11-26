import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';
import { Button } from 'react-bootstrap';
import UserModal from './UserModal';
import _ from 'lodash';
import {
  fetchAllUsers,
  fetchSpecifiedUser,
  fetchCampaignDetails,
  fetchTeams
} from '../../shared/actions';
import UsersItem from './UsersItem';
import SuspendUserModal from './SuspendUserModal';
import DeleteUserModal from './DeleteUserModal';
import DeleteErrorModal from './DeleteErrorModal';
import Snackbar from '../../node_modules/material-ui/Snackbar';

class Users extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
      specified_email: false,
      hide_internal_users: false,
      sortedUsers: [],
      specified_users: {},
      sortField: '',
      sortOrder: 'asc',
      show_suspend_modal: false,
      show_delete_modal: false,
      show_error_modal: false,
      errorText: '',
      show_success_snackbar: false
    };
  }

  componentWillMount() {
    const { query } = this.props.location;

    if (query.marketing_campaign_id) {
      this.props.fetchCampaignDetails(query.marketing_campaign_id);
    }
    this.props.fetchAllUsers();
    this.props.fetchTeams();
  }

  componentWillReceiveProps(nextProps) {
    /*
      Keep track of all the specified users in the state
      so as to make sure only the latest (most-up-to-date)
      user is being passed to the user table
    */
    const specified_users = {};
    if (!_.isEmpty(nextProps.specified_user)) {
      specified_users[nextProps.specified_user.id] = nextProps.specified_user;
    }

    this.setState({
      specified_users: {
        ...this.state.specified_users,
        ...specified_users
      },
      sortedUsers: nextProps.all_users.users
    });
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
    if (this.state.sortOrder === 'desc') {
      return <i className="material-icons header-arrow active">keyboard_arrow_down</i>;
    }
    return <i className="material-icons header-arrow active">keyboard_arrow_up</i>;
  }

  sort(sortField) {
    let sortOrder;
    if (sortField !== this.state.sortField) {
      sortOrder = 'asc';
    } else {
      sortOrder = this.state.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    const sortedUsers = _.orderBy(
      this.state.sortedUsers,
      user => {
        if (sortField === 'lastLogin') {
          const lastLogin = user.enabled
            ? moment(user.properties.session_end).format('MM/DD/YYYY')
            : 'N/A';
          return lastLogin;
        }
        if (sortField === 'activatedOn') {
          const activatedOn =
            user.properties && user.properties.activation_time
              ? moment(user.properties.activation_time).format('MM/DD/YYYY')
              : null;
          return activatedOn;
        }
        if (sortField === 'reinvited') {
          const reinvtedOn =
            user.properties && user.properties.resent_invite_time
              ? moment(user.properties.resent_invite_time).format('MM/DD/YYYY')
              : null;
          return reinvtedOn;
        }
        if (sortField === 'createdOn') {
          const createdOn = moment(user.created_at).format('MM/DD/YYYY');
          return createdOn;
        }
        if (sortField === 'confirmedOn') {
          const confirmedOn =
            user.properties && user.properties.confirmed_date
              ? moment(user.properties.confirmed_date).format('MM/DD/YYYY')
              : null;
          return confirmedOn;
        }
        if (sortField === 'confirmationEmailDate') {
          const confirmedOn =
            user.properties && user.properties.confirmation_resent_time
              ? moment(user.properties.confirmation_resent_time).format('MM/DD/YYYY')
              : null;
          return confirmedOn;
        }
        if (sortField === 'invited') {
          return !!user.properties.invited_by;
        }
        if (sortField === 'team') {
          const user_team = !_.isNil(user.team_id)
            ? _.find(this.props.teams, team => {
              return team.id === user.team_id;
            })
            : { name: '' };

          return user_team.name;
        }
        if (typeof user[sortField] === 'string') {
          return user[sortField].toLowerCase();
        }
        return user[sortField];
      },
      sortOrder
    );
    this.setState({ sortedUsers, sortField, sortOrder });
  }

  toggleHide = () => {
    this.setState({ hide_internal_users: !this.state.hide_internal_users });
  };

  render() {
    const { query } = this.props.location;

    if (
      !this.state.sortedUsers ||
      !this.props.all_users.isReady ||
      (query.marketing_campaign_id && _.isNil(this.props.marketing.details.users))
    ) {
      return null;
    }

    const close = () => {
      this.setState({ showModal: false });
    };

    const open_user_modal = email => {
      this.props.fetchSpecifiedUser(email);
      this.setState({ showModal: true, specified_email: email });
    };

    const close_suspend_modal = () => {
      this.setState({ show_suspend_modal: false });
    };

    const open_suspend_modal = email => {
      this.props.fetchSpecifiedUser(email);
      this.setState({ show_suspend_modal: true, specified_email: email });
    };

    const close_delete_modal = () => {
      this.setState({ show_delete_modal: false });
    };

    const open_delete_modal = email => {
      this.props.fetchSpecifiedUser(email);
      this.setState({ show_delete_modal: true, specified_email: email });
    };

    const refetch_users = () => {
      this.props.fetchAllUsers();
    };

    const open_error_modal = (email, errorText) => {
      this.setState({ show_error_modal: true, specified_email: email, errorText });
    };

    const close_error_modal = () => {
      this.setState({ show_error_modal: false, errorText: '' });
    };

    const show_success_snackbar = email => {
      this.setState({ show_success_snackbar: true, specified_email: email });
    };

    const close_success_snackbar = () => {
      this.setState({ show_success_snackbar: false });
    };

    let users = query.marketing_campaign_id
      ? this.props.marketing.details.users
      : this.state.sortedUsers;

    if (this.state.hide_internal_users) {
      users = users.filter(user => {
        if (_.endsWith(user.email, 'jurispect.com') || _.endsWith(user.email, 'compliance.ai')) {
          return null;
        }

        return user;
      });
    }

    return (
      <div className="users-container">
        <h1>Users</h1>
        <Button className="hide_btn" bsStyle="primary" bsSize="xsmall" onClick={this.toggleHide}>
          {this.state.hide_internal_users ? 'Show Internal Users' : 'Hide Internal Users'}
        </Button>
        <table className="table table-hover">
          <thead>
            <tr>
              <th className="user-header" title="User Email" onClick={() => this.sort('email')}>
                Email {this.getIcons('email')}
              </th>
              <th className="user-header" title="User Name" onClick={() => this.sort('first_name')}>
                Name {this.getIcons('first_name')}
              </th>
              <th
                className="user-header"
                title="User received an email invitation to become a user"
                onClick={() => this.sort('invited')}
              >
                Invited {this.getIcons('invited')}
              </th>
              <th
                className="user-header"
                title="Last date a follow-up invite email was sent"
                onClick={() => this.sort('reinvited')}
              >
                Reinvited {this.getIcons('reinvited')}
              </th>
              <th
                className="user-header"
                title="User has activated invitation or confirmed account after sign up"
                onClick={() => this.sort('enabled')}
              >
                Enabled {this.getIcons('enabled')}
              </th>
              <th className="user-header" title="User Company" onClick={() => this.sort('company')}>
                Company {this.getIcons('company')}
              </th>
              <th className="user-header" title="User Team" onClick={() => this.sort('team')}>
                Team {this.getIcons('team')}
              </th>
              <th
                className="user-header"
                title="User Industry"
                onClick={() => this.sort('industry')}
              >
                Industry {this.getIcons('industry')}
              </th>
              <th
                className="user-header"
                title="User Discipline"
                onClick={() => this.sort('discipline')}
              >
                Discipline {this.getIcons('discipline')}
              </th>
              <th
                className="user-header"
                title="User Job-title/Level"
                onClick={() => this.sort('level')}
              >
                Level {this.getIcons('level')}
              </th>
              <th
                className="user-header"
                title="Quality Assurance/Annotator"
                onClick={() => this.sort('roles')}
              >
                QA {this.getIcons('roles')}
              </th>
              <th className="user-header" title="Contributor" onClick={() => this.sort('roles')}>
                Contributor {this.getIcons('roles')}
              </th>
              <th
                className="user-header"
                title="Date user record created by invitation OR sign up"
                onClick={() => this.sort('lastLogin')}
              >
                Created On {this.getIcons('createdOn')}
              </th>
              <th
                className="user-header"
                title="Date user confirmed account via email sent after sign up"
                onClick={() => this.sort('confirmedOn')}
              >
                Confirmed On
                {this.getIcons('confirmedOn')}
              </th>
              <th
                className="user-header"
                title="Date user completes registration and accepts TOS by invitation OR sign up"
                onClick={() => this.sort('activatedOn')}
              >
                Activated On
                {this.getIcons('activatedOn')}
              </th>
              <th className="user-header" title="Last Login" onClick={() => this.sort('lastLogin')}>
                Last Login {this.getIcons('lastLogin')}
              </th>
              <th
                className="user-header"
                title="Account Status"
                onClick={() => this.sort('accountStatus')}
              >
                Account status {this.getIcons('accountStatus')}
              </th>
              <th
                className="user-header"
                title="Account Suspended"
                onClick={() => this.sort('suspend')}
              >
                Suspend {this.getIcons('suspend')}
              </th>
              <th
                className="user-header"
                title="Suspension Reason"
                onClick={() => this.sort('suspendedReason')}
              >
                Suspended reason {this.getIcons('suspendedReason')}
              </th>
              <th
                className="user-header"
                title="Resend confirmation email"
                onClick={() => this.sort('confirmationEmailDate')}
              >
                Last Confirmation Email Sent {this.getIcons('confirmationEmailDate')}
              </th>
              <th
                className="user-header"
                title="Resend confirmation email"
                onClick={() => this.sort('confirmationEmail')}
              >
                Send Confirmation Email {this.getIcons('confirmationEmail')}
              </th>
              {window.location.host.indexOf('pro') === -1 ? (
                <th
                  className="user-header"
                  title="Delete User"
                  onClick={() => this.sort('deleteUser')}
                >
                  Delete User {this.getIcons('deleteUser')}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              // replace user here with more update to date specifed user
              // to avoid having to fetch all_users when changing single user data
              let actual_user = user;
              if (user.id === this.props.specified_user.id) {
                actual_user = this.props.specified_user;
              } else if (this.state.specified_users[user.id]) {
                actual_user = this.state.specified_users[user.id];
              }
              return (
                <UsersItem
                  user={actual_user}
                  open_user_modal={open_user_modal}
                  close={close}
                  key={user.email}
                  open_suspend_modal={open_suspend_modal}
                  open_delete_modal={open_delete_modal}
                />
              );
            })}
          </tbody>
        </table>
        <UserModal
          close={close}
          open_user_modal={open_user_modal}
          showModal={this.state.showModal}
        />
        <SuspendUserModal
          close_suspend_modal={close_suspend_modal}
          showModal={this.state.show_suspend_modal}
        />
        <DeleteUserModal
          close_delete_modal={close_delete_modal}
          showModal={this.state.show_delete_modal}
          refetch={refetch_users}
          showError={open_error_modal}
          showSuccessSnackbar={show_success_snackbar}
        />
        <DeleteErrorModal
          close_error_modal={close_error_modal}
          showModal={this.state.show_error_modal}
          email={this.state.specified_email}
          errorText={this.state.errorText}
        />
        <Snackbar
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          open={this.state.show_success_snackbar}
          onClose={close_success_snackbar}
          message={
            <span style={{ fontSize: 14 }}>
              {this.state.specified_email} successfully deleted
            </span>
          }
          autoHideDuration={5000}
        />
      </div>
    );
  }
}

Users.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllUsers: () => {
      dispatch(fetchAllUsers());
    },
    fetchSpecifiedUser: email => {
      dispatch(fetchSpecifiedUser(email));
    },
    fetchCampaignDetails: id => {
      dispatch(fetchCampaignDetails(id));
    },
    fetchTeams: () => {
      dispatch(fetchTeams());
    }
  };
};

const mapStateToProps = state => {
  return {
    specified_user: state.specified_user.user,
    all_users: state.all_users,
    teams: state.teams.all_teams,
    marketing: state.marketing
  };
};

const ReduxUsers = connect(mapStateToProps, mapDispatchToProps)(Users);

export default ReduxUsers;
