import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import {
  fetchFullDocuments,
  clearStateCode,
  changeSelectedItem,
  clearSelectedItems,
  fetchDataFromStore,
  markDocumentAsRead,
  changeDocumentView
} from '../../shared/actions';
import _ from 'lodash';
import { navigateSummary } from '../utils/navigate';
import { filter_state_code } from '../utils/stateCodeFilters';
import { Checkbox, Button } from 'react-bootstrap';
import naturalSort from 'javascript-natural-sort';

class StateCode extends React.Component {
  constructor(props) {
    super(props);

    const { query } = props.location;
    let banking_bool = true;

    if (query.citation_selected_id) {
      banking_bool = false;
    }

    this.state = {
      child_list: [],
      selectedBranches: [],
      state_head_id: props.selected_state.state_code_id,
      lastChildContainers: {},
      scrollTop: 0,
      non_banking_count: 0,
      displayBankingOnly: banking_bool,
      selectedLeaf: null,
      back_to_top_button: null
    };
  }

  componentWillMount() {
    if (
      this.props.selected_state.state_code_id &&
      !this.props.us_state.codes[this.props.selected_state.state_code_id]
    ) {
      const full_doc_params = {
        id: this.props.selected_state.state_code_id,
        state_code: true,
        decorate_children: true
      };
      this.props.fetchFullDocuments(full_doc_params);
    }

    const { query } = this.props.location;

    if (!_.isEmpty(this.props.us_state.codes) && !query.citation_selected_id) {
      this.props.clearStateCode();
    }

    /*
      Check to see if state code is loading from citation selection on right panel
      or from state selection menu, if the latter object will be empty and no
      need to build tree in this method, wait until componentWillReceiveProps to do so
    */
    if (!_.isEmpty(this.props.us_state.codes)) {
      const selected_branches = [];
      for (const raw_branch_id of Object.keys(this.props.us_state.codes)) {
        const branch_id = parseInt(raw_branch_id, 10);
        if (this.props.us_state.codes[raw_branch_id].category === 'State Code') {
          this.setState({ selectedLeaf: branch_id });
        } else {
          selected_branches.push(branch_id);
        }
      }
      //display selected citation
      this.setState({
        selectedBranches: selected_branches,
        child_list: this.fetchTreeFromProps(this.props, this.state.displayBankingOnly)
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { query } = this.props.location;

    //scroll to top if head state selected
    if (~~query.citation_selected_id === this.state.state_head_id) {
      this.refs.outer_state_code_container.scrollTop = 0;
    }

    //clear all selections and hide nonbanking on state switch
    if (_.isEmpty(nextProps.us_state.codes)) {
      this.setState({
        selectedBranches: [],
        displayBankingOnly: true
      });
      if (!_.isEmpty(this.props.current_view.selected_items)) {
        this.props.clearSelectedItems();
      }
    }

    //hide the back-to-top button if scrolled to top and is displayed
    if (this.state.scrollTop === 0 && !_.isNil(this.state.back_to_top_button)) {
      this.setState({ back_to_top_button: null });
    }

    /*
      When the user selects a citation on the right panel update the selected branches
    */
    if (!_.isEmpty(nextProps.us_state.codes) && !_.isNil(query.location_crumb_selected)) {
      const selected_branches = [];

      for (const raw_branch_id of Object.keys(nextProps.us_state.codes)) {
        const branch_id = parseInt(raw_branch_id, 10);
        if (nextProps.us_state.codes[raw_branch_id].category === 'State Code') {
          this.setState({ selectedLeaf: branch_id });
        } else {
          selected_branches.push(branch_id);
        }
      }
      this.setState({ selectedBranches: selected_branches });
    }

    // Switch state code selections while in state code view
    if (
      this.props.selected_state.state_code_id !== nextProps.selected_state.state_code_id &&
      !this.props.us_state.codes[nextProps.selected_state.state_code_id]
    ) {
      const full_doc_params = {
        id: nextProps.selected_state.state_code_id,
        state_code: true,
        decorate_children: true
      };
      this.props.fetchFullDocuments(full_doc_params);
    }
    /*
      Build the tree from top to bottom
    */

    const state_code_id = nextProps.selected_state.state_code_id;

    if (nextProps.us_state.codes && nextProps.us_state.codes[state_code_id]) {
      this.setState({
        state_head_id: state_code_id,
        child_list: this.fetchTreeFromProps(
          nextProps,
          this.state.displayBankingOnly,
          nextProps.us_state.codes[state_code_id]
        ),
        scrollTop: this.refs.outer_state_code_container.scrollTop
      });
    }
  }

  fetchTreeFromProps(
    props,
    displayBankingOnly,
    branch = this.props.us_state.codes[this.state.state_head_id]
  ) {
    if (!branch || !props.us_state.codes[branch.id]) {
      return null;
    }
    const { query } = this.props.location;
    const state_code_id = this.props.selected_state.state_code_id;
    const child_list = [];
    const children = props.us_state.codes[branch.id].children;
    const sorted_children = children.sort((a, b) => naturalSort(a.title, b.title));
    //needed for check of mixed category case for styling purposes
    const categories = _.uniq(_.map(sorted_children, 'category'));

    for (const child of sorted_children) {
      //Run root leafs through banking/non-banking state filter
      if (branch.id === state_code_id) {
        filter_state_code(this.props, child);
      }

      const childrenContainerClasses = ['state-code-children-container'];
      const chapterClasses = ['state-code-child'];
      const caretClasses = ['material-icons', 'caret-icon'];
      const listClasses = ['material-icons', 'list-icon'];
      const docClasses = ['material-icons', 'doc-icon'];
      const checkBoxClasses = ['check-box'];
      const divClasses = ['outer-border'];
      const selected_num = parseInt(query.citation_selected_id, 10);

      if (_.includes(this.state.selectedBranches, child.id) && child.category !== 'State Code') {
        caretClasses.push('show');
        listClasses.push('hide');
        chapterClasses.push('selected');
        divClasses.push('div-selected');
        chapterClasses.push('branch');
      }

      if (categories.length > 1 && child.category === 'State Code') {
        chapterClasses.push('mixed-child');
      }

      //identify selected dom element to auto scroll to
      if (child.id === selected_num) {
        divClasses.push('citation-selected');
      }

      if (selected_num === state_code_id) {
        divClasses.push('head-selected');
      }

      if (categories.length === 1 && child.category === 'State Code') {
        this.state.lastChildContainers[child.parent_id] = true;
      }

      if (this.state.lastChildContainers[child.id]) {
        childrenContainerClasses.push('last-child-container');
      }

      if (props.current_view.selected_items[child.id]) {
        docClasses.push('hide');
        checkBoxClasses.push('show');
      }

      if (child.non_banking && displayBankingOnly) {
        chapterClasses.push('hide');
        divClasses.push('hide');
      }

      const expand_menu = _.includes(caretClasses, 'show') ? 'expand_less' : 'expand_more';

      let icon = (
        <i className={classnames(caretClasses)} aria-hidden="true">
          {expand_menu}
        </i>
      );

      let list_icon = (
        <i className={classnames(listClasses)} aria-hidden="true">
          list
        </i>
      );

      let doc_icon = null;

      //House all Last-leaf node styling and logic
      if (child.category === 'State Code') {
        chapterClasses.push('last-leaf');
        const selected_citation = parseInt(query.citation_selected_id, 10);

        if (child.id === this.state.selectedLeaf && selected_citation === child.id) {
          chapterClasses.push('selected');
        }

        const handleCheck = e => {
          const value = !!e.target.checked;
          this.props.changeDocumentView('summary', child.id);
          this.props.changeSelectedItem(child.id, value);
        };

        if (!child.read) {
          chapterClasses.push('unread');
        }

        icon = (
          <div className={classnames(checkBoxClasses)}>
            <Checkbox
              className={'text-center'}
              onChange={handleCheck}
              checked={props.current_view.selected_items[child.id]}
              inline
            >
              <i className="material-icons unchecked clickable">check_box_outline_blank</i>
              <i className="material-icons checked clickable">check_box</i>
            </Checkbox>
          </div>
        );

        doc_icon = (
          <i className={classnames(docClasses)} aria-hidden="true">
            insert_drive_file
          </i>
        );

        list_icon = null;
      }

      //scroll to citation-selected element on page load
      const scrollToElement = element => {
        //if head selected on right panel, scroll to top
        if (
          element &&
          this.refs.outer_state_code_container &&
          _.includes(element.className, 'head-selected')
        ) {
          this.refs.outer_state_code_container.scrollTop = 0;
        } else if (
          element &&
          this.refs.outer_state_code_container &&
          _.includes(element.className, 'citation-selected')
        ) {
          //location arbitrarily set by designer
          this.refs.outer_state_code_container.scrollTop = element.offsetTop - 300;
        }
      };

      const open_pdf_view = element => {
        if (
          element &&
          this.refs.outer_state_code_container &&
          _.includes(element.className, 'last-leaf')
        ) {
          element.addEventListener('dblclick', () => {
            this.props.markDocumentAsRead(element.dataset.id, true);
            navigateSummary(
              this.props.location,
              this.context.router,
              element.dataset.id,
              'pdf-overlay'
            );
          });
        }
      };

      child_list.push(
        <div className={classnames(divClasses)} key={child.id} ref={scrollToElement}>
          <div
            className={classnames(chapterClasses)}
            data-id={child.id}
            ref={open_pdf_view}
            onClick={() => this.fetchAndUpdateState(child)}
          >
            <div className="icon-container">
              {icon}
              {list_icon}
              {doc_icon}
            </div>
            <li className="state-code-chapter">{child.title}</li>
          </div>
          <ul className={classnames(childrenContainerClasses)}>
            {_.includes(this.state.selectedBranches, child.id) &&
              this.fetchTreeFromProps(props, this.state.displayBankingOnly, child)}
          </ul>
        </div>
      );
    }

    //count and display number of non_banking
    //allow for toggle of non_banking agencies
    let non_banking_count = 0;
    for (const child of children) {
      if (child.non_banking) {
        non_banking_count++;
      }
    }

    this.setState({
      non_banking_count,
      displayBankingOnly
    });

    return child_list;
  }

  fetchAndUpdateState(selected) {
    //if root selected reset entire view
    if (
      selected.id === this.props.selected_state.state_code_id &&
      !_.isEmpty(this.state.selectedBranches)
    ) {
      for (const id of Object.keys(this.state.selectedBranches)) {
        delete this.state.selectedBranches[id];
      }
      for (const id of Object.keys(this.props.us_state.codes)) {
        delete this.props.us_state.codes[id];
      }
      this.props.clearSelectedItems();
    }

    //update right panel summary with selected
    if (this.props.current_view.id !== selected.id) {
      this.props.changeDocumentView('summary', selected.id);
    }

    const selected_branches = [...this.state.selectedBranches];
    let selected_leaf = this.state.selectedLeaf;
    // n.b. handle navigation and state code selections differently
    if (selected.category === 'State Code') {
      selected_leaf = selected.id;
    } else {
      if (!_.includes(this.state.selectedBranches, selected.id)) {
        selected_branches.push(selected.id);
      } else {
        //double click branch
        const selected_index = selected_branches.indexOf(selected.id);
        delete selected_branches[selected_index];
      }
    }

    //Fetch children of selected node ONLY IF not already in us_state store
    if (!this.props.us_state.codes[selected.id]) {
      const full_doc_params = { id: selected.id, state_code: true, decorate_children: true };
      this.props
        .fetchFullDocuments(full_doc_params)
        .then(() => this._updateStateCodeTree(selected, selected_leaf, selected_branches));
    } else {
      this.props
        .fetchDataFromStore()
        .then(() => this._updateStateCodeTree(selected, selected_leaf, selected_branches));
    }
  }

  _updateStateCodeTree = (selected, selected_leaf, selected_branches) => {
    //keep scroll in same position post render
    if (this.refs.outer_state_code_container) {
      this.refs.outer_state_code_container.scrollTop = this.state.scrollTop;
    }

    /*
      Build the tree from top to bottom
    */
    this.setState({
      child_list: this.fetchTreeFromProps(this.props, this.state.displayBankingOnly),
      selectedLeaf: selected_leaf,
      selectedBranches: selected_branches,
      scrollTop: this.refs.outer_state_code_container.scrollTop
    });

    this.context.router.push({
      pathname: '/state_code',
      query: {
        citation_selected_id: selected.id,
        location_crumb_selected: null
      }
    });
  };

  render() {
    const { query } = this.props.location;
    const isFectchingLeaves =
      query.citation_selected_id !== this.props.selected_state.state_code_id;

    const stateCodeContainerClasses = {
      'outer-state-code-container': true,
      'loading-overlay-light': true,
      'loading-active': this.props.us_state.isFetching && !isFectchingLeaves
    };

    const show_hide =
      this.state.displayBankingOnly || this.state.non_banking_count < 1 ? 'Show' : 'Hide';

    const non_banking_button = (
      <Button
        className="state-code-nonBank-btn btn-sm"
        onClick={() =>
          this.setState({
            child_list: this.fetchTreeFromProps(this.props, !this.state.displayBankingOnly)
          })
        }
      >
        {show_hide} Non-Banking Related ({this.state.non_banking_count})
      </Button>
    );

    const showBacktoTop = e => {
      e.preventDefault();

      this.setState({
        back_to_top_button: (
          <Button
            className="state-code-top-btn btn-sm"
            onClick={() => {
              this.refs.outer_state_code_container.scrollTop = 0;
            }}
          >
            Back to Top
          </Button>
        )
      });
    };

    return (
      <div
        ref="outer_state_code_container"
        className={classnames(stateCodeContainerClasses)}
        onScroll={showBacktoTop}
      >
        <div ref="inner_state_code_container" className="inner-state-code-container">
          <ul className="state-code-children-container">
            <div className="border-cap" />
            {this.state.child_list}
            {this.state.non_banking_count > 0 ? non_banking_button : null}
            {this.state.back_to_top_button}
          </ul>
        </div>
      </div>
    );
  }
}

StateCode.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    us_state: state.us_state,
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchFullDocuments: params => {
      return dispatch(fetchFullDocuments(params));
    },
    clearStateCode: () => {
      dispatch(clearStateCode());
    },
    changeSelectedItem: (id, value) => {
      dispatch(changeSelectedItem(id, value));
    },
    clearSelectedItems: () => {
      dispatch(clearSelectedItems());
    },
    markDocumentAsRead: (ids, read_or_unread) => {
      dispatch(markDocumentAsRead(ids, read_or_unread));
    },
    fetchDataFromStore: doc_id => {
      return dispatch(fetchDataFromStore(doc_id));
    },
    changeDocumentView: (page, id) => {
      dispatch(changeDocumentView(page, id));
    }
  };
};

const ReduxStateCode = connect(mapStateToProps, mapDispatchToProps)(StateCode);

export default ReduxStateCode;
