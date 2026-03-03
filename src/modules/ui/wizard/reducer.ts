import * as actions from './actions';
import { WizardAction } from './actions';
import reducer from '../../../util/reducer';

interface WizardState {
  initialized: boolean;
  page: number;
  committed: boolean;
  values: Record<string, unknown>;
  commitError: unknown | null;
  dialogs: Record<string, boolean>;
  itemKey?: string;
  showCommitRequirementsDialog?: boolean;
}

const INITIAL_STATE: WizardState = {
  initialized: false,
  page: 1,
  committed: false,
  values: {},
  commitError: null,
  dialogs: {}
};

function setInitialized(state: WizardState, action: WizardAction & { type: typeof actions.WIZARD_SET_INITIALIZED }) {
  return {
    ...state,
    values: action.payload.values,
    initialized: true
  }
}

function updateValues(state: WizardState, action: WizardAction & { type: typeof actions.WIZARD_UPDATE_VALUES }) {
  return {
    ...state,
    values: action.payload.values,
  }
}

function nextPage(state: WizardState) {
  return Object.assign({}, state, {
    page: state.page + 1,
  });
}

function previousPage(state: WizardState) {
  return Object.assign({}, state, {
    page: state.page > 1 ? state.page - 1 : 1,
  });
}

function reset() {
  return INITIAL_STATE;
}

function showDialog(state: WizardState, action: WizardAction & { type: typeof actions.WIZARD_SHOW_DIALOG }) {
  const dialogs = Object.assign({}, state.dialogs, {
    [action.payload.name]: true
  });
  return Object.assign({}, state, {
    dialogs
  });
}

function hideDialog(state: WizardState, action: WizardAction & { type: typeof actions.WIZARD_HIDE_DIALOG }) {
  const dialogs = Object.assign({}, state.dialogs, {
    [action.payload.name]: false
  });
  return Object.assign({}, state, {
    dialogs
  });
}

function setCommitted(state: WizardState, action: WizardAction & { type: typeof actions.WIZARD_SET_COMMITTED }) {
  return Object.assign({}, state, {
    committed: true,
    itemKey: action.payload.key,
    values: action.payload.values,
  });
}

function setCommitError(state: WizardState, action: WizardAction & { type: typeof actions.WIZARD_SET_COMMIT_ERROR }) {
  return Object.assign({}, state, {
    commitError: action.payload.error,
    showCommitRequirementsDialog: false,
  });
}

function unsetCommitError(state: WizardState) {
  return Object.assign({}, state, {
    commitError: null,
  });
}

const ACTION_HANDLERS = {
  [actions.WIZARD_SET_INITIALIZED]: setInitialized,
  [actions.WIZARD_UPDATE_VALUES]: updateValues,
  [actions.WIZARD_NEXT_PAGE]: nextPage,
  [actions.WIZARD_PREVIOUS_PAGE]: previousPage,
  [actions.WIZARD_RESET]: reset,
  [actions.WIZARD_SHOW_DIALOG]: showDialog,
  [actions.WIZARD_HIDE_DIALOG]: hideDialog,
  [actions.WIZARD_SET_COMMITTED]: setCommitted,
  [actions.WIZARD_SET_COMMIT_ERROR]: setCommitError,
  [actions.WIZARD_UNSET_COMMIT_ERROR]: unsetCommitError,
};

export type { WizardState };
export default reducer<WizardState, WizardAction>(INITIAL_STATE, ACTION_HANDLERS);
