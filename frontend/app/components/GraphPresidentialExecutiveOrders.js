import React from 'react';
import NVD3Chart from 'react-nvd3';
import { connect } from 'react-redux';
import { fetchInsightsCsvBySlug } from '../../shared/actions';
import ExportImageButton from './ExportImageButton';
import InsightsGraphBase from './InsightsGraphBase';

class GraphPresidentialExecutiveOrders extends InsightsGraphBase {
  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
  }

  componentWillMount() {
    this.props.fetchInsightsCsvBySlug('presidential-action-tracker').then(res => {
      const data = {
        key: 'Presidential Orders',
        values: []
      };
      const values = res.raw_data.tuples.map(tup => {
        return { label: tup[0], value: tup[1] };
      });
      const valuesObj = values.reduce((mem, pres) => {
        mem[pres.label] = pres;
        return mem;
      }, {});
      const order = [
        'Harry S. Truman',
        'Dwight D. Eisenhower',
        'John F. Kennedy',
        'Lyndon B. Johnson',
        'Richard M. Nixon',
        'Gerald Ford',
        'Jimmy Carter',
        'Ronald Reagan',
        'George Bush',
        'William J. Clinton',
        'George W. Bush',
        'Barack Obama',
        'Donald Trump'
      ];
      const orderedValues = order.map(pres => {
        return { label: pres, value: valuesObj[pres].value };
      });
      data.values = orderedValues;
      this.setState({ data: [data] });
    });
  }

  render() {
    return (
      <div className="insights-chart">
        <div className="chart-container" ref="export_top" id='GraphPresidentialExecutiveOrders'>
          <h3>Presidential Executive Orders</h3>
          <NVD3Chart
            id="my_chart1"
            type="multiBarHorizontalChart"
            datum={this.state.data}
            x="label"
            y="value"
            valueFormatter={d => Math.round(d)}
            showControls={false}
            margin={{ left: 130 }}
            yAxis={{
              tickFormat: d => d.toFixed(0)
            }}
            tooltip={{
              valueFormatter(d) {
                return Math.round(d);
              }
            }}
          />
          <div className="label">
            Executive orders *signed* in first 100 days of presidency. Updated weekly on Sunday.
          </div>
          <ExportImageButton
            getElem={() => this.getExportElem()}
            filename="PresidentialExecutiveOrders.png"
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {};
};

export default connect(mapStateToProps, { fetchInsightsCsvBySlug })(
  GraphPresidentialExecutiveOrders
);
