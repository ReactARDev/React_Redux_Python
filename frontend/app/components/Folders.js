import React from 'react';
import _ from 'lodash';
import Select from 'react-select';
import classnames from 'classnames';
import { Modal, Button } from 'react-bootstrap';
import FolderTable from './FolderTable';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { safe_analytics } from '../../shared/utils/analytics';
import {
  removeUserFolder,
  fetchFolders,
  addBanner,
  addUserFolder,
  fetchDocuments,
  addDocumentsToFolder,
  closeCopyFolderModal,
  closeDeleteModal,
  addSharedFolder,
  addSharedFolderUsers,
  closeShareModal,
  fetchAllTeamMembers,
  openShareModal,
  updateSharedFolderUsers,
  openAddFolderMenu,
  closeAddFolderMenu,
  clearSelectedFolder,
  changeSelectedFolder
} from '../../shared/actions';
import { appUrl } from '../../shared/config';

class Folders extends React.Component {
  constructor(props) {
    super(props);

    this.default_state = {
      new_folder_name: '',
      share_msg: '',
      advanced_edit_user_id: null,
      selected_user_ids: [],
      removed_users: [],
      displayPermissionsMenu: false,
      displaySettingsMenu: false,
      advanced_folder_settings: {},
      blink: false,
      permission_changed: false,
      viewer: true //default to viewer permission
    };
    this.state = this.default_state;
  }

  componentWillMount() {
    if (!this.props.folders_isFetching) {
      this.props.fetchFolders();
    }
    if (!_.isNil(this.props.user.team_id) && !this.props.isfetching_teams) {
      this.props.fetchAllTeamMembers(this.props.user.team_id);
    }
  }
  componentWillReceiveProps(nextProps) {
    if (
      this.props.current_user.isFetching &&
      !nextProps.current_user.isFetching &&
      !_.isNil(this.props.user.team_id)
    ) {
      // refresh team members on props change
      this.props.fetchAllTeamMembers(nextProps.user.team_id);
    }

    let new_folder_name = this.state.new_folder_name;

    if (nextProps.copy_folder_menu_open) {
      new_folder_name = nextProps.selected_folder.name + ' copy';
    } else if (!_.isEmpty(nextProps.selected_folder)) {
      new_folder_name = nextProps.selected_folder.name;
    }

    if (!_.isEmpty(nextProps.shared_folders)) {
      nextProps.shared_folders.forEach(folder => {
        folder.shared_folder_users.forEach(user => {
          const advanced_folder_settings = this.state.advanced_folder_settings;

          advanced_folder_settings[user.id] = {
            editor: user.user_permission_access === 'editor',
            viewer: user.user_permission_access === 'viewer'
          };

          this.setState({
            advanced_folder_settings
          });
        });
      });
    }

    this.setState({ new_folder_name });
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.refs.advanced_permission_menu) {
      this.refs.advanced_permission_menu.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }

  getFilteredMembers = () => {
    const shared_users_ids = _.reduce(
      this.props.shared_folders,
      (mem, folder) => {
        if (this.props.selected_folder.id === folder.id) {
          folder.shared_folder_users.forEach((user, i) => {
            mem.push(user.id);
          });
        }
        return mem;
      },
      []
    );

    const filtered_members = this.props.team_members
      .reduce((mem, member) => {
        if (!_.includes(shared_users_ids, member.value)) {
          mem.push(member);
        }
        return mem;
      }, [])
      .sort((a, b) => {
        const label_a = a.label.toLowerCase();
        const label_b = b.label.toLowerCase();
        if (label_a < label_b) {
          return -1;
        } else if (label_a > label_b) {
          return 1;
        }
        return 0;
      });

    return filtered_members;
  };

