import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { safe_analytics } from '../../shared/utils/analytics';
import { defaultStateAgencies } from '../../shared/utils/defaultSources';
import StateCode from './StateCode';
import _ from 'lodash';
import { fetchFullDocuments } from '../../shared/actions';

class StateCodeMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      menu_open: true,
      state_selected: {}
    };
  }

  componentWillMount() {
    const { query } = this.props.location;

    if (
      !_.isNil(query.citation_selected_id) &&
      !this.props.us_state.codes[query.citation_selected_id]
    ) {
      const full_doc_params = {
        id: query.citation_selected_id,
        state_code: true,
        decorate_children: true
      };
      this.props.fetchFullDocuments(full_doc_params);
    } else if (this.props.us_state.codes[query.citation_selected_id]) {
      const head_state = this.fetchStateSelected(query.citation_selected_id);
      const state_selected = defaultStateAgencies.reduce((mem, state) => {
        if (state.state_code_id === head_state.id) {
          mem = state;
        }
        return mem;
      }, {});
      this.setState({
        state_selected,
        menu_open: false
      });
      //scroll to top if head state selected
      if (~~query.citation_selected_id === head_state.id && this.refs.state_code_menu) {
        this.refs.state_code_menu.scrollTop = 0;
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { query } = nextProps.location;
    //scroll to top if head state selected
    if (this.props.us_state.codes[query.citation_selected_id]) {
      const head_state = this.fetchStateSelected(query.citation_selected_id);
      if (~~query.citation_selected_id === head_state.id && this.refs.state_code_menu) {
        this.refs.state_code_menu.scrollTop = 0;
      }
    }
  }

  fetchStateSelected(id) {
    if (!this.props.us_state.codes[id].parent) {
      return this.props.us_state.codes[id];
    }
    return this.fetchStateSelected(this.props.us_state.codes[id].parent.id);
  }

  displayStateCode(state) {
    safe_analytics('default', 'State Code Menu', 'State Code Click');

    this.setState({ state_selected: state, menu_open: false });

    const { query } = this.props.location;
    if (query.citation_selected_id) {
      this.context.router.push({
        pathname: '/state_code',
        query: {}
      });
    }
  }

  render() {
    let stateCodeMenu = null;

    if (this.state.menu_open) {
      const renderState = state => {
        //if state code id not avaliable do not render state
        if (!state.state_code_id) {
          return null;
        }

        return (
          <div
            className="state-select"
            key={state.id || state.name}
            onClick={() => this.displayStateCode(state)}
            title={state.state}
          >
            {state.name}
          </div>
        );
      };

      const states = _.sortBy(defaultStateAgencies, 'name').map(renderState);
      stateCodeMenu = <div className="state-code-select-menu">{states}</div>;
    }

    const expand_menu = !this.state.menu_open ? 'expand_more' : 'expand_less';
    const selected_state_code =
      !this.state.menu_open && !_.isEmpty(this.state.state_selected)
        ? this.state.state_selected.name
        : 'Select State';

    const handleHeaderClick = e => {
      this.context.router.push({
        pathname: '/state_code',
        query: {
          citation_selected_id: this.state.state_selected.state_code_id
        }
      });
    };

    return (
      <div className="state-code-menu-container" ref="state_code_menu">
        <h1 className="state-code-menu-header" onClick={handleHeaderClick}>
          {!_.isNil(this.props.us_state.codes[this.state.state_selected.state_code_id])
            ? this.props.us_state.codes[this.state.state_selected.state_code_id].title
            : 'State Sources'}
        </h1>
        <h5 className="state-code-menu-instructions">Select the state code below:</h5>
        <button
          className="state-code-menu-dropdown"
          onClick={() => this.setState({ menu_open: !this.state.menu_open })}
        >
          {selected_state_code}
          <i className="material-icons" aria-hidden="true">
            {expand_menu}
          </i>
        </button>
        {stateCodeMenu}
        {!_.isEmpty(this.state.state_selected) ? (
          <StateCode location={this.props.location} selected_state={this.state.state_selected} />
        ) : null}
      </div>
    );
  }
}

StateCodeMenu.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    us_state: state.us_state
  };
};

const ReduxStateCodeMenu = connect(mapStateToProps, {
  fetchFullDocuments
})(StateCodeMenu);

export default ReduxStateCodeMenu;
