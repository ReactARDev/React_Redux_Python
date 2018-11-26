import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';
import trunc from 'trunc-html';
import { navigateSummary } from '../utils/navigate';
import { examine_error } from '../utils/errors';
import {
  addUserFolder,
  fetchFolders,
  changeSelectedFolder,
  fetchDocuments,
  clearSelectedFolder,
  addDocumentsToFolder,
  closeFolderMenu,
  clearSelectedItems,
  changeDocumentView,
  clearFolderDocuments,
  clearErrors,
  addError
} from '../../shared/actions';
import classnames from 'classnames';
import { safe_analytics } from '../../shared/utils/analytics';
import {
  getSelectedDocuments,
  clearSelectedDocsAndReset,
  getSelectedDocids
} from '../utils/getSelected';

class FolderMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addFolderView: false,
      selectedFolderView: false,
      docsAddedView: false,
      user_folder_permission: {}
    };
  }

  componentWillMount() {
    this.props.fetchFolders();
  }

  componentWillReceiveProps(nextProps) {
    //if user selects diffrent folder, show documents of new folder, clear the old
    if (
      !_.isEqual(this.props.user_folder.selected_folder, nextProps.user_folder.selected_folder) &&
      !_.isEmpty(this.props.user_folder.selected_folder)
    ) {
      this.props.clearFolderDocuments();
    }

    if (!_.isEmpty(nextProps.shared_folder_permissions)) {
      const user_folder_permission = {};
      nextProps.shared_folder_permissions.forEach(shared_folder => {
        if (!user_folder_permission[shared_folder.folder_id]) {
          if (shared_folder.user_id === nextProps.current_user.user.id) {
            user_folder_permission[shared_folder.folder_id] = {
              owner: nextProps.user_folder.selected_folder === nextProps.current_user.user.id,
              editor: shared_folder.editor,
              viewer: shared_folder.viewer
            };
          }
        }
        this.setState({
          user_folder_permission: {
            ...this.state.user_folder_permission,
            ...user_folder_permission
          }
        });
      });
    }
  }

  handleFolderAdd(e) {
    e.preventDefault();

    safe_analytics('default', 'Personalization', 'Create Folder');

    if (
      _.trim(this.refs.new_folder_name.value).length !== 0 &&
      !this.props.user_folder.new_folder_being_added
    ) {
      this.props.addUserFolder(this.refs.new_folder_name.value).then(folder => {
        this.props.changeSelectedFolder(folder);
        this.props.clearFolderDocuments();
        this.setState({ selectedFolderView: true, addFolderView: false });
        this.props.fetchFolders();
      });
    }
  }

  handleDocumentAdd(e) {
    e.preventDefault();
    const selected_documents = getSelectedDocuments(
      this.props.current_view.selected_items,
      this.props.current_view.id
    );

    safe_analytics('default', 'Doc Action', 'Add to Folder');

    const folder_id = this.props.user_folder.selected_folder.id;
    //verify no selected document is already exsistant in folder
    const docs_in_folder = _.get(
      this.props.user_folder.documents,
      ['publication_date', 'documents'],
      []
    );
    const conflict_errs = [];

    for (const doc of docs_in_folder) {
      for (let i = 0; i < selected_documents.length; i++) {
        if (doc.id === selected_documents[i].id) {
          const shortTitle = trunc(doc.title, 20).text;
          conflict_errs.push({
            response: JSON.stringify({ errors: "'" + shortTitle + "' already in folder" }),
            status: 409
          });
        }
      }
    }
    if (!_.isEmpty(conflict_errs)) {
      this.props.addError(conflict_errs, 'folders');
    }
    const selected_ids = this.props.location.query.overlay
      ? [this.props.current_view.id]
      : getSelectedDocids(this.props.current_view.selected_items);
    this.props.addDocumentsToFolder(selected_ids, folder_id).then(() => {
      this.props.fetchDocuments({ folder_id });
      this.setState({ docsAddedView: true });
      if (_.isEmpty(this.props.errors.folders)) {
        if (this.props.location.query.overlay) {
          this.props.closeFolderMenu();
        } else {
          clearSelectedDocsAndReset(this.props, this.context.router);
        }
      }
    });
  }

  handleReturnView(e) {
    e.preventDefault();
    if (this.state.addFolderView) {
      this.setState({ addFolderView: false });
    } else if (this.state.selectedFolderView) {
      const { query } = this.props.location;
      this.setState({ selectedFolderView: false, docsAddedView: false });

      if (_.isNil(query.folder_id)) {
        this.props.clearSelectedFolder();
      }
    }

    if (!_.isEmpty(this.props.errors.folders)) {
      this.props.clearErrors('folders');
    }
  }

  navigateSummary(id, overlay = '') {
    navigateSummary(this.props.location, this.context.router, id, overlay);
  }

  closeFolderDropdown(e) {
    const { query } = this.props.location;
    e.preventDefault();
    this.props.closeFolderMenu();
    if (_.isNil(query.folder_id)) {
      this.props.clearSelectedFolder();
    }
  }

  renderErrors() {
    const errors = this.props.errors || {};
    if (errors.folders && errors.folders.length > 0) {
      const e = this.props.errors.folders[0];

      return (
        <div
          className="folder-dropdown-error-container"
          onClick={event => this.handleReturnView(event)}
          ref="folder_error_box"
        >
          {examine_error(e, 'folders').text}
        </div>
      );
    }
    return null;
  }

  render() {
    const errors = this.renderErrors();

    const user_folders_or_docs = [];
    //retrieve and render all user folers
    if (
      this.props.user_folder.isReady &&
      !this.state.selectedFolderView &&
      !this.state.addFolderView
    ) {
      const folders = [
        ...this.props.user_folder.personal_folders,
        ...this.props.user_folder.shared_folders
      ];
      const sorted_folders = _.orderBy(folders, [folder => folder.name.toLowerCase()]);

      for (const folder of sorted_folders) {
        const folder_click = e => {
          e.preventDefault();
          this.props.changeSelectedFolder(folder);
          this.props.fetchDocuments({ folder_id: folder.id });
          this.setState({ selectedFolderView: true });
        };

        const shortFolderName = trunc(folder.name, 50).text;
        if (shortFolderName !== 'Bookmarked' && shortFolderName !== 'Read') {
          user_folders_or_docs.push(
            <div className="folder-item" key={folder.id} onClick={folder_click}>
              <i className="material-icons folder-icon">folder</i>
              <li className="folder" key={folder.id} title={folder.name}>
                {shortFolderName}
              </li>
            </div>
          );
        }
      }
    }

    let folder_title = (
      <div className="folder-dropdown-header">
        <h1 className="folder-menu-title">Compliance.ai Folders</h1>
        <i
          className="material-icons folder-dropdown-close"
          title="close"
          onClick={e => this.closeFolderDropdown(e)}
        >
          close
        </i>
      </div>
    );

    const shortFolderName = trunc(this.props.user_folder.selected_folder.name, 20).text;
    //handle all menu view logic
    if (this.state.addFolderView || this.state.selectedFolderView) {
      let input_or_folder_title = (
        <h1
          className="folder-menu-title header-center"
          title={this.props.user_folder.selected_folder.name}
        >
          {shortFolderName}
        </h1>
      );

      let done_or_close_icon = (
        <i
          className="material-icons folder-dropdown-close"
          onClick={e => this.closeFolderDropdown(e)}
        >
          close
        </i>
      );

      const handleKeyUp = e => {
        e.preventDefault();

        if (e.keyCode === 13) {
          this.handleFolderAdd(e);
        }
      };
      // add folder view header logic
      if (this.state.addFolderView) {
        input_or_folder_title = (
          <input
            className="folder-input"
            placeholder="Untitled Folder"
            onKeyUp={handleKeyUp}
            autoFocus
            ref="new_folder_name"
          />
        );

        done_or_close_icon = (
          <i
            className="material-icons folder-done-icon"
            title="Add New Folder"
            onClick={e => this.handleFolderAdd(e)}
          >
            done
          </i>
        );

        if (_.isEmpty(this.props.errors.folders)) {
          user_folders_or_docs.push(
            <p key="folder-menu-message" className="folder-menu-message">
              Create a new folder in Compliance.ai Folders
            </p>
          );
        }
      }

      folder_title = (
        <div className="folder-dropdown-header">
          <i
            className="material-icons folder-back-arrow"
            title="back"
            onClick={e => this.handleReturnView(e)}
          >
            arrow_back
          </i>
          {input_or_folder_title}
          {done_or_close_icon}
        </div>
      );

      //Selected folder documents view
      if (
        this.state.selectedFolderView &&
        this.props.user_folder.isReady &&
        _.isEmpty(this.props.errors.folders)
      ) {
        const documents = _.get(
          this.props.user_folder.documents,
          ['publication_date', 'documents'],
          []
        );

        for (const document of documents) {
          const document_click = e => {
            e.preventDefault();
            const overlay =
              document.category === 'Mainstream News' ? 'news-overlay' : 'pdf-overlay';
            this.navigateSummary(document.id, overlay);
          };

          const doc_title = trunc(document.title, 100).text;
          user_folders_or_docs.push(
            <div className="folder-document-item" key={document.id} onClick={document_click}>
              <li key={document.id}>{doc_title}</li>
            </div>
          );
        }
      }
    }

    let folder_controllers = <div className="folder-spacer" />;
    //handle all folder-dropdown-menu footer controller logic
    let add_to_folder_option = null;
    if (
      this.state.selectedFolderView &&
      _.isEmpty(this.props.errors.folders) &&
      !this.state.docsAddedView &&
      !(
        this.state.user_folder_permission[this.props.user_folder.selected_folder.id] &&
        this.state.user_folder_permission[this.props.user_folder.selected_folder.id].viewer
      )
    ) {
      add_to_folder_option = (
        <button
          className="add-folder-control"
          title="Add Selected Documents"
          onClick={e => this.handleDocumentAdd(e)}
        >
          <i className="material-icons">done</i>
          <span className="folder-btn-name">Add to Folder</span>
        </button>
      );
    }

    let add_folder_view = null;

    const { query } = this.props.location;

    //XXX: remove when it comes time to allow for nested folders
    if (
      !this.state.selectedFolderView &&
      !this.state.addFolderView &&
      _.isEmpty(this.props.errors.folders) &&
      _.isNil(query.folder_id)
    ) {
      add_folder_view = (
        <a
          className="new-folder-control"
          title="Add New Folder"
          onClick={() => this.setState({ addFolderView: true })}
        >
          New Folder
        </a>
      );
    }

    folder_controllers = (
      <div className="folder-controllers">
        {add_to_folder_option}
        {add_folder_view}
      </div>
    );

    let isLoading = false;

    // show the loading overlay if documents are not ready, or if XXX
    if (this.props.user_folder.isFetching) {
      isLoading = true;
    }

    const folderMenuClasses = {
      'folder-list-container': true,
      'loading-overlay-light': true,
      'loading-active': isLoading
    };

    return (
      <div className="folder-scroll-container">
        {errors}
        {folder_title}
        <ul className={classnames(folderMenuClasses)}>{user_folders_or_docs}</ul>
        {folder_controllers}
      </div>
    );
  }
}

