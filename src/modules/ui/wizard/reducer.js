import * as actions from './actions';
import reducer from '../../../util/reducer';

const INITIAL_STATE = {
  initialized: false,
  page: 1,
  showCommitRequirementsDialog: false,
  committed: false,
  values: null,
  commitError: null,
};

function setInitialized(state) {
  return Object.assign({}, state, {
    initialized: true,
  });
}

function nextPage(state) {
  return Object.assign({}, state, {
    page: state.page + 1,
  });
}

function previousPage(state) {
  return Object.assign({}, state, {
    page: state.page > 1 ? state.page - 1 : 1,
  });
}

function reset() {
  return INITIAL_STATE;
}

function showCommitRequirementsDialog(state) {
  return Object.assign({}, state, {
    showCommitRequirementsDialog: true,
  });
}

function hideCommitRequirementsDialog(state) {
  return Object.assign({}, state, {
    showCommitRequirementsDialog: false,
  });
}

function setCommitted(state, action) {
  return Object.assign({}, state, {
    committed: true,
    itemKey: action.payload.key,
    values: action.payload.values,
  });
}

function setCommitError(state, action) {
  return Object.assign({}, state, {
    commitError: action.payload.error,
    showCommitRequirementsDialog: false,
  });
}

function unsetCommitError(state) {
  return Object.assign({}, state, {
    commitError: null,
  });
}

const ACTION_HANDLERS = {
  [actions.WIZARD_SET_INITIALIZED]: setInitialized,
  [actions.WIZARD_NEXT_PAGE]: nextPage,
  [actions.WIZARD_PREVIOUS_PAGE]: previousPage,
  [actions.WIZARD_RESET]: reset,
  [actions.WIZARD_SHOW_COMMIT_REQUIREMENTS_DIALOG]: showCommitRequirementsDialog,
  [actions.WIZARD_HIDE_COMMIT_REQUIREMENTS_DIALOG]: hideCommitRequirementsDialog,
  [actions.WIZARD_SET_COMMITTED]: setCommitted,
  [actions.WIZARD_SET_COMMIT_ERROR]: setCommitError,
  [actions.WIZARD_UNSET_COMMIT_ERROR]: unsetCommitError,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
