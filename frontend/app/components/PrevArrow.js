import React from 'react';
import _ from 'lodash';

export default props => {
  //remove arrow if on last slide
  if (_.includes(props.className, 'disabled')) {
    return <div className="emptyArrow" />;
  }

  return (
    <span {...props} className="carouselArrow">
      <i className="material-icons icon">keyboard_arrow_left</i>
    </span>
  );
};
