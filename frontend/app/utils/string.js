import trunc from 'trunc-html';
import _ from 'lodash';

// for a given string and tag pair, uses the tags to extract any substring that are
// already tagged, creates a version of the string without those tags, and then
// returns a 2-tuple array with the array of matches and the string without tags
function get_matches_and_string_without_tags(str, tag) {
  const matches = [];
  const start_tag = '<' + tag + '>';
  const end_tag = '</' + tag + '>';

  // Deal with already highlighted text from ES, pulls any existing tags from the source, marks them
  // as regex matches, and then let it process them as if they were matched on the client side below
  let str_without_tags = '';
  const start_tag_regex = new RegExp(start_tag, 'gi');
  let current_str_index = 0;
  let tag_match;
  do {
    tag_match = start_tag_regex.exec(str);
    if (tag_match) {
      let current_end_index = str.indexOf(end_tag, tag_match.index);

      // if we have a start tag without an end tag, lets just set its end index to
      // TODO: this does not handle cases where we have multiple start tags without end tags
      // TODO: use substring approach that is safe for multi-byte utf-8 chars
      if (current_end_index === -1) {
        current_end_index = str.length;
      }

      str_without_tags += str.substring(current_str_index, tag_match.index);
      const matched_string = str.substring(tag_match.index + start_tag.length, current_end_index);
      matches.push([str_without_tags.length, matched_string.length]);
      str_without_tags += matched_string;
      current_str_index = current_end_index + end_tag.length;
    }
  } while (tag_match);
  str_without_tags += str.substr(current_str_index);

  return [matches, str_without_tags];
}

// takes a string that has been pre-processed and stripped of existing tags, an array
// of terms, and an array of known matches (or empty array if none). it then aggregates
// all of the matches for all of the terms into a single array, sorts them by the index
// then collapses any matches that are overlapping, and returns an array of collapsed
// matches, which are 2-tuples (index, length) into the string without tags
function get_term_matches_for_string(str_without_tags, terms, matches) {
  // gather up all of the match indices/lengths for all of the terms
  for (const term of terms) {
    const regex = new RegExp(_.escapeRegExp(term), 'gi');
    let match;
    do {
      match = regex.exec(str_without_tags);
      if (match) {
        matches.push([match.index, term.length]);
      }
    } while (match);
  }

  // sort the matches by index ascending
  const sorted_matches = matches.sort((a, b) => {
    return a[0] > b[0];
  });

  // collapse any overlapping matches so we don't double highlight
  // TODO can the collapse logic be simplified?
  const max_match_index = sorted_matches.length - 1;
  let current_match_index = 0;
  const collapsed_matches = [];
  const loop = sorted_matches.length > 0;
  let current_match = null;

  while (loop) {
    if (!current_match) {
      current_match = sorted_matches[current_match_index];
    }

    if (current_match_index === max_match_index) {
      collapsed_matches.push(current_match);
      current_match = null;
      break;
    }

    const next_match = sorted_matches[current_match_index + 1];

    // catch the overlap scenario and collapse the matches that go together
    if (current_match[0] + current_match[1] > next_match[0]) {
      // take the greatest end index and subtract the first start index for the new length
      const new_match_length =
        Math.max(current_match[0] + current_match[1], next_match[0] + next_match[1]) -
        current_match[0];
      current_match = [current_match[0], new_match_length];
    } else {
      collapsed_matches.push(current_match);
      current_match = null;
    }
    current_match_index++;
  }

  return collapsed_matches;
}

// takes a raw string, an array of terms to match, and a tag to decorate matches with
// and finds all matches in the string, rebuilds a new string with those matches
// surrounded with the provided tag, and returns that rebuilt string
export function highlight_string_with_filters(str, terms, tag) {
  let result = '';
  const start_tag = '<' + tag + '>';
  const end_tag = '</' + tag + '>';

  const matches_and_str_without_tags = get_matches_and_string_without_tags(str, tag);
  const matches = matches_and_str_without_tags[0];
  const str_without_tags = matches_and_str_without_tags[1];

  const collapsed_matches = get_term_matches_for_string(str_without_tags, terms, matches);

  // using all of the match indices/lengths, rebuild the string with <em></em> wrapped
  // around each of the matches
  // TODO: use substring approach that is safe for multi-byte utf-8 chars
  let current_rebuild_index = 0;
  for (const match of collapsed_matches) {
    result += str_without_tags.substring(current_rebuild_index, match[0]);
    result += start_tag + str_without_tags.substr(match[0], match[1]) + end_tag;
    current_rebuild_index = match[0] + match[1];
  }
  result += str_without_tags.substr(current_rebuild_index);

  return result;
}

