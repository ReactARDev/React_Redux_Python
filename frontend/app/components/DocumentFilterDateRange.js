import React from 'react';
import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import classnames from 'classnames';

export default class DocumentFilterDateRange extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showFromIcons: true,
      showToIcons: true
    };
  }

  componentWillMount() {
    //clear icons if values pre-exsist in filters
    if (this.props.from_value) {
      this.setState({ showFromIcons: false });
    }

    if (this.props.to_value) {
      this.setState({ showToIcons: false });
    }
  }

  render() {
    let from_value = this.props.from_value;
    let to_value = this.props.to_value;

    // skip casting with moment if they are null, because moment would return today's date
    if (from_value) {
      from_value = moment(from_value);
    }
    if (to_value) {
      to_value = moment(to_value);
    }

    const component_change_listener = (selected_date_raw, to_or_from) => {
      const selected_date = selected_date_raw
        ? selected_date_raw.format('MM/DD/YYYY')
        : selected_date_raw;
      this.props.update_function(this.props.query_arg_prefix + '_' + to_or_from, selected_date);
    };

    const component_change_before = selected_date => {
      component_change_listener(selected_date, 'to');
    };

    const component_change_after = selected_date => {
      component_change_listener(selected_date, 'from');
    };

    //Necessary blur method to auto format date input as
    //DatePicker library onChange method does not detect input value until user selects date
    const handleFromBlur = e => {
      const manually_entered_date = moment(e.target.value);
      if (!manually_entered_date.isValid()) {
        this.setState({ showFromIcons: true });
        return;
      }
      this.setState({ showFromIcons: false });
      component_change_listener(manually_entered_date, 'from');
    };
    //Necessary blur method to auto format date input as
    //DatePicker library onChange method does not detect input value until user selects date
    const handleToBlur = e => {
      const manually_entered_date = moment(e.target.value);
      if (!manually_entered_date.isValid()) {
        this.setState({ showToIcons: true });
        return;
      }
      this.setState({ showToIcons: false });
      component_change_listener(manually_entered_date, 'to');
    };

    const dateToIconClasses = {
      'material-icons date-icon': true,
      hide: !this.state.showToIcons
    };

    const dateFromIconClasses = {
      'material-icons date-icon': true,
      hide: !this.state.showFromIcons
    };

    const from_placeholder_txt = this.state.showFromIcons ? 'From' : '';
    const to_placeholder_txt = this.state.showToIcons ? 'To' : '';

    return (
      <div className="date-ranges">
        <i
          className={classnames(dateFromIconClasses)}
          onClick={() => this.setState({ showFromIcons: false })}
        >
          date_range
        </i>
        <DatePicker
          title="From"
          placeholderText={from_placeholder_txt}
          selected={from_value}
          onChange={component_change_after}
          onBlur={e => handleFromBlur(e)}
          onFocus={() => this.setState({ showFromIcons: false })}
          key={this.props.query_arg_prefix + '_from_datepicker'}
          name={this.props.query_arg_prefix + '_from_datepicker'}
          isClearable
          className={from_value ? 'active' : ''}
        />

        <i
          className={classnames(dateToIconClasses)}
          onClick={() => this.setState({ showToIcons: false })}
        >
          date_range
        </i>
        {this.props.showTo ? <span className="datepickerTo">to</span> : null}
        <DatePicker
          title="To"
          placeholderText={to_placeholder_txt}
          selected={to_value}
          onChange={component_change_before}
          onBlur={e => handleToBlur(e)}
          onFocus={() => this.setState({ showToIcons: false })}
          key={this.props.query_arg_prefix + '_to_datepicker'}
          name={this.props.query_arg_prefix + '_to_datepicker'}
          isClearable
          className={to_value ? 'active' : ''}
        />
      </div>
    );
  }
}

DocumentFilterDateRange.contextTypes = {
  router: PropTypes.object
};
