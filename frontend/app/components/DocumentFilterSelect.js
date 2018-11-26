import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { ControlLabel } from 'react-bootstrap';
import _ from 'lodash';

export default class DocumentFilterSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const generic_map_function = component => {
      return {
        value: component,
        label: component
      };
    };

    const component_list_for_select = this.props.components.items
      .map(this.props.custom_map_function || generic_map_function)
      .sort((a, b) => {
        // search menu options sorted seperatly
        if (!_.isNil(this.props.location.query.search_sort)) {
          return 0;
        }

        const label_a = a.label.toLowerCase();
        const label_b = b.label.toLowerCase();
        if (label_a < label_b) {
          return -1;
        } else if (label_a > label_b) {
          return 1;
        }
        return 0;
      });

    // catch a scenario where multiple filters are set, both are removed, and we end up with
    // this.props.value = [''], which causes a display glitch
    let field_value = this.props.value;
    if (
      field_value &&
      typeof field_value === 'object' &&
      field_value.length === 1 &&
      field_value[0].length === 0
    ) {
      field_value = null;
    }

    return (
      <div className="filter-select">
        <div className="filter-title">
          <ControlLabel>
            {this.props.display_name}
          </ControlLabel>
        </div>
        <Select
          name={this.props.query_arg + '_filter_select'}
          options={component_list_for_select}
          onChange={e => {
            this.props.update_function(e.map(obj => obj.value));
          }}
          key={this.props.query_arg + '_filter_select'}
          value={field_value}
          multi={this.props.multi}
          className={field_value ? 'active' : ''}
          placeholder=""
        />
      </div>
    );
  }
}

DocumentFilterSelect.contextTypes = {
  router: PropTypes.object
};
