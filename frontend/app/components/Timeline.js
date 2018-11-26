import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DocumentList from './DocumentList';
import Waypoint from 'react-waypoint';
import _ from 'lodash';

class Timeline extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
    this.handleListScroll(); // make sure there is always a sticky header

    // logic to scroll to today marker on first page load and change of filter
    if (!this.props.documents.isFetching && this.props.current_view.first_timeline_view) {
      const dlsc = document.querySelector('.document-list-scrolling-container');
      const today_el = document.querySelector('.today');
      const month = document.querySelector('.month');

      if (dlsc && today_el && month) {
        const month_height = month.offsetHeight;

        dlsc.scrollTop = today_el.offsetTop - month_height * 2;

        this.props.setFirstTimelineView(false);
      }
    }
  }

  handleListScroll(e) {
    const dlsc = document.querySelector('.document-list-scrolling-container');

    if (!dlsc) {
      return;
    }

    const containerTop = dlsc.getBoundingClientRect().top;

    const months = document.querySelectorAll('.document-list .month') || [];

    let topMonthEl = null;
    let topMonthPos = -Infinity;

    for (const month of months) {
      month.classList.remove('sticky');
      const pos = month.getBoundingClientRect().top;

      // find the header closest to the top of the scroll area
      if (pos <= containerTop && pos > topMonthPos) {
        topMonthEl = month;
        topMonthPos = pos;
      }
    }

    if (topMonthEl) {
      topMonthEl.classList.add('sticky');
    }
  }

  render() {
    const documents = { items: this.props.documents.combined_list };

    const handleWaypointEnter = (e, position) => {
      // react-waypoint also calls this method on mount with no event attached
      // ignore this so we don't do extra fetches
      if (!e.event) {
        return;
      }

      // also ignore on first page load, if fetching, or if already expanding the list
      if (
        this.props.documents.combined_list.length === 0 ||
        !this.props.documents.isReady ||
        this.props.current_view.expand_list
      ) {
        return;
      }

      if (e.currentPosition === 'inside') {
        const combined_list = this.props.documents.combined_list;
        if (position === 'bottom') {
          // stash the reference for the document so we can make sure to scroll to it after
          // fetching documents after
          const last_doc = combined_list[combined_list.length - 1];
          const last_doc_ref = last_doc.id + last_doc.sort_basis + last_doc.sort_date;

          this.props.changeExpandStatus('after', { last_doc_ref });
        } else if (position === 'top') {
          // stash the reference for the document so we can make sure to scroll to it after
          // fetching documents after

          const first_doc = combined_list[0];
          const first_doc_ref = first_doc.id + first_doc.sort_basis + first_doc.sort_date;

          this.props.changeExpandStatus('before', { first_doc_ref });
        }
        // this.context.router.push lets us hit componentWillReceiveProps
        const { pathname } = this.props.location;
        this.context.router.push({
          pathname,
          query: this.props.location.query
        });
      }
    };
    return (
      <div
        className="document-list-scrolling-container"
        onScroll={_.throttle(this.handleListScroll, 200, { trailing: false })}
      >
        <Waypoint onEnter={e => handleWaypointEnter(e, 'top')} threshold={0.2} />
        <DocumentList
          documents={documents}
          count={this.props.documents.count}
          current_view={this.props.current_view}
          agencies={this.props.agencies}
          user_folder={this.props.user_folder}
          location={this.props.location}
          last_doc_ref={this.props.last_doc_ref}
          first_doc_ref={this.props.first_doc_ref}
        />
        <Waypoint onEnter={e => handleWaypointEnter(e, 'bottom')} threshold={0.2} />
      </div>
    );
  }
}

Timeline.contextTypes = {
  router: PropTypes.object
};

const mapStateToProps = state => {
  return {
    documents: state.documents,
    agencies: state.agencies,
    current_view: state.current_view,
    user_folder: state.user_folder
  };
};

const ReduxTimeline = connect(mapStateToProps)(Timeline);

export default ReduxTimeline;
