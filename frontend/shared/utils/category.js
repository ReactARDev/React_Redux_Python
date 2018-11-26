import _ from 'lodash';

const from_api_mapping = {
  'Agency News': 'Agency Update',
  'Public Statement': 'Agency Update',
  'SRO Update': 'Agency Update',
  Guidance: 'Agency Update',
  Updates: 'Agency Update',
  Notice: 'Register Notice',
  'Final Rule': 'Rule'
};

const to_api_mapping = _.invert(from_api_mapping);

export function category_from_api(name) {
  return from_api_mapping[name] || name;
}

export function category_to_api(name) {
  return to_api_mapping[name] || name;
}

// skip News on timeline since it is handled in the news feed
// skip Enforcement Metadata in timeline because there is no guarantee of well-formedness
export const categories_skipped_on_timeline = [
  'News',
  'Enforcement Metadata',
  'Mainstream News',
  'State Code',
  'State Code Navigation',
  'State Code',
  'US Code',
  'US Code Navigation',
  'State Code Navigation',
  'US Public Law',
  'US Public Law Navigation'
];
export const categories_skipped_on_search = ['Enforcement Metadata'];

// Skips "Code" categories for date sorted search results, they show near the top due
// to an artifact of how we assign publication dates
export const categories_skipped_in_date_search = [
  'State Code',
  'US Code',
  'US Code Navigation',
  'State Code Navigation',
  'US Public Law',
  'US Public Law Navigation'
];
