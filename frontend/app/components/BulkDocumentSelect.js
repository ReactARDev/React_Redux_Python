import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Checkbox } from 'react-bootstrap';
import classnames from 'classnames';
import { changeBulkSelectedItem } from '../../shared/actions';


export class BulkDocumentSelect extends React.Component {
  constructor(props) {
    super(props);
    this.state={};
  }
  render() {
    const bulkSelectClasses = {
      'bulk-select-controls': true,
      timeline: this.props.bulk === 'timeline',
      search: this.props.bulk === 'search'
    };
    const select = this.props.bulk === 'search' ?
      'select all in view' :
      'select all';
    const unselect = this.props.bulk === 'search' ?
      'unselect all in view' :
      'unselect all';
    const checkBoxLabel = this.props.current_view.bulk_docs_selected
      ? unselect : select;
    const handleCheck = e => {
      const value = !!e.target.checked;
      this.props.changeBulkSelectedItem(value, this.props.bulk);
    };
    return (
      <div className={classnames(bulkSelectClasses)}>
        <Checkbox
          onChange={handleCheck}
          checked={this.props.current_view.bulk_docs_selected}
          inline
        >
          <i className="material-icons unchecked clickable">check_box_outline_blank</i>
          <i className="material-icons checked clickable">check_box</i>
        </Checkbox>
        <label>{checkBoxLabel}</label>
      </div>
    );
  }
}

BulkDocumentSelect.contextTypes = {
  router: PropTypes.object
};
const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {
    changeBulkSelectedItem: (value, bulk) => {
      dispatch(changeBulkSelectedItem(value, bulk));
    }
  };
};
const ReduxBulkDocumentSelect = connect(mapStateToProps, mapDispatchToProps)(
  BulkDocumentSelect
);

export default ReduxBulkDocumentSelect;
