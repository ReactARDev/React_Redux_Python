import { defaultStateAgencies } from '../../shared/utils/defaultSources';
import _ from 'lodash';

export function filter_state_code(props, child) {
  const state_code_id = props.selected_state.state_code_id;

  for (const state of defaultStateAgencies) {
    if (state.state_code_id === state_code_id) {
      if (
        !_.isEmpty(state.fin_related_doc_ids) &&
        state.fin_related_doc_ids.indexOf(child.id) === -1
      ) {
        child.non_banking = true;
      }
    }
  }
  return child;
}
