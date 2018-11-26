import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button, FormControl, ControlLabel, FormGroup } from 'react-bootstrap';
import { updateSpecifiedUser, fetchSpecifiedUser } from '../../shared/actions';

class SuspendUserModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      suspendedReason: '',
      saveDisabled: false
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    this.setState({ saveDisabled: true });
    this.props.close_suspend_modal();
    const params = {};
    params.suspended = !this.props.specified_user.user.suspended;
    params.suspended_reason = this.state.suspendedReason;
    this.props.updateSpecifiedUser(this.props.specified_user.user.email, params).then(() => {
      this.props.fetchSpecifiedUser(this.props.specified_user.user.email);
    });
  };

  render() {
    if (!this.props.specified_user || this.props.specified_user.isFetching) {
      return null;
    }

    const specified_user = this.props.specified_user.user;

    const handleFieldChange = (field, event) => {
      const new_state = {};
      new_state[field] = event.target.value;
      this.setState(new_state);
    };

    const enableSave = () => {
      this.setState({ saveDisabled: false });
    };

    return (
      <Modal
        show={this.props.showModal}
        onHide={this.props.close_suspend_modal}
        onEnter={enableSave}
      >
        <Modal.Header>
          <Modal.Title>{specified_user.email}</Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            <FormGroup>
              <ControlLabel>Suspended Reason</ControlLabel>
              <FormControl
                type="text"
                value={this.state.suspendedReason}
                onChange={e => handleFieldChange('suspendedReason', e)}
              />
            </FormGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.props.close_suspend_modal}>Close</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.saveDisabled}>
              Save
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );
  }
}

SuspendUserModal.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    updateSpecifiedUser: (email, data) => {
      return dispatch(updateSpecifiedUser(email, data));
    },
    fetchSpecifiedUser: email => {
      dispatch(fetchSpecifiedUser(email));
    }
  };
};

const mapStateToProps = state => {
  return {
    specified_user: state.specified_user
  };
};

const ReduxSuspendUserModal = connect(mapStateToProps, mapDispatchToProps)(SuspendUserModal);

export default ReduxSuspendUserModal;