  handleFolderShare = () => {
    //keep from passing blank folder name or sending double request
    if (_.trim(this.state.new_folder_name).length === 0 && !this.props.new_folder_being_added) {
      this.setState({ blink: !this.state.blink });
      return;
    }

    const new_users = this.state.selected_user_ids.map(id => {
      const editor =
        this.state.displaySettingsMenu && this.state.advanced_folder_settings[id]
          ? this.state.advanced_folder_settings[id].editor
          : !this.state.viewer;
      const viewer =
        this.state.displaySettingsMenu && this.state.advanced_folder_settings[id]
          ? this.state.advanced_folder_settings[id].viewer
          : this.state.viewer;

      return {
        id,
        owner: this.props.selected_folder.user_id === id,
        editor,
        viewer
      };
    });

    if (this.props.shared_folder_add && _.isEmpty(this.props.selected_folder)) {
      //add newly created folder to shared
      safe_analytics('default', 'Team Edition', 'Button click', 'Confirm new shared folder');
      this.props.addUserFolder(this.state.new_folder_name).then(new_folder => {
        this._shareFolder(new_folder.id, new_users);
      });
    } else if (this.props.shared_folder_update) {
      safe_analytics('default', 'Team Edition', 'Button click', 'Confirm update shared folder');
      //update previously created shared folder
      this.handleSharedFolderUpdate(
        this.props.selected_folder.id,
        new_users,
        this.state.removed_users
      );
      if (
        this.props.selected_folder.shared_folder_users.length - this.state.removed_users.length ===
        1
      ) {
        this._personalize(this.props.selected_folder);
      }
    } else {
      //add previously created folder to shared
      this._shareFolder(this.props.selected_folder.id, new_users);
    }
  };

  handleSharedFolderUpdate = (folder_id, users, removed_users) => {
    this.props.updateSharedFolderUsers(folder_id, users, removed_users, true).then(() => {
      this.props.fetchFolders();
      this.props.closeShareModal();
      this.setState(this.default_state);
      const folder_name = !_.isEmpty(this.props.selected_folder)
        ? this.props.selected_folder.name
        : 'Folder';
      this.props.addBanner('shared_update_success', true, `${folder_name} has been updated.`);
      this._waitAndCloseAlert('shared_update_success');
    });
  };

  handleNewFolderAdd = () => {
    //keep from passing blank folder name or sending double request
    if (_.trim(this.state.new_folder_name).length === 0 && !this.props.new_folder_being_added) {
      this.setState({ blink: !this.state.blink });
      return;
    }
    this.props
      .addUserFolder(this.state.new_folder_name)
      .then(() => {
        this.props.fetchFolders();
        this.props.closeAddFolderMenu();
        this.props.addBanner('add_success', true, `New Folder has been added.`);
        this._waitAndCloseAlert('add_success');
        this.setState(this.default_state);
      })
      .catch(error => {
        this.props.closeAddFolderMenu();
      });
  };

  handleFolderDelete = () => {
    safe_analytics('default', 'Personalization', 'Delete Folder');
    this.props.removeUserFolder(this.props.selected_folder.id).then(() => {
      this.props.fetchFolders();
      this.props.closeDeleteModal();
      this.setState(this.default_state);
      this.props.addBanner(
        'delete_success',
        true,
        `${this.props.selected_folder.name} has been deleted.`
      );
      this._waitAndCloseAlert('delete_success');
    });
  };

  handleFolderCopy = () => {
    safe_analytics('default', 'Personalization', 'Copy Folder');
    //keep from passing blank folder name or sending double request
    if (_.trim(this.state.new_folder_name).length === 0 && !this.props.new_folder_being_added) {
      this.setState({ blink: !this.state.blink });
      return;
    }
    this.props.addUserFolder(this.state.new_folder_name).then(copy_folder => {
      this.props.fetchDocuments({ folder_id: this.props.selected_folder.id }).then(folder_docs => {
        const doc_ids = folder_docs[0].documents.map(doc => {
          return doc.id;
        });
        this.props.addDocumentsToFolder(doc_ids, copy_folder.id);
        this.props.fetchFolders();
        this.setState(this.default_state);
        this.props.closeCopyFolderModal();
        this.props.addBanner(
          'copy_success',
          true,
          `${this.props.selected_folder.name} has been copied.`
        );
        this._waitAndCloseAlert('copy_success');
      });
    });
  };

  handleCloseModal = () => {
    if (this.state.displaySettingsMenu) {
      const advanced_folder_settings = {};
      this.state.removed_users.forEach(user_id => {
        advanced_folder_settings[user_id] = this.state.advanced_folder_settings[user_id];
      });

      this.setState({
        displaySettingsMenu: false,
        removed_users: [],
        advanced_folder_settings
      });
    } else {
      // XXX: remember to undo any changes that may have been done in the modal menu here
      if (this.props.add_folder_menu_open) {
        //prevent error if user clicks too fast
        if (this.props.new_folder_being_added) {
          return;
        }
        this.props.closeAddFolderMenu();
      } else if (this.props.delete_confirm_open) {
        this.props.closeDeleteModal();
      } else if (this.props.copy_folder_menu_open) {
        this.props.closeCopyFolderModal();
      } else if (this.props.shared_folder_update) {
        this.props.closeShareModal('update_shared');
      } else if (this.props.shared_folder_add) {
        safe_analytics('default', 'Team Edition', 'Button click', 'Cancel shared folder');
        this.props.closeShareModal('add_shared');
      }
      this.setState(this.default_state);
    }
  };

