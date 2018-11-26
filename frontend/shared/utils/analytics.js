export function safe_ga(...args) {
  //  console.log('ga', typeof(ga), ...args);

  if (typeof ga === 'undefined') {
    return false;
  }

  ga(...args);

  return true;
}

export function submit_timing(start_time, category, variable, label) {
  //  console.log('ga timing', arguments);

  if (typeof ga === 'undefined' || !start_time) {
    return false;
  }

  const elapsed = Date.now() - start_time;

  ga('send', 'timing', category, variable, elapsed, label);

  return true;
}

export function safe_mixpanel_track(...args) {
  if (typeof mixpanel === 'undefined') {
    return false;
  }

  mixpanel.track(...args);

  return true;
}

// Only for events
// undefined key values are ignored in mixpanel
export function safe_analytics(title, ...args) {
  const params = [...args];
  title = (title === 'default') ? params.join(' – ') : title;

  const mxp_params = {
    hitType: 'event',
    eventCategory: params[0],
    eventAction: params[1],
    eventLabel: params[2]
  };

  const ga_success = safe_ga('send', 'event', params);
  const mxp_success = safe_mixpanel_track(title, mxp_params);

  return (ga_success && mxp_success);
}
