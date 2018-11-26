import _ from 'lodash';
import moment from 'moment';

export function updateNotificationBadge(favicon, notification_status) {
  /*
    The library we use annoyingly does not have a non-numeric option for display
    to by pass this we pass a random number of notifs and style the text to the
    same color as the bkgrd
  */
  if (notification_status) {
    favicon.badge('5');
  } else {
    favicon.reset();
  }
}

export function getDates(props) {
  const retval = {};

  const last_login = _.get(props.current_user, 'user.properties.last_session_end');

  if (!last_login) {
    retval.last_login = moment.utc().subtract(6, 'days');
  } else {
    retval.last_login = moment.utc(last_login);
  }

  retval.date_from = moment.utc(retval.last_login).format('MM/DD/YYYY'); // XXX more resolution
  retval.date_to = moment.utc().format('MM/DD/YYYY'); // XXX more resolution

  //an extra day is added at the end of line just to be safe.
  retval.daysSinceLastLogin = moment(retval.date_to).diff(moment(retval.date_from), 'days') + 1;
  return retval;
}
export function fetchRecentTopicsStats(props) {
  if (typeof props.fetchTopicsStats === 'function') {
    props.fetchTopicsStats();
  }
}
export function fetchRecent(props) {
  const user_agencies = {};

  for (const agency of props.agencies.followed_agencies) {
    user_agencies[agency.id] = agency;
  }

  const dates = getDates(props);
  const agency_ids = Object.keys(user_agencies);

  props.fetchRecentActivity(dates.daysSinceLastLogin, agency_ids).then(response => {
    //Compare latest updates to current and update notifications
    const notif_status =
      props.current_user.user.properties && props.current_user.user.properties.notif_status
        ? props.current_user.user.properties.notif_status
        : {};

    const latest_notif_stats = {};

    if (notif_status.timeline && response.total_updates !== notif_status.timeline.update_count) {
      latest_notif_stats.timeline = true;
    } else {
      latest_notif_stats.timeline = false;
    }

    let news_update_count = 0;
    response.document_stats.forEach(agency => {
      if (agency.categories.News) {
        news_update_count += agency.categories.News;
      }
    });

    if (notif_status.news && news_update_count !== notif_status.news.update_count) {
      latest_notif_stats.news = true;
    } else {
      latest_notif_stats.news = false;
    }
    props.notificationsUpdate(latest_notif_stats);
  });
}

export function update_viewed_agencies(props, agencyId) {
  const agencies_with_new_docs = props.recent_activity.document_stats.map(newAgency => {
    return newAgency.agency_id;
  });
  const agencies_viewed =
    props.current_user.user.properties && props.current_user.user.properties.agencies_viewed
      ? props.current_user.user.properties.agencies_viewed
      : {};

  const agencies_to_update = {};

  if (_.includes(agencies_with_new_docs, agencyId) && !agencies_viewed[agencyId]) {
    agencies_to_update[agencyId] = true;
  } else if (!_.includes(agencies_with_new_docs, agencyId) && agencies_viewed[agencyId]) {
    agencies_to_update[agencyId] = false;
  }

  const updated_data = {
    agencies_viewed: {
      ...agencies_viewed,
      ...agencies_to_update
    }
  };
  props.updateCurrentUser(props.user_email, { properties: updated_data });
}

export function update_user_notification_status(props, view, viewed_status) {
  const notif_status =
    props.current_user.user.properties && props.current_user.user.properties.notif_status
      ? props.current_user.user.properties.notif_status
      : {};

  const latest_notif_status = {};
  if (view === 'user_folders') {
    latest_notif_status[view] = {
      viewed_status
    };
  } else if (view === 'timeline') {
    latest_notif_status[view] = {
      viewed_status,
      update_count: props.recent_activity.total_updates
    };
  } else if (view === 'news') {
    let news_update_count = 0;

    props.recent_activity.document_stats.forEach(agency => {
      if (agency.categories.News) {
        news_update_count += agency.categories.News;
      }
    });

    latest_notif_status[view] = {
      viewed_status,
      update_count: news_update_count
    };
  }

  const updated_data = {
    notif_status: {
      ...notif_status,
      ...latest_notif_status
    }
  };

  props.updateCurrentUser(props.user_email, { properties: updated_data });
}
