import _ from 'lodash';

// data quality for these is inadequate, so we want to skip them on our timeline view
// ids are DOJ, DOL, EBSA
export const agencies_skipped_on_timeline = [268, 271, 131];

export function skippedAgencyOnly(selections) {
  //store those selected as proper type in array
  const selected_only = [];
  for (const agency_id of Object.keys(selections)) {
    if (selections[agency_id]) {
      const selection_id = parseInt(agency_id, 10);
      selected_only.push(selection_id);
    }
  }
  let skipped_count = 0;

  if (selected_only.length <= agencies_skipped_on_timeline.length) {
    //if all selected are skipped immediately return true
    if (_.isEqual(selected_only.sort(), agencies_skipped_on_timeline.sort())) {
      return true;
    }

    for (let i = 0; i < selected_only.length; i++) {
      for (let j = i; j < agencies_skipped_on_timeline.length; j++) {
        if (selected_only[i] === agencies_skipped_on_timeline[j]) {
          skipped_count++;
        }
      }
    }
    if (skipped_count === selected_only.length) {
      return true;
    }
  }
  return false;
}

export function is_federal(agency) {
  if (agency.type === 'federal_executive' || agency.type === 'sro' || agency.type === 'federal') {
    return true;
  }

  return false;
}

export function fetchDocsByAgencyWithNotifs(props) {
  let documentsByAgencyWithNotifs;
  //Use the redux store to extract the number of followed agencies with new docs
  if (!_.isNil(props.recent_documents)) {
    const followedAgenciesById = props.agencies.followed_agencies.reduce((mem, agency) => {
      mem[agency.id] = agency;
      return mem;
    }, {});

    documentsByAgencyWithNotifs = props.recent_documents.recent_documents.reduce((mem, doc) => {
      //check if those followed agencies with new docs have already been viewed on the dashboard
      const agencies_viewed =
        props.current_user.user.properties && props.current_user.user.properties.agencies_viewed
          ? props.current_user.user.properties.agencies_viewed
          : {};

      //filter out docs not related to followed agencies
      if (!_.isNil(doc.agencies)) {
        doc.agencies.forEach(agency => {
          if (followedAgenciesById[agency.id] && !agencies_viewed[agency.id]) {
            if (_.isNil(mem[agency.id])) {
              mem[agency.id] = {
                docs: [doc],
                agencyName: agency.name,
                agencyShortName: agency.short_name
              };
            } else {
              mem[agency.id].docs.push(doc);
            }
          }
        });
      }
      return mem;
    }, {});
  }
  return documentsByAgencyWithNotifs;
}
