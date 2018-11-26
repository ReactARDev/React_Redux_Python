import React from 'react';

const StepIndicator = props => {
  // IMHO, looks better without this
  /* eslint-disable space-infix-ops */
  const n = props.numSteps;
  const cur = props.curStep;
  const p = props.padding;
  const stroke = props.stroke;
  const r = props.radius - stroke;

  const steps = [];

  steps.push(<line x1={p} y1={r + stroke} x2={r * n * 2 + p * n} y2={r + stroke} key={'line'} />);
  for (let i = 0; i < n; i++) {
    let className;

    if (i < cur) {
      className = 'prev';
    } else if (i === cur) {
      className = 'active';
    } else {
      className = 'next';
    }

    const cx = r + (i + 1) * p + i * 2 * r;
    steps.push(<circle cx={cx} cy={r + stroke} r={r} className={className} key={i} />);
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={p * (n + 1) + 2 * r * n}
      height={(r + stroke) * 2}
    >
      {steps}
    </svg>
  );
};

export default StepIndicator;
