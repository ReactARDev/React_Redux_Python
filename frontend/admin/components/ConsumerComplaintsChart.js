import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchInsightsCsv } from '../../shared/actions';
import d3 from 'd3';

class ConsumerComplaintsChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }

  componentDidMount() {
    this.props.fetchInsightsCsv({ slug: 'consumer-complaints' }).then(res => {
      const values = res.raw_data.tuples.map(tup => {
        return {
          label: tup[0],
          value: tup[1]
        };
      });
      this.setState({ data: values });
    });
  }
  //label: tup[0].length > 25 ? tup[0].slice(0,25) + "..." : tup[0],
  //return d.slice(0,4);
  render() {
    if (!this.state.data) {
      return null;
    }

    const chart_data = {};
    chart_data.key = 'years_on_agenda';
    chart_data.values = this.state.data;

    const data = [];
    data.push(chart_data);

    return (
      <div className="cfpb-years-on-agenda card-container">
        <h2>Consumer Complaints</h2>
        <NVD3Chart
          id=""
          type="discreteBarChart"
          datum={data}
          showControls={false}
          showLegend={false}
          x="label"
          y="value"
          tooltips={false}
          transitionDuration={350}
          xAxis={{
            rotateLabels: -45,
            tickFormat: d => {
              return d.length > 15 ? d.slice(0, 15) + '...' : d;
            }
          }}
          yAxis={{
            tickFormat: d => {
              return d;
            }
          }}
          valueFormat={d3.format('f')}
          reduceXTicks={false}
          margin={{ bottom: 80 }}
          tooltip={{
            contentGenerator: d => {
              return '<p>' + d.data.label + '  ' + '<b>' + d.data.value + '</b></p>';
            }
          }}
        />
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {};
};

const ReduxConsumerComplaintsChart = connect(mapStateToProps, {
  fetchInsightsCsv
})(ConsumerComplaintsChart);

export default ReduxConsumerComplaintsChart;