FolderMenu.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    user_folder: state.user_folder,
    current_view: state.current_view,
    documents_full: state.documents_full,
    errors: state.errors,
    shared_folder_permissions: state.user_folder.shared_folder_permissions,
    current_user: state.current_user
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchFolders: () => {
      dispatch(fetchFolders());
    },
    fetchDocuments: params => {
      dispatch(fetchDocuments(params));
    },
    addUserFolder: name => {
      return dispatch(addUserFolder(name));
    },
    changeSelectedFolder: folder => {
      dispatch(changeSelectedFolder(folder));
    },
    addError: (error, component) => {
      dispatch(addError(error, component));
    },
    addDocumentsToFolder: (doc_ids, folder_id) => {
      return dispatch(addDocumentsToFolder(doc_ids, folder_id));
    },
    clearSelectedFolder: () => {
      dispatch(clearSelectedFolder());
    },
    closeFolderMenu: () => {
      dispatch(closeFolderMenu());
    },
    clearFolderDocuments: () => {
      dispatch(clearFolderDocuments());
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    },
    clearErrors: component => {
      dispatch(clearErrors(component));
    }
  };
};

const ReduxFolderMenu = connect(mapStateToProps, mapDispatchToProps)(FolderMenu);

export default ReduxFolderMenu;
