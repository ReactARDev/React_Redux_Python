import React from 'react';
import _ from 'lodash';
import moment from 'moment';
import FolderListItem from './FolderListItem';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { clearErrors, clearSelectedFolder } from '../../shared/actions';
import { safe_analytics } from '../../shared/utils/analytics';
import NewFeatureTooltip from './NewFeatureTooltip';

class FolderTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sortField: 'updated_at',
      sortDirection: 'descending',
      plus_icon_selected: false,
      sortedFolders: []
    };
  }

  componentWillMount() {
    if (!_.isEmpty(this.props.errors)) {
      this.props.clearErrors('folder_share');
    }
    const sortedFolders = this.sortedFolders(this.props.folders);
    this.setState({ sortedFolders });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.folders_isReady) {
      const sortedFolders = this.sortedFolders(nextProps.folders);
      this.setState({ sortedFolders });
    }
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
    if (this.state.sortDirection === 'descending') {
      return <i className="material-icons header-arrow active">keyboard_arrow_down</i>;
    }
    return <i className="material-icons header-arrow active">keyboard_arrow_up</i>;
  }

  sortedFolders(folders = [], sortField = 'updated_at', sortDirection = 'descending') {
    folders = folders ? [...folders] : [];
    if (sortField === 'updated_at') {
      return folders.sort((a, b) => {
        if (sortDirection === 'descending') {
          return moment(new Date(b.updated_at)).diff(moment(new Date(a.updated_at)));
        }
        return moment(new Date(a.updated_at)).diff(moment(new Date(b.updated_at)));
      });
    }
    if (sortField === 'name' || sortField === 'owner') {
      return folders.sort((a, b) => {
        if (sortDirection === 'descending') {
          if (a[sortField].toUpperCase() < b[sortField].toUpperCase()) {
            return 1;
          }
          return -1;
        }
        if (b[sortField].toUpperCase() < a[sortField].toUpperCase()) {
          return 1;
        }
        return -1;
      });
    }
    return folders;
  }

  handleSortClick = (folders, sortField) => {
    if (sortField !== this.state.sortField) {
      if (sortField === 'updated_at') {
        const sortDirection = 'descending';
        const sortedFolders = this.sortedFolders(folders, sortField, sortDirection);
        this.setState({ sortedFolders, sortField, sortDirection });
      } else {
        const sortDirection = 'ascending';
        const sortedFolders = this.sortedFolders(folders, sortField, sortDirection);
        this.setState({ sortedFolders, sortField, sortDirection });
      }
    } else if (this.state.sortDirection === 'descending') {
      const sortDirection = 'ascending';
      const sortedFolders = this.sortedFolders(folders, sortField, sortDirection);
      this.setState({ sortedFolders, sortField, sortDirection });
    } else {
      const sortDirection = 'descending';
      const sortedFolders = this.sortedFolders(folders, sortField, sortDirection);
      this.setState({ sortedFolders, sortField, sortDirection });
    }
  };

  handleAddFolder = () => {
    let menu = null;
    if (this.props.sharedFolders) {
      safe_analytics('default', 'Team Edition', 'Button click', 'New shared folder');
      menu = 'add_shared';
      this.props.clearSelectedFolder();
    }
    this.props.addFolder(menu);
  };
  render() {
    return (
      <div className="folders-table-container">
        <h3>{this.props.table_header}</h3>
        <i className="material-icons" title="New Folder" onClick={() => this.handleAddFolder()}>
          create_new_folder
        </i>
        <table className="table table-hover">
          <thead>
            <tr>
              <th onClick={() => this.handleSortClick(this.props.folders, 'name')}>
                Name
                {this.getIcons('name')}
              </th>
              <th className="owner-header">Owner</th>
              <th onClick={() => this.handleSortClick(this.props.folders, 'updated_at')}>
                Updated Date
                {this.getIcons('updated_at')}
              </th>
              <th>
                Actions{' '}
                {this.props.folders.length > 2 &&
                !this.props.sharedFolders &&
                _.isNil(this.props.user.team_id) ? (
                  <i
                    id="folder-actions-icon"
                    className="material-icons add-circle"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.setState({ plus_icon_selected: true });
                    }}
                  >
                    add_circle
                  </i>
                ) : null}
                {this.state.plus_icon_selected ? (
                  <td>
                    <NewFeatureTooltip
                      targetId="folder-actions-icon"
                      content={`Upgrade to Team Edition to share your folders. Contact us at:`}
                      featureId="folder-actions-header"
                      handleClick={() => this.setState({ plus_icon_selected: false })}
                      folderPopUp
                    />
                  </td>
                ) : null}
              </th>
            </tr>
          </thead>
          <tbody>
            {this.state.sortedFolders.map((folder, i) => {
              return (
                <FolderListItem
                  key={i}
                  location={this.props.location}
                  folder={folder}
                  folder_icon={this.props.folder_icon}
                  personalFolders={this.props.personalFolders}
                  sharedFolders={this.props.sharedFolders}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

// classname to apply to top level container
FolderTable.className = 'folders-table-menu';

FolderTable.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = ({ user_folder, errors, current_user }) => {
  return {
    folders_isReady: user_folder.isReady,
    user: current_user.user,
    errors
  };
};

export default connect(mapStateToProps, {
  clearErrors,
  clearSelectedFolder
})(FolderTable);
