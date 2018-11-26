import _ from 'lodash';

export const autosuggest_filter_mapping = {
  agencies: { filter: 'agency', value: 'id', default_sort: 'date' },
  citations: { filter: 'citation_id', value: 'id', default_sort: 'date' },
  named_regulations: { filter: 'regulation_id', value: 'id', default_sort: 'date' },
  acts: { filter: 'act_id', value: 'id', default_sort: 'date' },
  dockets: { filter: 'docket_id', value: 'docket_id', default_sort: 'date' },
  concepts: { filter: 'concept_id', value: 'id', default_sort: 'date' },
  banks: { filter: 'bank_id', value: 'id', default_sort: 'date' },
  topics: { filter: 'topic_id', value: 'id', default_sort: 'date' }
};

export const invAutosuggest = () => {
  const newObj = {};
  for (const key of Object.keys(autosuggest_filter_mapping)) {
    const newKey = autosuggest_filter_mapping[key].filter;
    newObj[newKey] = key;
  }
  return newObj;
};

// extracts the autosuggest term that was selected based on the query arg list and the
// filtered mention retrieved from the api
export function get_autosuggest_term(query, filtered_mention) {
  // if the value originally selected was in the short name list, parse our
  // autosuggest_mapper query argument and pull out the index, otherwise
  // use the name of the mention as the default behavior
  let value;
  if (query.autosuggest_mapper && query.autosuggest_mapper !== 'name') {
    if (_.isArray(filtered_mention.short_name)) {
      const short_name_index = parseInt(query.autosuggest_mapper.split('-')[1], 10);
      value = filtered_mention.short_name[short_name_index];
    } else {
      value = filtered_mention.short_name;
    }
  } else {
    value = filtered_mention.name;
  }

  return value;
}

// maps the raw type value from elastic that is stored in the _type field
// of autosuggest responses to the type/value we need to display below
export const autosuggest_name_map = {
  agencies: 'agency',
  acts: 'act',
  dockets: 'docket',
  concepts: 'concept',
  citations: 'citation',
  named_regulations: 'regulation',
  banks: 'bank',
  topics: 'topic'
};
