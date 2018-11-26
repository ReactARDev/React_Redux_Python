import React from 'react';
import trunc from 'trunc-html';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import {
  clearErrors,
  addError,
  fetchFolders,
  renameUserFolder,
  changeSelectedFolder,
  openDeleteModal,
  openShareModal,
  openCopyFolderModal
} from '../../shared/actions';
import { explicit_filter_function } from '../utils/filter';
import { safe_analytics } from '../../shared/utils/analytics';

class FolderListItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.folder.name,
      editMode: false,
      viewer: false,
      editor: false,
      owner: false,
      shared_folder_user: {}
    };
  }

  componentWillMount() {
    const shared_folder_user = this.props.sharedFolders
      ? this.props.folder.shared_folder_users.reduce((mem, user) => {
        if (this.props.user.id === user.id) {
          mem = user;
        }
        return mem;
      }, {})
      : {};
    this.setState({
      viewer: shared_folder_user.user_permission_access === 'viewer',
      editor: shared_folder_user.user_permission_access === 'editor',
      owner: shared_folder_user.user_permission_access === 'owner'
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ name: nextProps.folder.name });
  }

  handleDelete(e, folder) {
    e.stopPropagation();
    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors('folder_share');
    }
    if (this.props.sharedFolders) {
      safe_analytics('default', 'Team Edition', 'Button click', 'Delete Folder');
    }
    this.props.changeSelectedFolder(folder);
    this.props.openDeleteModal();
  }

  handleCopy = (e, folder) => {
    e.stopPropagation();
    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors('folder_share');
    }
    if (this.props.sharedFolders) {
      safe_analytics('default', 'Team Edition', 'Button click', 'Copy Folder');
    }
    this.props.changeSelectedFolder(folder);
    this.props.openCopyFolderModal();
  };

  handleShare = folder => {
    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors('folder_share');
    }
    if (this.props.sharedFolders) {
      safe_analytics('default', 'Team Edition', 'Button click', 'Update shared folder');
    } else {
      safe_analytics('default', 'Team Edition', 'Button click', 'Share folder');
    }
    this.props.changeSelectedFolder(folder);

    const menu = !this.props.sharedFolders ? 'add_shared' : 'update_shared';
    this.props.openShareModal(menu);
  };

  handleEdit(e) {
    e.stopPropagation();
    this.props.changeSelectedFolder(this.props.folder);
    this.setState({
      editMode: true
    });

    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors('folder_share');
    }
  }

  handleFolderClick(folder) {
    this.props.changeSelectedFolder(folder);
    if (folder.name === 'Read') {
      this.context.router.push({
        pathname: '/content',
        query: { read: true, read_folder_view: true, no_skipping: true }
      });
      return;
    }

    if (folder.name === 'Bookmarked') {
      this.context.router.push({
        pathname: '/content',
        query: { bookmarked: true, no_skipping: true }
      });
      return;
    }

    explicit_filter_function(
      { selectedFolder: folder },
      this.props.location,
      this.context.router,
      {},
      this.props
    );
  }

  renameFolder(e) {
    e.stopPropagation();
    e.preventDefault();

    if (this.state.name === this.props.folder.name) {
      return;
    }

    safe_analytics('default', 'Personalization', 'Folder Name Change');

    const name = this.state.name;
    if (_.trim(name).length !== 0) {
      this.props
        .renameUserFolder(name, this.props.selected_folder.id)
        .then(folder => {
          this.props.fetchFolders(); //update page
          this.props.changeSelectedFolder(folder); //update cookie trail
          if (_.isEmpty(this.props.errors.folders)) {
            this.setState({ editMode: false });
          }
        })
        .catch(error => {
          this.props.addError(error, 'folder_share');
          this.setState({ editMode: false });
        });
    }
  }

  handleCancelEdit(e) {
    e.stopPropagation();
    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors('folder_share');
    }
    this.setState({
      editMode: false,
      name: this.props.folder.name
    });
  }

  handleChange(e) {
    e.stopPropagation();
    this.setState({ name: e.target.value });
  }

  handleKeyUp(e) {
    e.stopPropagation();
    e.preventDefault();

    if (e.keyCode === 13 && this.state.name !== this.props.folder.name) {
      this.renameFolder(e);
    }
  }

  render() {
    const folderName = () => {
      if (this.state.editMode) {
        const checkClassNames = {
          'material-icons check': true,
          disable: this.state.name === this.props.folder.name
        };
        return (
          <td className="folder-name">
            <span className="icons">
              <i className="material-icons folder-icon">{this.props.folder_icon}</i>
            </span>
            <input
              placeholder={this.state.name}
              onChange={e => this.handleChange(e)}
              onClick={e => {
                e.stopPropagation();
              }}
              onKeyUp={e => this.handleKeyUp(e)}
              autoFocus
            />
            <span className="icons">
              <i className={classnames(checkClassNames)} onClick={e => this.renameFolder(e)}>
                done
              </i>

              <i onClick={e => this.handleCancelEdit(e)} className="material-icons clear">
                clear
              </i>
            </span>
          </td>
        );
      }
      const getFolderIcon = () => {
        if (this.props.folder.name === 'Bookmarked') {
          return (
            <i className="folder-icon material-icons" aria-hidden="true">
              bookmark
            </i>
          );
        }
        if (this.props.folder.name === 'Read') {
          return (
            <i className="folder-icon material-icons" aria-hidden="true">
              remove_red_eye
            </i>
          );
        }
        return <i className="material-icons folder-icon">{this.props.folder_icon}</i>;
      };
      return (
        <td className="folder-name" title={this.props.folder.name}>
          <span className="icons">{getFolderIcon(this.props.folder.name)}</span>
          {trunc(this.props.folder.name, 25).text}
          {!this.state.viewer &&
          this.props.folder.name !== 'Bookmarked' &&
          this.props.folder.name !== 'Read' ? (
            <i onClick={e => this.handleEdit(e)} className="material-icons edit">
              mode_edit
            </i>
          ) : null}
        </td>
      );
    };

    const copyActionClasses = {
      'material-icons': true,
      disable: this.props.sharedFolders && this.state.viewer
    };
    const shareActionClasses = {
      'material-icons': true,
      disable: (this.props.sharedFolders && this.state.viewer)
    };
    const deleteActionClasses = {
      'material-icons delete': true,
      disable: this.props.sharedFolders && !this.state.owner
    };

    let share_title = 'Share Folder';

    if (shareActionClasses.disable) {
      if (_.isNil(this.props.user.team_id)) {
        share_title = 'Avaliable on Team Edition';
      } else {
        share_title = 'Owner and Editor Access Only';
      }
    } else if (this.props.sharedFolders) {
      share_title = 'Update Shared Folder';
    }

    const shared_folder_owner = this.props.sharedFolders
      ? this.props.folder.shared_folder_users.reduce((mem, user) => {
        if (user.user_permission_access === 'owner') {
          mem = user;
        }
        return mem;
      }, {})
      : this.props.user;

    return (
      <tr onClick={() => this.handleFolderClick(this.props.folder)}>
        {folderName()}
        <td>
          {!_.isEmpty(shared_folder_owner.first_name)
            ? shared_folder_owner.first_name
            : shared_folder_owner.email}
        </td>
        <td>{moment(new Date(this.props.folder.updated_at)).format('MM/DD/YYYY')}</td>
        <td className="table-icons">
          {this.props.folder.name === 'Bookmarked' || this.props.folder.name === 'Read' ? null : (
            <i
              className={classnames(copyActionClasses)}
              onClick={e => {
                e.stopPropagation();
                if (copyActionClasses.disable) {
                  return;
                }
                this.handleCopy(e, this.props.folder);
              }}
              title={copyActionClasses.disable ? 'Owner and Editor Access Only' : 'Copy Folder'}
            >
              content_copy
            </i>
          )}
          {this.props.folder.name === 'Bookmarked' || this.props.folder.name === 'Read' || _.isNil(this.props.user.team_id) ? null : (
            <i
              className={classnames(shareActionClasses)}
              onClick={e => {
                e.stopPropagation();
                if (shareActionClasses.disable) {
                  return;
                }
                this.handleShare(this.props.folder);
              }}
              title={share_title}
            >
              person_add
            </i>
          )}

          {this.props.folder.name === 'Bookmarked' || this.props.folder.name === 'Read' ? null : (
            <i
              className={classnames(deleteActionClasses)}
              onClick={e => {
                e.stopPropagation();
                if (deleteActionClasses.disable) {
                  return;
                }
                this.handleDelete(e, this.props.folder);
              }}
              title={deleteActionClasses.disable ? 'Owner Access Only' : 'Delete Folder'}
            >
              delete
            </i>
          )}
        </td>
      </tr>
    );
  }
}

FolderListItem.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ errors, user_folder, current_user }) => {
  return {
    errors,
    selected_folder: user_folder.selected_folder,
    user: current_user.user
  };
};

const ReduxFolderListItem = connect(mapStateToProps, {
  clearErrors,
  addError,
  renameUserFolder,
  changeSelectedFolder,
  fetchFolders,
  openDeleteModal,
  openShareModal,
  openCopyFolderModal
})(FolderListItem);

export default ReduxFolderListItem;