  handleFolderAction(e) {
    e.preventDefault();
    //prevent action in case of error or disabled
    if (!_.isEmpty(this.props.errors) || _.includes(e.target.className, 'disable')) {
      return;
    }
    /***********
    Add New Folder Action
    ***********/
    if (this.props.add_folder_menu_open) {
      this.handleNewFolderAdd();
      /***********
    Delete Folder Action
    ***********/
    } else if (this.props.delete_confirm_open) {
      this.handleFolderDelete();
      /***********
    Copy Folder Action
    ***********/
    } else if (this.props.copy_folder_menu_open) {
      this.handleFolderCopy();
      /***********
    Share Folder Action & Update Shared Folder Action
    ***********/
    } else if (this.props.shared_folder_add || this.props.shared_folder_update) {
      this.handleFolderShare();
    }
  }

  handleMemberSelect = selected_user_ids => {
    safe_analytics('default', 'Team Edition', 'Form selection', 'Edit folder members');
    this.setState({ selected_user_ids });
  };

  handlePermissionSelect = (e, permission, user_id = null) => {
    e.stopPropagation();
    safe_analytics('default', 'Team Edition', 'Select folder privileges', _.capitalize(permission));

    if (this.state.displaySettingsMenu && !_.isNil(user_id)) {
      const advanced_folder_settings = this.state.advanced_folder_settings;

      advanced_folder_settings[user_id] = {
        editor: permission === 'editor',
        viewer: permission === 'viewer'
      };

      this.setState({
        advanced_folder_settings
      });
    } else {
      this.setState({ viewer: permission === 'viewer' });
    }
  };

  handleEditMember = (e, user) => {
    e.preventDefault();
    e.stopPropagation();

    if (!_.includes(this.state.selected_user_ids, user.id)) {
      this.handleMemberSelect([...this.state.selected_user_ids, user.id]);
    }
    const advanced_edit_user_id = this.state.advanced_edit_user_id !== user.id ? user.id : null;
    this.setState({ advanced_edit_user_id });
  };

  handleRemoveUser = user => {
    const removed_users = [];
    if (!_.includes(this.state.removed_users, user.id)) {
      removed_users.push(user.id);
    }

    const advanced_folder_settings = {};
    Object.keys(this.state.advanced_folder_settings).forEach(user_id => {
      if (~~user_id !== user.id) {
        advanced_folder_settings[user_id] = this.state.advanced_folder_settings[user_id];
      }
    });

    this.setState({
      advanced_folder_settings,
      removed_users: [...this.state.removed_users, ...removed_users]
    });
  };

  _waitAndCloseAlert(type) {
    setTimeout(() => this.props.addBanner(type, false), 5000);
  }

  _shareFolder = (folder_id, users) => {
    this.props.addSharedFolder(folder_id, this.props.user.id, true).then(new_shared_folder => {
      this.props
        .addSharedFolderUsers(new_shared_folder.folder_id, users, true, this.state.share_msg)
        .then(() => {
          this.props.fetchFolders();
          this.props.closeShareModal();
          this.setState(this.default_state);
          const folder_name = !_.isEmpty(this.props.selected_folder)
            ? this.props.selected_folder.name
            : 'Folder';
          this.props.addBanner('shared_success', true, `${folder_name} has been shared.`);
          this._waitAndCloseAlert('shared_success');
        });
    });
  };

  _personalize = folder => {
    const folder_name = folder.name + '_personalized';
    this.props.addUserFolder(folder_name).then(copy_folder => {
      this.props.fetchDocuments({ folder_id: folder.id }).then(folder_docs => {
        const doc_ids = folder_docs[0].documents.map(doc => {
          return doc.id;
        });
        this.props.addDocumentsToFolder(doc_ids, copy_folder.id);
        this.props.removeUserFolder(folder.id).then(() => {
          this.props.fetchFolders();
          this.setState(this.default_state);
          this.props.addBanner(
            'personalized_success',
            true,
            `${this.props.selected_folder.name} has been unshared.`
          );
          this._waitAndCloseAlert('personalized_success');
        });
      });
    });
  };

