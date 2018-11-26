import moment from 'moment';
import _ from 'lodash';

// parameters used for the graph API call
export const INSIGHTS_PARAMS = {
  act_enforcement_matrix: {
    agency_id: ['164', '573', '466']
  },
  rules_by_quarter: {
    agency_id: ['466', '80', '188', '164', '573']
  },
  rules_by_agency: {
    agency_id: ['573', '164', '466', '188', '80'],
    act_id: '3207'
  }
};

// additional parameters needed to build an equivalent search in the dashboard
const SEARCH_PARAMS = {
  act_enforcement_matrix: {},
  rules_by_quarter: {
    category: ['Rule', 'Proposed Rule']
  },
  insights_csv: {
    category: ['Enforcement']
  },
  rules_by_agency: {
    search_sort: 'date',
    autosuggest_filter: 'acts'
  }
};

const agency_id_hash = {
  CFPB: '573',
  FDIC: '164',
  SEC: '466',
  FRS: '188',
  OCC: '80',
  TREAS: '497',
  NYSE: '9030',
  FTC: '192',
  FINRA: '9015',
  FFIEC: '168',
  FINCEN: '194',
  OFAC: '203'
};

const published_from_date = aggregation => {
  let published_from;

  if (aggregation === 'rules_by_quarter' || aggregation === 'rules_by_agency') {
    // search from the beginning of the current quarter three years ago
    const now = moment.utc();
    const first_month_of_quarter = (now.quarter() - 1) * 3;
    const from_date = moment
      .utc()
      .year(now.year() - 3)
      .month(first_month_of_quarter)
      .date(1);

    published_from = from_date.format('MM/DD/YYYY');
  } else if (aggregation === 'insights_csv') {
    // search from 1 year ago
    const now = moment.utc();
    const from_date = moment.utc().year(now.year() - 1);

    published_from = from_date.format('MM/DD/YYYY');
  }

  return published_from;
};

export function get_dashboard_params(
  aggregation,
  agency_name = '',
  category = '',
  published_from = '',
  published_to = ''
) {
  const params = { ...INSIGHTS_PARAMS[aggregation], ...SEARCH_PARAMS[aggregation] };

  if (!_.isEmpty(agency_name)) {
    // specify agency for agency specific graphs
    params.agency = [agency_id_hash[agency_name]];
  } else {
    // rename agency_id -> agency
    params.agency = params.agency_id;
  }
  delete params.agency_id;
  if (!_.isEmpty(category)) {
    if (category === 'Notice') {
      category = 'Register Notice';
    } else if (category === 'Final Rule') {
      category = 'Rule';
    }
    // specify category for category specific graphs
    params.category = [category];
  }

  // set published_from date
  params.published_from = !_.isEmpty(published_from)
    ? published_from
    : published_from_date(aggregation);
  params.published_to = !_.isEmpty(published_to) ? published_to : null;

  return params;
}
