import { Modal, Button, FormControl } from 'react-bootstrap';
import React from 'react';
import classnames from 'classnames';
class SaveSearchModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchName: ''
    };
  }

  componentWillMount() {
    if (this.props.searchName && this.props.searchName !== this.state.searchName) {
      this.setState({ searchName: this.props.searchName });
    }
  }

  componentWillReceiveProps(nextProps) {
    // set the state only right after the modal is opened
    if (!this.props.saveSearchModalOpen && nextProps.saveSearchModalOpen) {
      if (nextProps.searchName && nextProps.searchName !== this.state.searchName) {
        this.setState({ searchName: nextProps.searchName });
      }
    }
  }

  handleSearchNameChange = e => {
    this.setState({ searchName: e.target.value });
  };

  render() {
    const {
      createBtnTitle,
      modalTitle,
      saveSearchModalOpen,
      renderErrors,
      createSavedSearch,
      close_modal
    } = this.props;

    const createSavedSearchClasses = {
      btn: true,
      'btn-primary': true,
      'create-saved-search-btn': true,
      disabled: this.state.searchName.trim().length < 1
    };

    return (
      <Modal show={saveSearchModalOpen} backdrop onHide={() => close_modal('save-search')}>
        <Modal.Body>
          {renderErrors()}
          <div id="saved-search-menu">
            <h1>
              {modalTitle}
            </h1>
            <div className="create-saved-search-input">
              <h4 className="text">Saved Search Name:</h4>
              <FormControl
                value={this.state.searchName}
                onChange={e => this.handleSearchNameChange(e)}
              />
            </div>
            <div className="create-saved-search-btns">
              <Button
                className={classnames(createSavedSearchClasses)}
                onClick={() => createSavedSearch(this.state.searchName)}
              >
                {createBtnTitle}
              </Button>
              <Button
                onClick={() => close_modal('save-search')}
                className="btn create-saved-search-btn"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

export default SaveSearchModal;
