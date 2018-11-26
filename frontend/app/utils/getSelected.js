import { navigateSummary, navigateOverlay } from './navigate';
import _ from 'lodash';

export function getSelectedDocuments(selected_documents, current_doc_in_view_id) {
  const selected_doc_ids = [];
  const filtered_doc_ids = [];

  for (const doc_id of Object.keys(selected_documents)) {
    let filtered_doc_id = doc_id;
    //unlike search results timeline checked documents come back with sort type attached
    //this is done to further specify the document the user would like to doc action bar
    //for the sake of folders, we only want the numeric doc ID
    if (typeof doc_id === 'string') {
      const filtered_str_doc_id = doc_id.match(/\d+/g); //regex returns an array
      filtered_doc_id = parseInt(filtered_str_doc_id[0], 10);
    }
    filtered_doc_ids.push(filtered_doc_id);
    selected_doc_ids.push({ id: filtered_doc_id });
  }
  //add highlighted document ONLY IF it is not already checked
  if (current_doc_in_view_id && filtered_doc_ids.indexOf(current_doc_in_view_id) === -1) {
    selected_doc_ids.push({ id: current_doc_in_view_id });
  }
  return selected_doc_ids;
}

export function clearSelectedDocsAndReset(props, router) {
  props.clearSelectedItems();
  props.changeDocumentView('', null);
  //reset view if and only if overlay query not present (user copy paste URL)
  const overlay = props.location.query.overlay ? props.location.query.overlay : null;
  const id = props.location.query.summary_id ? props.location.query.summary_id : null;

  if (!_.isNil(overlay)) {
    navigateOverlay(props.location, router, overlay);
  } else {
    navigateSummary(props.location, router, id, '');
  }
}

//returns an array of selected doc ids from selected_items object
export function getSelectedDocids(current_view_selected_items) {
  const ids = Object.keys(current_view_selected_items).map(n => ~~n.replace(/\D+/g, ''));

  return ids;
}

export function sameDocsToSelect(current_docs, mew_docs) {
  if (!current_docs || !current_docs.items) {
    return false;
  }
  if (current_docs.items.length !== mew_docs.items.length) {
    return false;
  }
  const current_docs_ids = current_docs.items.map(x => x.id);
  const new_docs_ids = mew_docs.items.map(x => x.id);
  const found_unequal = current_docs_ids.find((x,i) => { return x !== new_docs_ids[i]; });
  return !found_unequal;
}
