import React from 'react';
import _ from 'lodash';

const Heatmap = props => {
  const header_markup = [<th key="blank" />];
  const rows = [];

  props.header.forEach((cell, i) => {
    header_markup.push(
      <th key={i}>
        {cell}
      </th>
    );
  });

  const format_value = value => {
    if (_.isNaN(value)) {
      return 'N/A';
    }
    return (value * 100).toFixed(1) + '%';
  };

  const value_class = value => {
    // used for adding a background color based on value. High is 40%
    // or greater, medium, 15% or greater, low less than 15%. Also checks
    // for NaN to prevent weirdness
    if (_.isNaN(value)) {
      return 'not-available';
    } else if (value >= 0.4) {
      return 'high';
    } else if (value >= 0.15) {
      return 'medium';
    }
    return 'low';
  };

  for (const act_name of props.act_order) {
    const cells = [
      <th key="label">
        {act_name}
      </th>
    ];

    props.data[act_name].forEach((value, i) => {
      const ratio = value / props.agency_totals[i];
      cells.push(
        <td key={i} className={value_class(ratio)}>
          {format_value(ratio)}
        </td>
      );
    });

    rows.push(cells);
  }

  return (
    <table className="heatmap">
      <thead>
        <tr>
          {header_markup}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          return (
            <tr key={i}>
              {r}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Heatmap;
