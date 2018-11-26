import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchAgencySummaries } from '../../shared/actions';
import d3 from 'd3';

// Define an order for chart x values
const CHART_LABELS = ['< 1 year', '1 year', '2 years', '3 years', '4 years'];

class CFPBPieChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      years_on_agenda: null
    };
  }

  componentDidMount() {
    this.props.fetchAgencySummaries({ agency_id: 573 }).then(response => {
      this.setState({ years_on_agenda: response.agency_summaries.counts['years on agenda'] });
    });
  }

  render() {
    if (!this.state.years_on_agenda) {
      return null;
    }

    // Build an data object for NVD3Chart component
    const values = [];

    CHART_LABELS.forEach(label => {
      if (this.state.years_on_agenda[label]) {
        const chart_item = {};
        chart_item.label = label;
        chart_item.value = this.state.years_on_agenda[label];
        values.push(chart_item);
      }
    });

    const chart_data = {};
    chart_data.key = 'years_on_agenda';
    chart_data.values = values;

    const data = [];
    data.push(chart_data);

    return (
      <div className="cfpb-years-on-agenda card-container">
        <h2>Years on Agenda</h2>
        <NVD3Chart
          id=""
          type="discreteBarChart"
          datum={data}
          x="label"
          y="value"
          staggerLabels
          showValues
          tooltips={false}
          transitionDuration={350}
          yAxis={{
            tickPadding: 10,
            tickFormat: d => {
              return d;
            }
          }}
          valueFormat={d3.format('f')}
        />
        <div className="chart-footer">
          {'Years since the item first appeared in the CFPB regulatory agenda.'}
        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {};
};

const ReduxCFPBPieChart = connect(mapStateToProps, {
  fetchAgencySummaries
})(CFPBPieChart);

export default ReduxCFPBPieChart;