// more or less re-implementing elasticsearch's highlighting feature here..
// takes an input string, an array of terms, and the desired tag, finds all
// of the matches for that string, then for the first 5 matches, grabs
// a fragment of test that surrounds it, finally returning an array of those
// 5 substring fragments that highlight the provided terms
export function get_highlighted_string_fragments(str, terms, tag) {
  const fragment_size = 100; // n.b. elasticsearch default
  const max_fragments = 5; // n.b. elasticsearch default
  const result = [];
  const start_tag = '<' + tag + '>';
  const end_tag = '</' + tag + '>';
  const first_space_regex = /(\s+)/;

  // gets matches for the last space, using a negated lookahead (?!) against a series of
  // 0 or more characters (.*) followed by a space character.
  // note: the use of ? after .* is key here for specifying that we want the search to
  // be non-greedy, which makes the performance tractable
  const last_space_regex = /\s+(?!.*?\s+)/;

  const matches_and_str_without_tags = get_matches_and_string_without_tags(str, tag);
  const matches = matches_and_str_without_tags[0];
  const str_without_tags = matches_and_str_without_tags[1];
  const str_without_tags_length = str_without_tags.length;

  const collapsed_matches = get_term_matches_for_string(str_without_tags, terms, matches);

  // track the intervals of the current match fragments so we know if there are any overlaps
  const match_intervals = [];

  // using all of the match indices/lengths, rebuild the string with <em></em> wrapped
  // around each of the matches
  // TODO FIXME: deal with situation where multiple matches occur in the same fragment!!!!
  for (const match of collapsed_matches) {
    // don't build any more fragments above our maximum
    if (result.length > max_fragments) {
      break;
    }

    // TODO: use substring approach that is safe for multi-byte utf-8 chars
    const fragment = str_without_tags.substr(match[0], match[1]);
    const extra_chars_total = fragment_size - fragment.length;
    const extra_chars_half = Math.ceil(extra_chars_total / 2); // n.b. ceil over floor is arbitrary
    let fragment_index_front;
    let fragment_index_back;

    // handle case where extra_chars_total / 2 on the front is more than we have
    if (match[0] - extra_chars_half <= 0) {
      fragment_index_front = 0;
    } else {
      fragment_index_front = match[0] - extra_chars_half;

      // now we need to go look backwards for the first char
      const front_of_string = str_without_tags.substring(0, fragment_index_front - 1);
      const space_match = last_space_regex.exec(front_of_string);
      if (space_match) {
        // n.b. the minus one when creating front of string and the -1 otherwise
        // needed for the length cancel each other out here..
        fragment_index_front -= front_of_string.length - space_match.index;
      } else {
        // if no match, then this should be the beginning
        fragment_index_front = 0;
      }
    }

    // handle case where extra_chars_total / 2 on the back is more than we have
    if (match[0] + match[1] + extra_chars_half >= str_without_tags_length - 1) {
      fragment_index_back = str_without_tags_length - 1;
    } else {
      fragment_index_back = match[0] + match[1] + extra_chars_half;

      // now we need to go look for the next space char
      const rest_of_string = str_without_tags.substring(fragment_index_back);
      const space_match = first_space_regex.exec(rest_of_string);
      if (space_match) {
        fragment_index_back += space_match.index;
      } else {
        // if no match, then this should be the end
        fragment_index_back = str_without_tags_length - 1;
      }
    }

    // check if the match occurs between any of the existing intervals, and skip it if so
    // TODO validate this works
    let overlaps_another_fragment = false;
    for (const interval of match_intervals) {
      const interval_start = interval[0];
      const interval_end = interval[1];

      if (
        (interval_start < match[0] && match[0] < interval_end) ||
        (interval_start < match[0] + match[1] && match[0] + match[1] < interval_end)
      ) {
        overlaps_another_fragment = true;
      }
    }
    if (overlaps_another_fragment) {
      continue;
    }

    let current_string = str_without_tags.substring(fragment_index_front, match[0]);
    current_string += start_tag + fragment + end_tag;
    current_string += str_without_tags.substring(match[0] + match[1], fragment_index_back);
    result.push(current_string);
    match_intervals.push([fragment_index_front, fragment_index_back]);
  }
  return result;
}

export function safe_highlight_and_truncate(str, terms, tag, max_length) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  try {
    const str_trunc = trunc(str, max_length).html;
    return highlight_string_with_filters(str_trunc, terms, tag);
  } catch (e) {
    // trunc_html seems somewhat fragile, so we have a simple backup here
    // quick and dirty html removal, prevent mismatched tags
    const str_no_html = str.replace(/[<>]/g, '');
    return str_no_html.slice(0, max_length);
  }
}

export function smart_title_case(str) {
  const skip_words = ['a', 'and', 'and', 'of', 'or', 'the'];

  const words = str.split(' ');
  const out_words = [];

  words.forEach((word, i) => {
    if (i > 0 && skip_words.indexOf(word) !== -1) {
      out_words.push(word);
    } else {
      out_words.push(_.capitalize(word));
    }
  });

  return out_words.join(' ');
}
