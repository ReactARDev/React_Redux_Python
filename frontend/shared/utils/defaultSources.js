export const federalAgenciesBeingEvaluated = [];

export const defaultFederalAgencies = [
  {
    id: 573,
    name: 'Consumer Financial Protection Bureau',
    short_name: 'CFPB',
    type: 'federal_executive'
  },
  {
    id: 203,
    name: 'Office of Foreign Assets Control',
    short_name: 'OFAC',
    type: 'federal_executive'
  },
  {
    id: 80,
    name: 'Comptroller of the Currency',
    short_name: 'OCC',
    type: 'federal_executive'
  },
  {
    id: 164,
    name: 'Federal Deposit Insurance Corporation',
    short_name: 'FDIC',
    onboard_default: true,
    type: 'federal_executive'
  },
  {
    id: 188,
    name: 'Federal Reserve System',
    display_name: 'FRS',
    short_name: 'FRS',
    type: 'federal_executive'
  },
  {
    id: 9015,
    name: 'Financial Industry Regulatory Authority',
    short_name: 'FINRA',
    type: 'sro'
  },
  {
    id: 9030,
    name: 'New York Stock Exchange',
    short_name: 'NYSE',
    type: 'sro'
  },
  {
    id: 466,
    name: 'Securities and Exchange Commission',
    short_name: 'SEC',
    type: 'federal_executive'
  },
  {
    id: 497,
    name: 'Treasury Department',
    short_name: 'TREAS',
    type: 'federal_executive'
  },
  {
    id: 131,
    name: 'Employee Benefits Security Administration',
    short_name: 'EBSA',
    type: 'federal_executive'
  },
  {
    id: 268,
    name: 'Justice Department',
    short_name: 'DOJ',
    type: 'federal_executive'
  },
  {
    id: 192,
    name: 'Federal Trade Commission',
    short_name: 'FTC',
    type: 'federal_executive'
  },
  {
    id: 271,
    name: 'Labor Department',
    short_name: 'DOL',
    type: 'federal_executive'
  },
  {
    id: 168,
    name: 'Federal Financial Institutions Examination Council',
    short_name: 'FFIEC',
    type: 'federal_executive'
  },
  {
    id: 538,
    name: 'Executive Office of the President',
    short_name: 'EOP',
    type: 'federal_executive'
  },
  {
    id: 194,
    name: 'Financial Crimes Enforcement Network',
    short_name: 'FINCEN',
    type: 'federal_executive'
  },
  {
    id: 30002,
    name: 'Freddie Mac',
    short_name: 'FREDDIE',
    type: 'federal_executive'
  },
  {
    id: 30001,
    name: 'Fannie Mae',
    short_name: 'FANNIE',
    type: 'federal_executive'
  },
  {
    id: 30003,
    name: 'Federal Housing Administration',
    short_name: 'FHA',
    type: 'federal_executive'
  },
  {
    id: 458,
    name: 'Rural Housing Service',
    short_name: 'RHS',
    type: 'federal_executive'
  },
  {
    id: 520,
    name: 'Veterans Administration',
    short_name: 'VA',
    type: 'federal_executive'
  },
  {
    id: 77,
    name: 'Commodity Futures Trading Commission',
    short_name: 'CFTC',
    type: 'federal_executive'
  }
];
export const defaultFederalAgenciesObj = defaultFederalAgencies.reduce((mem, agency) => {
  mem[agency.id] = agency;
  return mem;
}, {});
/* eslint-disable max-len */
/*
FIXME: As of 01/12, defaultStateAgencies are being used through out the application in following way:

(1) When new user signs up for the application they are presented with all 50 states listed below

(2) When the user selects to follow states with a parent_id (ie. avaliable with data on the app refered to as 'id' below)
    they are combined with the federal agencies ids they've selected and stored in the user_agency table as was the norm

(3) When the user selects a state without a parent_id (ie. no data on the app) this relation is saved to the user_follow_entity
    table with the entity_id being the generic ES id provided on the jurisdictions table in ES (note - this has no relation to the
    parent_id mentioned above or the state_code_id need for the state navigator feature)

Ideally we'd remove all the hardcoded data provided on this file and move it to a table in the backend with ES. For the defaultFederalAgencies above
this can already be done, as it is mostly used for back up in case the ES agencies table happens to be missing some value needed in the frontend. For the
defaultStateAgencies below however, this will require some updating of the jurisdictions table in ES. As of today, the table is missing: parent_ids, a
field for state, a field for the state_code_id, and a field for fin_related_doc_ids.

If these are not added somewhere on the table, the below will be necessary to keep the frontend functioning properly.

In addition, to help standardize the state relations even further all selected states should be placed in to the user_follow_entity table. Once this is done
all the places where the agencies store is used needs to have the states store added to get access to the user's followed states.

*/
/*
  XXX: Temp flag to use when state data is needed on integration site but not production
  let HIDDEN_STATE_ID = null;
  let HIDDEN_STATE_CODE_ID = null;

  if (process.env.STATE_DATA_ENABLED) {
    HIDDEN_STATE_ID = ;
    HIDDEN_STATE_CODE_ID = ;
}
*/

