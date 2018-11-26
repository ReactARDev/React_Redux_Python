import React from 'react';
import moment from 'moment';

const KeyDates = props => {
  const document = props.document;
  const rule = document.rule || {};
  const dateFormat = 'MM/DD/YYYY';
  const labelFirst = props.labelFirst || false;
  const labelSuffix = props.labelSuffix || '';

  const dates = [];

  if (rule.comments_close_on) {
    const temp = [];
    temp.push(
      <div className="date" key="ccd">
        {moment(rule.comments_close_on).format(dateFormat)}
      </div>
    );
    temp.push(<div className="label" key="cc">{`Comments close${labelSuffix}`}</div>);

    if (labelFirst) {
      temp.reverse();
    }
    dates.push(...temp);
  }

  if (rule.effective_on) {
    const temp = [];
    temp.push(
      <div className="date" key="eod">
        {moment(rule.effective_on).format(dateFormat)}
      </div>
    );
    temp.push(<div className="label" key="eo">{`Effective${labelSuffix}`}</div>);

    if (labelFirst) {
      temp.reverse();
    }
    dates.push(...temp);
  }

  return (
    <div className="key-dates">
      {dates}
    </div>
  );
};

export default KeyDates;
