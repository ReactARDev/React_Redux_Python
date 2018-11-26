import React from 'react';
import PropTypes from 'prop-types';
import DocketTimelineItem from './DocketTimelineItem';
import { connect } from 'react-redux';
import _ from 'lodash';
import moment from 'moment';

class DocketTimeline extends React.Component {
  render() {
    if (!this.props.docket_timeline.isReady) {
      return null;
    }

    const documents = this.props.docket_timeline.dockets[this.props.docketId] || [];
    const sort_options = ['publication_date', 'rule.comments_close_on', 'rule.effective_on'];
    let timeline = [];

    documents.forEach((document, index) => {
      for (const sort_basis of sort_options) {
        const sort_date = _.get(document, sort_basis);

        if (sort_date) {
          timeline.push({
            doc_index: index,
            sort_date,
            sort_basis
          });
        }
      }
    });

    timeline = timeline.sort((a, b) => {
      if (a.sort_date > b.sort_date) {
        return -1;
      } else if (a.sort_date < b.sort_date) {
        return 1;
      }
      return 0;
    });

    const timeline_fragments = [];

    let found_today = false;

    const today = moment.utc();

    let prev_date = null;
    let prev_marker_str = null;

    timeline.forEach((timeline_info, index) => {
      const document = documents[timeline_info.doc_index];
      const cur_date = moment.utc(timeline_info.sort_date);

      const gap_above = prev_date && !prev_date.isSame(cur_date, 'day');

      // show upcoming for future dates, but only at the beginning
      if (index === 0 && cur_date.isAfter(today)) {
        timeline_fragments.push(
          <li className="timeline-marker" key="upcoming">
            <div>Upcoming</div>
          </li>
        );
      }

      // if we haven't already, add a today marker if the document's
      // date matches today, if we are transitioning between a future
      // date and a past date, or if this is the first date and it's in
      // the past
      if (
        !found_today &&
        (cur_date.isSame(today, 'day') ||
          (prev_date && prev_date.isAfter(today) && cur_date.isBefore(today)) ||
          (index === 0 && cur_date.isBefore(today)))
      ) {
        found_today = true;
        timeline_fragments.push(
          <li className="timeline-marker today" key="today">
            <div>Today</div>
          </li>
        );
        // add a time marker (e.g. 2 months ago) if the month differs
      } else if (prev_date && !prev_date.isSame(cur_date, 'month')) {
        const cur_marker_str = cur_date.fromNow();

        if (cur_marker_str !== prev_marker_str) {
          timeline_fragments.push(
            <li className="timeline-marker month" key={`marker-${index}`}>
              <div>
                {cur_date.fromNow()}
              </div>
            </li>
          );

          prev_marker_str = cur_marker_str;
        }
      }

      timeline_fragments.push(
        <DocketTimelineItem
          key={document.id + index}
          document={document}
          timelineInfo={timeline_info}
          currentDocumentId={this.props.currentDocumentId}
          gapAbove={gap_above}
          location={this.props.location}
        />
      );

      prev_date = cur_date;
    });

    return (
      <div>
        <div className="tl">
          <ul className="timeline">
            {timeline_fragments}
          </ul>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    current_view: state.current_view,
    docket_timeline: state.docket_timeline
  };
};

const mapDispatchToProps = dispatch => {
  return {};
};

const ReduxDocketTimeline = connect(mapStateToProps, mapDispatchToProps)(DocketTimeline);

export default ReduxDocketTimeline;

DocketTimeline.contextTypes = {
  router: PropTypes.object
};