export const defaultStateAgencies = [
  // XXX update when these are added to the system

  /* n.b - to be added when data is avaliable
  {
    name: 'US-Code',
    id: null,
    short_name: 'US-Code',
    state: 'United States',
    type: 'united states',
    state_code_id: null,
    fin_related_doc_ids: [],
  },*/
  {
    name: 'CA Dept of Business Oversight',
    id: 100000,
    state_code_id: null,
    jurisdiction_id: 6,
    short_name: 'CA-DBO',
    state: 'CA',
    type: 'california',
    fin_related_doc_ids: []
  },
  {
    name: 'California',
    id: 100003,
    state_code_id: 1468291,
    jurisdiction_id: 6,
    short_name: 'US-CA',
    state: 'CA',
    type: 'california',
    fin_related_doc_ids: []
  },
  {
    name: 'Delaware',
    type: 'delaware',
    short_name: 'US-DE',
    state: 'DE',
    id: 200000,
    state_code_id: 1616179,
    jurisdiction_id: 10,
    fin_related_doc_ids: [1701472]
  },
  {
    name: 'Texas',
    type: 'texas',
    short_name: 'US-TX',
    state: 'TX',
    id: 300000,
    state_code_id: 1509185,
    jurisdiction_id: 48,
    fin_related_doc_ids: [1513604]
  },
  {
    name: 'New York',
    type: 'new_york',
    short_name: 'US-NY',
    state: 'NY',
    id: 400000,
    state_code_id: 1468292,
    jurisdiction_id: 36,
    fin_related_doc_ids: []
  },
  {
    name: 'Florida',
    type: 'florida',
    short_name: 'US-FL',
    state: 'FL',
    id: 500000,
    state_code_id: 1377737,
    jurisdiction_id: 12,
    fin_related_doc_ids: [1389295, 1380378]
  },
  {
    name: 'Massachusetts',
    type: 'massachusetts',
    short_name: 'US-MA',
    state: 'MA',
    id: 600000,
    state_code_id: 1616137,
    jurisdiction_id: 25,
    fin_related_doc_ids: [1616139]
  },
  {
    name: 'Colorado',
    type: 'colorado',
    short_name: 'US-CO',
    state: 'CO',
    id: 700000,
    state_code_id: 1405155,
    jurisdiction_id: 8,
    fin_related_doc_ids: [1405360, 1405369, 1405385, 1405390, 1405534]
  },
  {
    name: 'Connecticut',
    id: 800000,
    short_name: 'US-CT',
    state: 'CT',
    type: 'connecticut',
    state_code_id: 1468721,
    jurisdiction_id: 9,
    fin_related_doc_ids: [1454360, 1453114, 1453203]
  },
  {
    name: 'Oregon',
    id: 900000,
    short_name: 'US-OR',
    state: 'OR',
    type: 'oregon',
    state_code_id: 1471760,
    jurisdiction_id: 41,
    fin_related_doc_ids: [1431296]
  },
  {
    name: 'Nevada',
    type: 'nevada',
    short_name: 'US-NV',
    state: 'NV',
    id: 1000000,
    state_code_id: 1482618,
    jurisdiction_id: 32,
    fin_related_doc_ids: [
      1482618,
      1482702,
      1482891,
      1483531,
      1485135,
      1486116,
      1486909,
      1499318,
      1505213,
      1505215,
      1505221,
      1505225,
      1505227,
      1505244,
      1505247,
      1505250,
      1505251,
      1505253,
      1505304,
      1505790,
      1505793,
      1505797,
      1505890,
      1507347,
      1505285
    ]
  },
  {
    name: 'Washington',
    type: 'washington',
    short_name: 'US-WA',
    state: 'WA',
    id: 1100000,
    state_code_id: 1596970,
    jurisdiction_id: 53,
    fin_related_doc_ids: [1560212, 1592126]
  },
  {
    name: 'Illinois',
    type: 'illinois',
    short_name: 'US-IL',
    state: 'IL',
    id: 1200000,
    state_code_id: 1597052,
    jurisdiction_id: 17,
    fin_related_doc_ids: [1604374]
  },
  {
    name: 'Missouri',
    type: 'missouri',
    short_name: 'US-MO',
    state: 'MO',
    id: 1400000,
    state_code_id: 1681738,
    jurisdiction_id: 29,
    fin_related_doc_ids: [1683394]
  },
  {
    name: 'Virginia',
    type: 'virginia',
    short_name: 'US-VA',
    state: 'VA',
    id: 1500000,
    state_code_id: 1616868,
    jurisdiction_id: 51,
    fin_related_doc_ids: [1632823]
  },
  {
    name: 'North Carolina',
    type: 'north_carolina',
    short_name: 'US-NC',
    state: 'NC',
    id: 1600000,
    state_code_id: 1658361,
    jurisdiction_id: 37,
    fin_related_doc_ids: [1660103]
  },
  {
    name: 'Indiana',
    type: 'indiana',
    short_name: 'US-IN',
    state: 'IN',
    id: 1700000,
    state_code_id: 1680478,
    jurisdiction_id: 18,
    fin_related_doc_ids: [1680611]
  },
  {
    name: 'Pennsylvania',
    type: 'pennsylvania',
    short_name: 'US-PA',
    state: 'PA',
    id: 1300000,
    state_code_id: 2390290,
    jurisdiction_id: 42,
    fin_related_doc_ids: [2396003]
  },
  {
    name: 'Alabama',
    type: 'alabama',
    short_name: 'US-AL',
    state: 'AL',
    id: 3500000,
    state_code_id: 2428530,
    jurisdiction_id: 1,
    fin_related_doc_ids: [2430121]
  },
  {
    name: 'Alaska',
    type: 'alaska',
    short_name: 'US-AK',
    state: 'AK',
    id: null,
    state_code_id: null,
    jurisdiction_id: 2,
    fin_related_doc_ids: []
  },
  {
    name: 'Arizona',
    type: 'arizona',
    short_name: 'US-AZ',
    state: 'AZ',
    id: 3300000,
    state_code_id: 2389266,
    jurisdiction_id: 4,
    fin_related_doc_ids: [2389527]
  },
  {
    name: 'Arkansas',
    type: 'arkansas',
    short_name: 'US-AR',
    state: 'AR',
    id: null,
    state_code_id: null,
    jurisdiction_id: 5,
    fin_related_doc_ids: []
  },
  {
    name: 'Georgia',
    type: 'georgia',
    short_name: 'US-GA',
    state: 'GA',
    id: null,
    state_code_id: null,
    jurisdiction_id: 13,
    fin_related_doc_ids: []
  },
  {
    name: 'Hawaii',
    type: 'hawaii',
    short_name: 'US-HI',
    state: 'HI',
    id: null,
    state_code_id: null,
    jurisdiction_id: 15,
    fin_related_doc_ids: []
  },
  {
    name: 'Idaho',
    type: 'idaho',
    short_name: 'US-ID',
    state: 'ID',
    id: 3200000,
    state_code_id: 2350440,
    jurisdiction_id: 16,
    fin_related_doc_ids: [2350648]
  },
  {
    name: 'Iowa',
    type: 'iowa',
    short_name: 'US-IA',
    state: 'IA',
    id: 1800000,
    state_code_id: 2056707,
    jurisdiction_id: 19,
    fin_related_doc_ids: [2057200, 2057224]
  },
  {
    name: 'Kansas',
    type: 'kansas',
    short_name: 'US-KS',
    state: 'KS',
    id: null,
    state_code_id: null,
    jurisdiction_id: 20,
    fin_related_doc_ids: []
  },
  {
    name: 'Kentucky',
    type: 'kentucky',
    short_name: 'US-KY',
    state: 'KY',
    id: 2600000,
    state_code_id: 2205330,
    jurisdiction_id: 21,
    fin_related_doc_ids: [2209176]
  },
  {
    name: 'Louisiana',
    type: 'louisiana',
    short_name: 'US-LA',
    state: 'LA',
    id: null,
    state_code_id: null,
    jurisdiction_id: 22,
    fin_related_doc_ids: []
  },
  {
    name: 'Maine',
    type: 'maine',
    short_name: 'US-ME',
    state: 'ME',
    id: null,
    state_code_id: null,
    jurisdiction_id: 23,
    fin_related_doc_ids: []
  },
  {
    name: 'Maryland',
    type: 'maryland',
    short_name: 'US-MD',
    state: 'MD',
    id: null,
    state_code_id: null,
    jurisdiction_id: 24,
    fin_related_doc_ids: []
  },
  {
    name: 'Michigan',
    type: 'michigan',
    short_name: 'US-MI',
    state: 'MI',
    id: 2200000,
    state_code_id: 2136292,
    jurisdiction_id: 26,
    fin_related_doc_ids: [2136539]
  },
  {
    name: 'Minnesota',
    type: 'minnesota',
    short_name: 'US-MN',
    state: 'MN',
    id: 2500000,
    state_code_id: 2169882,
    jurisdiction_id: 27,
    fin_related_doc_ids: [2176933]
  },
  {
    name: 'Mississippi',
    type: 'mississippi',
    short_name: 'US-MS',
    state: 'MS',
    id: null,
    state_code_id: null,
    jurisdiction_id: 28,
    fin_related_doc_ids: []
  },
  {
    name: 'Montana',
    type: 'montana',
    short_name: 'US-MT',
    state: 'MT',
    id: 3100000,
    state_code_id: 2330398,
    jurisdiction_id: 30,
    fin_related_doc_ids: [2330472]
  },
  {
    name: 'Nebraska',
    type: 'nebraska',
    short_name: 'US-NE',
    state: 'NE',
    id: 2300000,
    state_code_id: 2094078,
    jurisdiction_id: 31,
    fin_related_doc_ids: [2094218]
  },
  {
    name: 'New Hampshire',
    type: 'new_hampshire',
    short_name: 'US-NH',
    state: 'NH',
    id: 3400000,
    state_code_id: 2351048,
    jurisdiction_id: 33,
    fin_related_doc_ids: [2351146, 2351181, 2351165]
  },
  {
    name: 'New Jersey',
    type: 'new_jersey',
    short_name: 'US-NJ',
    state: 'NJ',
    id: null,
    state_code_id: null,
    jurisdiction_id: 34,
    fin_related_doc_ids: []
  },
  {
    name: 'New Mexico',
    type: 'new_mexico',
    short_name: 'US-NM',
    state: 'NM',
    id: null,
    state_code_id: null,
    jurisdiction_id: 35,
    fin_related_doc_ids: []
  },
  {
    name: 'North Dakota',
    type: 'north_dakota',
    short_name: 'US-ND',
    state: 'ND',
    id: 2800000,
    state_code_id: 2238807,
    jurisdiction_id: 38,
    fin_related_doc_ids: [2239107]
  },
  {
    name: 'Ohio',
    type: 'ohio',
    short_name: 'US-OH',
    state: 'OH',
    id: null,
    state_code_id: null,
    jurisdiction_id: 39,
    fin_related_doc_ids: []
  },
  {
    name: 'Oklahoma',
    type: 'oklahoma',
    short_name: 'US-OK',
    state: 'OK',
    id: 2400000,
    state_code_id: 2096122,
    jurisdiction_id: 40,
    fin_related_doc_ids: [2102775, 2099798]
  },
  {
    name: 'Rhode Island',
    type: 'rhode_island',
    short_name: 'US-RI',
    state: 'RI',
    id: null,
    state_code_id: null,
    jurisdiction_id: 44,
    fin_related_doc_ids: []
  },
  {
    name: 'South Carolina',
    type: 'south_carolina',
    short_name: 'US-SC',
    state: 'SC',
    id: 3000000,
    state_code_id: 2346423,
    jurisdiction_id: 45,
    fin_related_doc_ids: [2346435]
  },
  {
    name: 'South Dakota',
    type: 'south_dakota',
    short_name: 'US-SD',
    state: 'SD',
    id: 2900000,
    state_code_id: 2241826,
    jurisdiction_id: 46,
    fin_related_doc_ids: [2262531, 2247892, 2248112]
  },
  {
    name: 'Tennessee',
    type: 'tennessee',
    short_name: 'US-TN',
    state: 'TN',
    id: 2000000,
    state_code_id: 2084784,
    jurisdiction_id: 47,
    fin_related_doc_ids: [2084835]
  },
  {
    name: 'Utah',
    type: 'utah',
    short_name: 'US-UT',
    state: 'UT',
    id: 1900000,
    state_code_id: 2063009,
    jurisdiction_id: 49,
    fin_related_doc_ids: [2063830]
  },
  {
    name: 'Vermont',
    type: 'vermont',
    short_name: 'US-VT',
    state: 'VT',
    id: null,
    state_code_id: null,
    jurisdiction_id: 50,
    fin_related_doc_ids: []
  },
  {
    name: 'West Virgina',
    type: 'west_virgina',
    short_name: 'US-WV',
    state: 'WV',
    id: null,
    state_code_id: null,
    jurisdiction_id: 54,
    fin_related_doc_ids: []
  },
  {
    name: 'Wisconsin',
    type: 'wisconsin',
    short_name: 'US-WI',
    state: 'WI',
    id: 2100000,
    state_code_id: 2085368,
    jurisdiction_id: 55,
    fin_related_doc_ids: [2085869]
  },
  {
    name: 'Wyoming',
    type: 'wyoming',
    short_name: 'US-WY',
    state: 'WY',
    id: null,
    state_code_id: null,
    jurisdiction_id: 56,
    fin_related_doc_ids: []
  },
  {
    name: 'Washington DC',
    type: 'washington_dc',
    short_name: 'US-DC',
    state: 'DC',
    id: 2700000,
    state_code_id: 2214985,
    jurisdiction_id: 11,
    fin_related_doc_ids: [2226541]
  }
];

