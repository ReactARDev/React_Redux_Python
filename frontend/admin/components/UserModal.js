import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup, Alert } from 'react-bootstrap';
import {
  updateSpecifiedUser,
  fetchSpecifiedUser,
  fetchTeams,
  addTeam,
  addTeamMember,
  removeTeamMember
} from '../../shared/actions';

class UserModal extends React.Component {
  constructor(props) {
    super(props);

    const user = props.specified_user.user;
    const name =
      !_.isEmpty(props.teams) && !_.isNil(user.team_id) ? props.teams[user.team_id].name : null;
    this.state = {
      company: user.company,
      team: { id: user.team_id, name },
      industry: user.industry,
      discipline: user.discipline,
      level: user.level,
      saveDisabled: false,
      add_team: false,
      showTeamSubscriptionWarning: false,
      remove_user_from_team: false
    };
  }

  componentWillMount() {
    this.props.fetchTeams();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.specified_user && nextProps.specified_user.isReady) {
      const user = nextProps.specified_user.user;
      const name = !_.isEmpty(this.props.teams) && !_.isNil(user.team_id)
        && this.props.teams[user.team_id]
        ? this.props.teams[user.team_id].name
        : null;
      this.setState({
        company: user.company,
        team: { id: user.team_id, name },
        industry: user.industry,
        discipline: user.discipline,
        level: user.level
      });
    }

    if (!nextProps.specified_user.isUpdating) {
      // close the modal on success
      if (this.props.showModal && this.state.saveDisabled) {
        this.props.close();
      }
      this.setState({
        saveDisabled: false
      });
    }

