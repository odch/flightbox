import * as actions from './actions';
import { CustomsSelfDeclarationAction } from './actions';
import reducer from '../../../util/reducer';
import { normalizeSelfDeclarants, SelfDeclarant } from '../../../util/selfDeclarants';

interface CustomsSelfDeclarationState {
  // false until the first value arrived from the database, so the list is
  // never shown (or changed) on the basis of an empty initial state
  loaded: boolean;
  selfDeclarants: SelfDeclarant[];
  saving: boolean;
  saveFailed: boolean;
}

function selfDeclarantsLoaded(state: CustomsSelfDeclarationState, action: CustomsSelfDeclarationAction & { type: typeof actions.CUSTOMS_SELF_DECLARANTS_LOADED }) {
  return {
    ...state,
    loaded: true,
    selfDeclarants: normalizeSelfDeclarants(action.payload.value),
  };
}

function saving(state: CustomsSelfDeclarationState) {
  return {
    ...state,
    saving: true,
    saveFailed: false,
  };
}

function saveSuccess(state: CustomsSelfDeclarationState) {
  return {
    ...state,
    saving: false,
  };
}

function saveFailure(state: CustomsSelfDeclarationState) {
  return {
    ...state,
    saving: false,
    saveFailed: true,
  };
}

const ACTION_HANDLERS = {
  [actions.CUSTOMS_SELF_DECLARANTS_LOADED]: selfDeclarantsLoaded,
  [actions.SAVE_CUSTOMS_SELF_DECLARANTS_SAVING]: saving,
  [actions.SAVE_CUSTOMS_SELF_DECLARANTS_SUCCESS]: saveSuccess,
  [actions.SAVE_CUSTOMS_SELF_DECLARANTS_FAILURE]: saveFailure,
};

const INITIAL_STATE: CustomsSelfDeclarationState = {
  loaded: false,
  selfDeclarants: [],
  saving: false,
  saveFailed: false,
};

export type { CustomsSelfDeclarationState };
export default reducer<CustomsSelfDeclarationState, CustomsSelfDeclarationAction>(INITIAL_STATE, ACTION_HANDLERS);
