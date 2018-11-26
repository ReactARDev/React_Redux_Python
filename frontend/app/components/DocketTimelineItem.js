import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import _ from 'lodash';
import classNames from 'classnames';
import { category_from_api } from '../../shared/utils/category';
import { navigateSummary } from '../utils/navigate';
import { connect } from 'react-redux';

const timeline_type_map = {
  publication_date: 'Pub. Date',
  'rule.effective_on': 'Effective Date',
  'rule.comments_close_on': 'Comments Due'
};

const DocketTimelineItem = (props, context) => {
  const document = props.document;
  const timeline_info = props.timelineInfo;
  const agencies = _.map(document.agencies, 'short_name').sort().join(', ');
  const timeline_type = timeline_type_map[timeline_info.sort_basis];

  const classes = classNames({
    'gap-above': props.gapAbove
  });

  const click_handler = e => {
    e.preventDefault();
    const { query } = props.location;
    const overlay = query.overlay ? query.overlay : '';

    navigateSummary(props.location, context.router, document.id, overlay, 'summary-with-back');
  };

  let current_fragment = null;

  if (document.id === props.currentDocumentId) {
    current_fragment = <div className="current-text">Current Document</div>;
  }

  return (
    <li className={classes}>
      <div className="well" onClick={click_handler}>
        <div className="docket-timeline-fragment">
          <div>
            {moment(timeline_info.sort_date).format('MM/DD/YYYY')}
          </div>
          <div>
            {agencies}
          </div>
          <div>
            {category_from_api(document.category)}
          </div>
          <div className="doc-title">
            {document.title}
          </div>
          {current_fragment}
        </div>
      </div>
      <div className="timeline-type">
        {timeline_type}
      </div>
    </li>
  );
};

DocketTimelineItem.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    current_view: state.current_view
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxDocketTimelineItem = connect(mapStateToProps, mapDispatchToProps)(DocketTimelineItem);

export default ReduxDocketTimelineItem;