  render() {
    let folder_menu_title = null;
    let shared_folder_btn_txt = null;
    let placeholder_txt = null;

    if (this.state.displaySettingsMenu) {
      folder_menu_title = 'Share Folder Settings';
      shared_folder_btn_txt = 'Done';
    } else if (this.props.add_folder_menu_open) {
      folder_menu_title = 'Add New Folder';
      shared_folder_btn_txt = 'Add';
      placeholder_txt = 'New Folder';
    } else if (this.props.shared_folder_update) {
      folder_menu_title = 'Update Shared Folder';
      shared_folder_btn_txt = 'Update';
    } else if (this.props.delete_confirm_open) {
      folder_menu_title = `Are you sure you want to delete ${this.props.selected_folder.name} ?`;
      shared_folder_btn_txt = 'Confirm Delete';
    } else if (this.props.copy_folder_menu_open) {
      folder_menu_title = 'Copy Folder';
      shared_folder_btn_txt = 'Copy';
      placeholder_txt = `${this.props.selected_folder.name} copy`;
    } else if (this.props.shared_folder_add) {
      folder_menu_title = 'Share Folder';
      shared_folder_btn_txt = 'Share';
      placeholder_txt = 'Shared Folder Name';
    }

    const handleShareMsgChange = e => {
      e.preventDefault();
      this.setState({ share_msg: e.target.value });
    };

    const selected_shared_folder_members = this.state.selected_user_ids
      .map(id => {
        return this.props.team_members.reduce((mem, member) => {
          if (member.value === ~~id) {
            mem.value = member.value;
            mem.label = member.label;
          }
          return mem;
        }, {});
      })
      .sort((a, b) => {
        const label_a = a.label.toLowerCase();
        const label_b = b.label.toLowerCase();
        if (label_a < label_b) {
          return -1;
        } else if (label_a > label_b) {
          return 1;
        }
        return 0;
      });

    const modalOpenStatus =
      this.props.add_folder_menu_open ||
      this.props.shared_folder_update ||
      this.props.delete_confirm_open ||
      this.props.copy_folder_menu_open ||
      this.props.shared_folder_add;

    const handlFolderTitleChange = e => {
      e.preventDefault();

      if (e.keyCode === 13) {
        this.handleFolderAction(e);
      }

      this.setState({ new_folder_name: e.target.value });
    };

    const shared_users_list = _.reduce(
      this.props.shared_folders,
      (mem, folder) => {
        if (this.props.selected_folder.id === folder.id) {
          folder.shared_folder_users.forEach((user, i) => {
            if (user.id !== this.props.user.id && !this.state.displaySettingsMenu) {
              mem.push(
                <li className="shared-user-name" key={user.id}>
                  {mem.length > 0 && mem.length === folder.shared_folder_users.length - 2
                    ? 'and '
                    : null}
                  {_.capitalize(user.first_name)}
                  {i < folder.shared_folder_users.length - 2 ? ',' : null}
                </li>
              );
            } else if (
              this.state.displaySettingsMenu &&
              !_.includes(this.state.removed_users, user.id)
            ) {
              mem.push(
                <li className="shared-member-name" key={user.id}>
                  {user.email}
                  {user.user_permission_access === 'owner' ? (
                    <span>Is Owner</span>
                  ) : (
                    <div className="edit-menu-close-container">
                      <div className="edit-menu">
                        <div
                          className="edit-drop-down"
                          onClick={e => this.handleEditMember(e, user)}
                          title="Shared Permissions"
                        >
                          <i className="material-icons">edit</i>
                        </div>
                        {this.state.advanced_edit_user_id === user.id ? (
                          <div className="permission-menu" ref="advanced_permission_menu">
                            <ul>
                              <div
                                className="permission-selection"
                                onClick={e => this.handlePermissionSelect(e, 'editor', user.id)}
                              >
                                {this.state.advanced_folder_settings[user.id] &&
                                this.state.advanced_folder_settings[user.id].editor ? (
                                  <i className="material-icons">done</i>
                                ) : (
                                  <div className="spacer" />
                                )}
                                <li title="Share, Edit, View">Editor</li>
                              </div>
                              <div
                                className="permission-selection"
                                onClick={e => this.handlePermissionSelect(e, 'viewer', user.id)}
                              >
                                {this.state.advanced_folder_settings[user.id] &&
                                this.state.advanced_folder_settings[user.id].viewer ? (
                                  <i className="material-icons">done</i>
                                ) : (
                                  <div className="spacer" />
                                )}
                                <li title="View">Viewer</li>
                              </div>
                            </ul>
                          </div>
                        ) : null}
                      </div>
                      <i
                        className="material-icons close"
                        onClick={() => this.handleRemoveUser(user)}
                      >
                        close
                      </i>
                    </div>
                  )}
                </li>
              );
            }
          });
        }
        return mem;
      },
      []
    );

    const show_input =
      this.props.add_folder_menu_open ||
      (this.props.shared_folder_add && _.isEmpty(this.props.selected_folder)) ||
      this.props.copy_folder_menu_open;

    const disable_action_btn =
      (!show_input &&
        _.isEmpty(selected_shared_folder_members[0]) &&
        !this.props.delete_confirm_open &&
        !this.state.displaySettingsMenu) || // share folder
      (show_input &&
        (_.trim(this.state.new_folder_name).length === 0 ||
          (_.isEmpty(selected_shared_folder_members[0]) && this.props.shared_folder_add))) ||
      (this.state.displaySettingsMenu &&
        _.isEmpty(this.state.removed_users) &&
        _.isEmpty(selected_shared_folder_members[0])); //update folder;

    return (
      <div className="folders-container">
        <Modal show={modalOpenStatus} backdrop onHide={() => this.handleCloseModal()}>
          <Modal.Body bsClass="noop">
            <div id="folder-modal-menu">
              <div className="header">
                <h3>{folder_menu_title}</h3>
                <i className="material-icons" onClick={() => this.handleCloseModal()}>
                  close
                </i>
              </div>
              <div
                className="body"
                onClick={e => {
                  e.preventDefault();
                  if (this.state.displayPermissionsMenu && !this.state.displaySettingsMenu) {
                    this.setState({ displayPermissionsMenu: false });
                  }
                }}
              >
                {!this.state.displaySettingsMenu ? (
                  <div className="selected-folder-name">
                    <i className="material-icons">folder</i>
                    {show_input ? (
                      <input
                        className={classnames({ 'fill-out-flash': this.state.blink })}
                        placeholder={placeholder_txt}
                        value={this.state.new_folder_name}
                        onChange={handlFolderTitleChange}
                        required
                        autoFocus={!this.props.copy_folder_menu_open}
                        onFocus={() => this.setState({ new_folder_name: '', blink: false })}
                        onKeyUp={handlFolderTitleChange}
                      />
                    ) : (
                      <h3>{this.props.selected_folder.name}</h3>
                    )}
                  </div>
                ) : null}
                {this.state.displaySettingsMenu ? (
                  <div
                    className="advanced-settings-menu"
                    onClick={() => this.setState({ advanced_edit_user_id: null })}
                  >
                    <div className="share-link-container">
                      <h5>Link to share (only accessible by collaborators)</h5>
                      <input
                        defaultValue={
                          appUrl +
                          'content?folderTimelineView=true&no_skipping=true&folder_id=' +
                          this.props.selected_folder.id
                        }
                      />
                    </div>
                    <div className="member-list">
                      <h5>Who has access</h5>
                      <ul>{shared_users_list}</ul>
                    </div>
                  </div>
                ) : null}
                {(this.props.shared_folder_update || this.props.shared_folder_add) &&
                !this.state.displaySettingsMenu ? (
                  <div className="shared-menu-container">
                    <h5>People</h5>
                    <div className="share-input-container">
                      <Select
                        name="team_member_select"
                        options={
                          this.props.shared_folder_update
                            ? this.getFilteredMembers()
                            : this.props.team_members
                        }
                        onChange={e => this.handleMemberSelect(e.map(obj => obj.value))}
                        value={
                          !_.isEmpty(selected_shared_folder_members[0])
                            ? selected_shared_folder_members
                            : null
                        }
                        multi
                        className="shared_users_input"
                        placeholder="Enter names or email address..."
                      />
                      <div className="edit-menu">
                        <div
                          className="edit-drop-down"
                          onClick={() =>
                            this.setState({
                              displayPermissionsMenu: !this.state.displayPermissionsMenu
                            })
                          }
                          title="Shared Permissions"
                        >
                          <i className="material-icons">edit</i>
                        </div>
                        {this.state.displayPermissionsMenu ? (
                          <div className="permission-menu">
                            <ul>
                              <div
                                className="permission-selection"
                                onClick={e => this.handlePermissionSelect(e, 'editor')}
                              >
                                {!this.state.viewer ? (
                                  <i className="material-icons">done</i>
                                ) : (
                                  <div className="spacer" />
                                )}
                                <li title="Share, Edit, View">Editor</li>
                              </div>
                              <div
                                className="permission-selection"
                                onClick={e => this.handlePermissionSelect(e, 'viewer')}
                              >
                                {this.state.viewer ? (
                                  <i className="material-icons">done</i>
                                ) : (
                                  <div className="spacer" />
                                )}
                                <li title="View">Viewer</li>
                              </div>
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <textarea
                      className="share-note-area"
                      onChange={handleShareMsgChange}
                      placeholder="Add a note"
                    />
                    {this.props.shared_folder_update ? (
                      <div className="link-list-container">
                        <div className="shared-user-list">
                          <p className="shared-with-txt">Shared with:</p>
                          <ul>{shared_users_list}</ul>
                        </div>
                        <div className="link-container">
                          <a
                            className="advanced-settings-link"
                            onClick={() => this.setState({ displaySettingsMenu: true })}
                          >
                            Advanced Settings
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="btn-container">
                  <Button
                    className={classnames({
                      'share-folder-btn': true,
                      disable: disable_action_btn
                    })}
                    onClick={e => this.handleFolderAction(e)}
                  >
                    {shared_folder_btn_txt}
                  </Button>
                  <Button className="cancel-btn" onClick={() => this.handleCloseModal()}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
        <FolderTable
          location={this.props.location}
          table_header="My Folders"
          folder_icon="folder"
          personalFolders
          folders={this.props.personal_folders}
          addFolder={this.props.openAddFolderMenu}
        />
        {!_.isNil(this.props.user.team_id) ? (
          <FolderTable
            location={this.props.location}
            table_header="Shared Folders"
            folder_icon="folder_shared"
            sharedFolders
            folders={this.props.shared_folders}
            addFolder={this.props.openShareModal}
          />
        ) : null}
      </div>
    );
  }
}

// classname to apply to top level container
Folders.className = 'Folders-menu';

Folders.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ user_folder, errors, teams, current_user }) => {
  const team_members = teams.all_team_members
    .reduce((mem, member) => {
      if (member.id !== current_user.user.id) {
        mem.push({
          value: member.id,
          label: member.email
        });
      }
      return mem;
    }, [])
    .sort((a, b) => {
      const label_a = a.label.toLowerCase();
      const label_b = b.label.toLowerCase();
      if (label_a < label_b) {
        return -1;
      } else if (label_a > label_b) {
        return 1;
      }
      return 0;
    });

  return {
    folders_isReady: user_folder.isReady,
    folders_isFetching: user_folder.isFetching,
    isfetching_teams: teams.isFetching,
    personal_folders: user_folder.personal_folders,
    shared_folders: user_folder.shared_folders,
    add_folder_menu_open: user_folder.add_folder_menu_open,
    delete_confirm_open: user_folder.delete_confirm_open,
    copy_folder_menu_open: user_folder.copy_folder_menu_open,
    shared_folder_add:
      user_folder.shared_menu === 'add_shared' && user_folder.share_folder_menu_open,
    shared_folder_update:
      user_folder.shared_menu === 'update_shared' && user_folder.share_folder_menu_open,
    selected_folder: user_folder.selected_folder,
    new_folder_being_added: user_folder.new_folder_being_added,
    user: current_user.user,
    team_members,
    current_user,
    errors
  };
};

export default connect(mapStateToProps, {
  removeUserFolder,
  fetchFolders,
  addUserFolder,
  addBanner,
  fetchDocuments,
  addDocumentsToFolder,
  closeCopyFolderModal,
  closeDeleteModal,
  addSharedFolder,
  addSharedFolderUsers,
  closeShareModal,
  fetchAllTeamMembers,
  openShareModal,
  updateSharedFolderUsers,
  openAddFolderMenu,
  closeAddFolderMenu,
  clearSelectedFolder,
  changeSelectedFolder
})(Folders);
