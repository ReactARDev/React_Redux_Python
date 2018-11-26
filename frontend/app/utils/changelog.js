/* eslint-disable max-len */
import moment from 'moment';

// indexed in YYYY-MM-DD format
export const CHANGELOG = {
  '2017-07-5': {
    sources: [
      {
        name: 'Financial Crimes Enforcement Network (FINCEN)',
        long_description: 'Added Financial Crimes Enforcement Network (FINCEN)',
        id: 194
      }
    ],
    changes: []
  },
  '2017-05-09': {
    sources: [
      {
        name: 'State code: Alabama',
        long_description: 'Added Alabama state code (US-AL)',
        id: 3500000,
        state_code_id: 2428530
      }
    ],
    changes: []
  },
  '2017-04-25': {
    sources: [
      {
        name: 'State code: Arizona',
        long_description: 'Added Arizona state code (US-AZ)',
        id: 3300000,
        state_code_id: 2389266
      },
      {
        name: 'State code: Pennsylvania',
        long_description: 'Added Pennsylvania state code (US-PA)',
        id: 1300000,
        state_code_id: 2390290
      },
      {
        name: 'State code: South Carolina',
        long_description: 'Added South Carolina state code (US-SC)',
        id: 3000000,
        state_code_id: 2346423
      },
      {
        name: 'State code: Montana',
        long_description: 'Added Montana state code (US-MT)',
        id: 3100000,
        state_code_id: 2330398
      },
      {
        name: 'State code: Idaho',
        long_description: 'Added Idaho state code (US-ID)',
        id: 3200000,
        state_code_id: 2350440
      },
      {
        name: 'State code: New Hampshire',
        long_description: 'Added New Hampshire state code (US-NH)',
        id: 3400000,
        state_code_id: 2351048
      }
    ],
    changes: []
  },
  '2017-04-11': {
    sources: [],
    changes: []
  },
  '2017-03-30': {
    sources: [
      {
        name: 'State code: South Dakota',
        long_description: 'Added South Dakota state code (US-SD)',
        id: 2900000,
        state_code_id: 2241826
      },
      {
        name: 'State code: Washington DC',
        long_description: 'Added Washington DC state code (US-DC)',
        id: 2700000,
        state_code_id: 2214985
      }
    ],
    changes: [
      {
        short_description: 'New Saved Searches Feature'
      }
    ]
  },
  '2017-03-15': {
    sources: [
      {
        name: 'State code: North Dakota',
        long_description: 'Added North Dakota state code (US-ND)',
        id: 2800000,
        state_code_id: 2238807
      }
    ],
    changes: []
  },
  '2017-03-01': {
    sources: [
      {
        name: 'State code: Tennessee',
        long_description: 'Added Tennessee state code (US-TN)',
        id: 2000000,
        state_code_id: 2084784
      },
      {
        name: 'State code: Kentucky',
        long_description: 'Added Kentucky state code (US-KY)',
        id: 2600000,
        state_code_id: 2205330
      },
      {
        name: 'State code: Minnesota',
        long_description: 'Added Minnesota state code (US-MN)',
        id: 2500000,
        state_code_id: 2169882
      }
    ],
    changes: []
  },
  '2017-02-15': {
    sources: [
      {
        name: 'State code: Wisconsin',
        long_description: 'Added Wisconsin state code (US-WI)',
        id: 2100000,
        state_code_id: 2085368
      },
      {
        name: 'State code: Michigan',
        long_description: 'Added Michigan state code (US-MI)',
        id: 2200000,
        state_code_id: 2136292
      },
      {
        name: 'State code: Nebraska',
        long_description: 'Added Nebraska state code (US-NE)',
        id: 2300000,
        state_code_id: 2094078
      },
      {
        name: 'State code: Oklahoma',
        long_description: 'Added Oklahoma state code (US-OK)',
        id: 2400000,
        state_code_id: 2096122
      }
    ],
    changes: [
      {
        short_description: 'State Code Navigator summary updates'
      }
    ]
  },
  '2017-01-31': {
    sources: [
      {
        name: 'State code: Iowa',
        long_description: 'Added Iowa state code (US-IA)',
        id: 1800000
      },
      {
        name: 'State code: Utah',
        long_description: 'Added Utah state code (US-UT)',
        id: 1900000
      }
    ],
    changes: [
      {
        short_description: 'New News Sources'
      },
      {
        short_description: 'Revised Sources Options'
      }
    ]
  },
  '2017-01-13': {
    sources: [
      {
        name: 'State code: Indiana',
        long_description: 'Added Indiana state code (US-IN)',
        id: 1700000
      },
      {
        name: 'State code: Missouri',
        long_description: 'Added Missouri state code (US-MO)',
        id: 1400000
      },
      {
        name: 'State code: North Carolina',
        long_description: 'Added North Carolina state code (US-NC)',
        id: 1600000
      },
      {
        name: 'State code: Virginia',
        long_description: 'Added Virginia state code (US-VA)',
        id: 1500000
      }
    ],
    changes: [
      {
        short_description: 'State Code Navigator Updates'
      },
      {
        short_description: 'Updated Sources Tab'
      }
    ]
  },
  '2016-12-20': {
    sources: [],
    changes: [
      {
        short_description: 'State Code Navigator'
      }
    ]
  },
  '2016-12-13': {
    sources: [
      {
        name: 'Federal Financial Institutions Examination Council (FFIEC)',
        long_description:
          'Added new source: Federal Financial Institutions Examination Council (FFIEC)',
        id: 168
      },
      {
        name: 'Executive Office of the President (EOP)',
        long_description: 'Added new source: Executive Office of the President (EOP)',
        id: 538
      }
    ],
    changes: []
  },
  '2016-11-30': {
    sources: [
      {
        name: 'State code: Illinois',
        long_description: 'Added Illinois state code (US-IL)',
        id: 1200000
      },
      {
        name: 'State code: Delaware',
        long_description: 'Added Delaware state code (US-DE)',
        id: 200000
      },
      {
        name: 'State code: Nevada',
        long_description: 'Added Nevada state code (US-NV)',
        id: 1000000
      },
      {
        name: 'State code: Texas',
        long_description: 'Added Texas state code (US-TX)',
        id: 300000
      },
      {
        name: 'State code: Washington',
        long_description: 'Added Washington state code (US-WA)',
        id: 1100000
      }
    ],
    changes: [
      {
        short_description: 'News Feed'
      }
    ]
  },
  '2016-11-01': {
    sources: [
      {
        name: 'State code: CO',
        long_description: 'Added Colorado state code (US-CO)',
        id: 700701
      },
      {
        name: 'State code: FL',
        long_description: 'Reformatted Florida state code (US-FL)',
        id: 500069
      }
    ],
    changes: [
      {
        short_description: 'User created folders'
      },
      {
        short_description: 'Suggestion box'
      }
    ]
  },
  '2016-10-24': {
    sources: [
      {
        name: 'State code: NY',
        long_description: 'Reformatted New York state code (US-NY)',
        id: 400000
      },
      {
        name: 'State code: MA',
        long_description: 'Added Massachusetts state code (US-MA)',
        id: 600000
      }
    ],
    changes: [
      {
        short_description: 'Document tagging'
      },
      {
        short_description: 'Related documents view'
      },
      {
        short_description: 'Relevance or Date sort options for search',
        long_description:
          'For searches, we return everything that might match your query and sort them so that the very best results are closest to the top. For the date sorted results, we strive to make every result "relevant" so that the date sorting gives you only good results. This is why results sorted by relevance show more documents than those sorted by date. Please let us know if we fall short of this goal so that we can make your date-sorted results as useful as possible.'
      }
    ]
  },
  '2016-10-05': {
    sources: [
      {
        name: 'New York State Div of Admin Rules (NY-DOS)',
        long_description:
          'Added New York Department of State, Division of Administrative Rules (NY-DOS)',
        id: 400000
      },
      {
        name: 'Florida Legislature (FL-FL)',
        long_description: 'Added Florida Legislature (FL-FL)',
        id: 500000
      },
      {
        name: 'Massachusetts Court System (MA-MCS)',
        long_description: 'Massachusetts Court System (MA-MCS)',
        id: 600000
      }
    ],
    changes: []
  },
  '2016-09-28': {
    sources: [],
    changes: [
      {
        short_description: 'New Insights graph'
      },
      {
        short_description: 'Export Insights to PNG'
      }
    ]
  },
  '2016-09-20': {
    sources: [
      {
        long_description: 'Added Oregon Secretary of State (OR-SOS)',
        added: true,
        name: 'Oregon Secretary of State (OR-SOS)',
        id: 200000
      },
      {
        long_description: 'Added Connecticut General Assembly (CT-CGA)',
        added: true,
        name: 'Connecticut General Assembly (CT-CGA)',
        id: 300000
      }
    ],
    changes: [
      {
        short_description: 'Insights graphs for trends'
      }
    ]
  }
};

export function changes_since(date_since, most_recent = null) {
  const changes = {};

  let keys = Object.keys(CHANGELOG);

  function reverse_sort(a, b) {
    if (a > b) {
      return -1;
    } else if (a < b) {
      return 1;
    }
    return 0;
  }

  if (most_recent) {
    // return only the number of most recent entries specified as an argument
    keys = keys.sort(reverse_sort).slice(0, most_recent);
  }

  for (const date_str of keys) {
    const date = moment.utc(date_str);

    if (!date_since || date.isAfter(date_since)) {
      changes[date_str] = CHANGELOG[date_str];
    }
  }

  return changes;
}
