import React from 'react';
import _ from 'lodash';

export default props => {
  //remove arrow if on last slide
  if (_.includes(props.className, 'disabled')) {
    if (props.news_carousel) {
      return null;
    }
    return <div className="emptyArrow" />;
  }

  return (
    <span {...props} className="carouselArrow">
      <i className="material-icons icon nextArrow">keyboard_arrow_right</i>
    </span>
  );
};
