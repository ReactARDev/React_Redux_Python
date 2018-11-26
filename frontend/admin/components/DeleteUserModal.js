import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Modal, Button } from 'react-bootstrap';
import { deleteUser, fetchSpecifiedUser } from '../../shared/actions';

class DeleteUserModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      deleteDisabled: false
    };
  }

  handleSubmit = event => {
    event.preventDefault();
    this.setState({ deleteDisabled: true });
    this.props.close_delete_modal();
    this.props.deleteUser(this.props.specified_user.user.email).then(res => {
      if (res.msg) {
        this.props.showSuccessSnackbar(this.props.specified_user.user.email);
        this.props.refetch();
      } else if (res.errors) {
        this.props.showError(this.props.specified_user.user.email, res.errors);
      }
    });
  };

  render() {
    if (!this.props.specified_user || this.props.specified_user.isFetching) {
      return null;
    }

    const specified_user = this.props.specified_user.user;

    const enableSave = () => {
      this.setState({ deleteDisabled: false });
    };

    const deleteModal = (
      <Modal
        show={this.props.showModal}
        onHide={this.props.close_delete_modal}
        onEnter={enableSave}
      >
        <Modal.Header>
          <Modal.Title>{specified_user.email}</Modal.Title>
        </Modal.Header>
        <form action="" onSubmit={this.handleSubmit}>
          <Modal.Body>
            Are you sure you want to delete {specified_user.email}?
            This action cannot be undone.
            <img alt="gif" src="https://media.giphy.com/media/naxep4vNBAOL6/giphy.gif" />
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.props.close_delete_modal}>Cancel</Button>
            <Button bsStyle="primary" type="submit" disabled={this.state.deleteDisabled}>
              Delete
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    );

    return (
      deleteModal
    );
  }
}

DeleteUserModal.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ specified_user }) => {
  return {
    specified_user
  };
};

const ReduxDeleteUserModal = connect(mapStateToProps, {
  deleteUser,
  fetchSpecifiedUser
})(DeleteUserModal);

export default ReduxDeleteUserModal;
