import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchInsightsCsv } from '../../shared/actions';
import InsightsGraphBase from './InsightsGraphBase';
import ExportImageButton from './ExportImageButton';
import { get_dashboard_params } from '../../shared/utils/insights';
import d3 from 'd3';


class ConsumerComplaintsChart extends InsightsGraphBase {
  constructor(props) {
    super(props);
    this.state = {
      data: null
    };
  }
  handleBarClick(e) {
    const params = get_dashboard_params('rules_by_agency', e.data.label, e.data.key);
    this.props.navigateSearch(params);
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

  render() {
    if (!this.state.data) {
      return null;
    }

    const chart_data = {};
    chart_data.key = "years_on_agenda";
    chart_data.values = this.state.data;

    const data = [];
    data.push(chart_data);

    return (
      <div className="insights-chart consumer-complaints">
        <div className="chart-container" ref="export_top" id="GraphConsumerComplaints">
          <h3>Consumer Complaints</h3>
          <NVD3Chart
            id="consumer-complaints"
            type="discreteBarChart"
            datum={data}
            elementClick={e => this.handleBarClick(e)}
            showControls={false}
            showLegend={false}
            x="label"
            y="value"
            tooltips={false}
            transitionDuration={350}
            xAxis={{
              rotateLabels: -45,
              tickFormat: d => {
                return d.length > 15 ? d.slice(0,15) + "..." : d;
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
            tooltip={{ contentGenerator: d => {
              return '<p>' + d.data.label + "  " + '<b>' + d.data.value + '</b></p>';
            }
            }}
          />
          <div className="label">
            {"Complaints about consumer financial products" +
            "services, received by CFPB, over the past 12 months."}
          </div>
          <ExportImageButton
            getElem={() => this.getExportElem()}
            filename="financial-industry-trends.png"
          />

        </div>
      </div>
    );
  }
}
const mapStateToProps = state => {
  return {
  };
};

const ReduxConsumerComplaintsChart = connect(mapStateToProps, {
  fetchInsightsCsv
})(ConsumerComplaintsChart);


export default ReduxConsumerComplaintsChart;