    if (!this.props.showModal) {
      this.setState({ add_team: false });
    }
  }

  handleSubmit = event => {
    event.preventDefault();
    this.setState({ saveDisabled: true, showTeamSubscriptionWarning: false });

    const update = {};
    const user = this.props.specified_user.user;

    // add user to new team
    if (
      !_.includes(this.props.team_names, this.state.team.name) &&
      !this.state.remove_user_from_team &&
      !_.isNil(this.state.team.name)
    ) {
      this.props.addTeam(this.state.team.name).then(new_team => {
        update.team_id = new_team.id;
        this.props.updateSpecifiedUser(user.email, update).then(() => {
          this.props.addTeamMember(new_team.id, user.id);
          this.props.fetchTeams();
        });
      });
    }

    if (this.state.remove_user_from_team) {
      update.team_id = null;
      this.props.removeTeamMember(user.team_id, user.id);
      this.setState({ remove_user_from_team: false });
    }

    if (this.state.company !== user.company) {
      update.company = this.state.company;
    }

    // add user to pre-created team
    if (this.state.team.id !== user.team_id && !this.state.remove_user_from_team) {
      if (!_.isNil(user.team_id)) { // remove user from previous team
        this.props.removeTeamMember(user.team_id, user.id);
      }
      update.team_id = this.state.team.id;
      this.props.addTeamMember(this.state.team.id, user.id);
    }

    if (this.state.industry !== user.industry) {
      update.industry = this.state.industry;
    }

    if (this.state.discipline !== user.discipline) {
      update.discipline = this.state.discipline;
    }

    if (this.state.level !== user.level) {
      update.level = this.state.level;
    }

    this.props.updateSpecifiedUser(user.email, update).then(() => {
      this.props.fetchSpecifiedUser(user.email);
    });
  };
  render() {
    if (!this.props.specified_user || this.props.specified_user.isFetching) {
      return null;
    }

    const specified_user = this.props.specified_user.user;

    const handleFieldChange = (field, event) => {
      const new_state = {
        ...this.state
      };
      if (event.target.value === 'Add Team') {
        new_state.add_team = true;
        new_state.showTeamSubscriptionWarning = true;
      } else if (event.target.value === 'Remove User from Team') {
        new_state.team.id = null;
        new_state.remove_user_from_team = true;
        new_state.showTeamSubscriptionWarning = true;
      } else if (field === 'team_name') {
        new_state.team.name = event.target.value;
        new_state.showTeamSubscriptionWarning = true;
      } else if (field === 'team_id') {
        new_state.team.id = event.target.value;
        new_state.showTeamSubscriptionWarning = true;
      } else {
        new_state[field] = event.target.value;
      }
      this.setState(new_state);
    };

    return (
      <Modal show={this.props.showModal} onHide={this.props.close}>
        <Modal.Header>
          <Modal.Title>{specified_user.email}</Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup>
              <ControlLabel>Company</ControlLabel>
              <FormControl
                type="text"
                value={this.state.company}
                onChange={e => handleFieldChange('company', e)}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Team</ControlLabel>
              {this.state.showTeamSubscriptionWarning ? (
                <Alert>You may need to update the user's subscription, too.</Alert>
              ) : null}
              {this.state.add_team ? (
                <FormControl
                  type="text"
                  placeholder="Add Team"
                  autoFocus
                  onChange={e => handleFieldChange('team_name', e)}
                />
              ) : null}
              {this.state.add_team ? (
                <div />
              ) : (
                <select
                  className="form-control"
                  value={this.state.team.id}
                  onChange={e => handleFieldChange('team_id', e)}
                >
                  <option value="" />
                  <option value="Add Team">Add Team</option>
                  {Object.keys(this.props.teams).map(team_id => {
                    return <option value={team_id}>{this.props.teams[team_id].name}</option>;
                  })}
                  {!_.isNil(this.state.team.id) ? (
                    <option value="Remove User from Team">Remove User from Team</option>
                  ) : null}
                </select>
              )}
            </FormGroup>
            <FormGroup>
              <ControlLabel>Industry</ControlLabel>
              <select
                className="form-control"
                value={this.state.industry}
                onChange={e => handleFieldChange('industry', e)}
              >
                <option value="" />
                <option value="Banking">Banking</option>
                <option value="FinTech">FinTech</option>
                <option value="Law Firm">Law Firm</option>
                <option value="Payments">Payments</option>
                <option value="Other">Other</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Discipline</ControlLabel>
              <select
                className="form-control"
                value={this.state.discipline}
                onChange={e => handleFieldChange('discipline', e)}
              >
                <option value="" />
                <option value="Compliance">Compliance</option>
                <option value="Risk">Risk</option>
                <option value="Legal">Legal</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </FormGroup>
            <FormGroup>
              <ControlLabel>Level</ControlLabel>
              <select
                className="form-control"
                value={this.state.level}
                onChange={e => handleFieldChange('level', e)}
              >
                <option value="" />
                <option value="Researcher">Researcher</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Executive">Executive</option>
                <option value="Other">Other</option>
              </select>
            </FormGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button
              onClick={() => {
                this.props.close();
                this.setState({ showTeamSubscriptionWarning: false });
              }}
            >
              Close
            </Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              Save
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

UserModal.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  const teams = state.teams.all_teams.reduce((mem, team) => {
    if (!mem[team.id]) {
      mem[team.id] = team;
    }
    return mem;
  }, {});
  const team_names = _.map(state.teams.all_teams, 'name');
  return {
    specified_user: state.specified_user,
    current_view: state.current_view,
    teams,
    team_names,
    fetchingTeams: state.teams.isFetching,
    errors: state.errors
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateSpecifiedUser: (email, data) => {
      return dispatch(updateSpecifiedUser(email, data));
    },
    fetchSpecifiedUser: email => {
      dispatch(fetchSpecifiedUser(email));
    },
    fetchTeams: () => {
      dispatch(fetchTeams());
    },
    addTeamMember: (team_id, user_id) => {
      dispatch(addTeamMember(team_id, user_id));
    },
    removeTeamMember: (team_id, user_id) => {
      dispatch(removeTeamMember(team_id, user_id));
    },
    addTeam: name => {
      return dispatch(addTeam(name));
    }
  };
};

const ReduxUserModal = connect(mapStateToProps, mapDispatchToProps)(UserModal);

export default ReduxUserModal;
