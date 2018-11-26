import { highlight_string_with_filters } from '../utils/string';

// TODO unit testing scenario candidates
// no terms
const test_string_none =
  'I am a document with CFPB, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms_none = [];
console.log(highlight_string_with_filters(test_string_none, test_terms_none, 'em'));

// term that does not match
const test_string_none2 =
  'I am a document with CFPB, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms_none2 = ['FDIC'];
console.log(highlight_string_with_filters(test_string_none2, test_terms_none2, 'em'));

// two distinct matches
const test_string =
  'I am a document with CFPB, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms = ['CFPB', 'document'];
console.log(highlight_string_with_filters(test_string, test_terms, 'em'));

// 2 overlapping
const test_string2 =
  'I am a document with CFPB, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms2 = ['CFPB', 'document with CFPB'];
console.log(highlight_string_with_filters(test_string2, test_terms2, 'em'));

// 3 overlapping and one extra
const test_string3 =
  'I am a document with CFPB, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms3 = ['CFPB', 'document with CFPB', 'with', 'ipsum'];
console.log(highlight_string_with_filters(test_string3, test_terms3, 'em'));

//exact duplicate and one extra
const test_string4 =
  'I am a document with CFPB, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms4 = ['CFPB', 'document with CFPB', 'with', 'ipsum', 'CFPB'];
console.log(highlight_string_with_filters(test_string4, test_terms4, 'em'));

// pre-highighted text from ES that overlaps plus overlapping and one extra
const test_string5 =
  'I am a document with <em>CFPB</em>, this is written by CFPB, lorem ipsum yada yada yada';
const test_terms5 = ['CFPB', 'document with CFPB', 'lorem'];
console.log(highlight_string_with_filters(test_string5, test_terms5, 'em'));

// pre-highighted non-overlapping text from ES plus overlapping and one extra
const test_string6 =
  'I am a document with CFPB, this is written by CFPB, lorem <em>ipsum</em> yada yada yada';
const test_terms6 = ['CFPB', 'document with CFPB', 'lorem'];
console.log(highlight_string_with_filters(test_string6, test_terms6, 'em'));

// pre-highighted overlapping text from ES (1 valid and one without an end tag) plus overlapping and one extra
const test_string7 =
  'I am a document <em>with</em> CFPB, this is written by CFPB, lorem <em>ipsum yada yada yada';
const test_terms7 = ['CFPB', 'document with CFPB', 'lorem'];
console.log(highlight_string_with_filters(test_string7, test_terms7, 'em'));

// pre-highighted overlapping text from ES (1 valid and one without an end tag before other overlaps) plus overlapping and one extra
const test_string8 =
  'I am a document <em>with</em> CFPB, <em>this is written by CFPB, lorem ipsum yada yada yada';
const test_terms8 = ['CFPB', 'document with CFPB', 'lorem'];
console.log(highlight_string_with_filters(test_string8, test_terms8, 'em'));
