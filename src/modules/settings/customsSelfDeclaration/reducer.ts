import * as actions from './actions';
import { CustomsSelfDeclarationAction } from './actions';
import reducer from '../../../util/reducer';
import { normalizeEmailList } from '../../../util/emails';

interface CustomsSelfDeclarationState {
  // false until the first value arrived from the database, so the list is
  // never shown (or changed) on the basis of an empty initial state
  loaded: boolean;
  emails: string[];
  saving: boolean;
  saveFailed: boolean;
}

function emailsLoaded(state: CustomsSelfDeclarationState, action: CustomsSelfDeclarationAction & { type: typeof actions.CUSTOMS_SELF_DECLARATION_EMAILS_LOADED }) {
  return {
    ...state,
    loaded: true,
    emails: normalizeEmailList(action.payload.emails),
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
  [actions.CUSTOMS_SELF_DECLARATION_EMAILS_LOADED]: emailsLoaded,
  [actions.SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SAVING]: saving,
  [actions.SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_SUCCESS]: saveSuccess,
  [actions.SAVE_CUSTOMS_SELF_DECLARATION_EMAILS_FAILURE]: saveFailure,
};

const INITIAL_STATE: CustomsSelfDeclarationState = {
  loaded: false,
  emails: [],
  saving: false,
  saveFailed: false,
};

export type { CustomsSelfDeclarationState };
export default reducer<CustomsSelfDeclarationState, CustomsSelfDeclarationAction>(INITIAL_STATE, ACTION_HANDLERS);