export const defaultStateAgenciesObj = defaultStateAgencies.reduce((mem, agency) => {
  mem[agency.id || agency.jurisdiction_id] = agency;
  return mem;
}, {});

// TODO: this list must be kept in sync with server
export const defaultTopics = [
  { id: 1, name: 'Lending', active_streaming: true },
  {
    id: 2,
    name: 'BSA/AML',
    description: 'Bank Secrecy Act/Anti-Money Laundering',
    active_streaming: true
  },
  { id: 3, name: 'Mortgage Lending', active_streaming: true },
  { id: 4, name: 'Crowdfunding', active_streaming: true },
  {
    id: 5,
    name: 'FCPA',
    description: 'Foreign Corrupt Practices Act'
  },
  { id: 6, name: 'Credit' },
  { id: 7, name: 'Deposits', active_streaming: true },
  { id: 8, name: 'Bank Operations' },
  { id: 9, name: 'Insurance' },
  { id: 10, name: 'Privacy' },
  { id: 11, name: 'Securities' },
  { id: 12, name: 'Trust' },
  { id: 13, name: 'Payments' },
  { id: 14, name: 'Cybersecurity' },
  { id: 15, name: 'Leasing' },
  { id: 16, name: 'Debt Collection' },
  { id: 17, name: 'Commercial Lending', active_streaming: true },
  { id: 18, name: 'Consumer Lending', active_streaming: true },
  { id: 19, name: 'Payday Loans' }
];

export const update_user_preferences = (reqData, props) => {
  const agencies = reqData.agencies.map(agency_id => {
    return { id: agency_id, following: true };
  });

  const topics = reqData.topics.map(topic_id => {
    const id = ~~topic_id;

    return { id, following: true };
  });
  const entities = defaultStateAgencies
    .filter(agency => agency.id === null)
    .reduce((mem, agency) => {
      for (const state_short_name of reqData.state_agencies) {
        if (agency.short_name === state_short_name) {
          mem.push({
            entity_id: agency.jurisdiction_id,
            entity_type: 'jurisdictions',
            following: true
          });
        }
      }
      return mem;
    }, []);
  props.followAgencies({ agencies });
  props.followEntities({ entities });
  props.followTopics({ topics });
};
