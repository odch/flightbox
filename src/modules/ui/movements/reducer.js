import * as actions from './actions';
import reducer from '../../../util/reducer';

function showDeleteConfirmationDialog(state, action) {
  return Object.assign({}, state, {
    deleteConfirmation: action.payload.item,
  });
}

function hideDeleteConfirmationDialog(state) {
  return Object.assign({}, state, {
    deleteConfirmation: null,
  });
}

function selectMovement(state, action) {
  return Object.assign({}, state, {
    selected: action.payload.key || null,
  });
}

function setMovementsFilterExpanded(state, action) {
  return {
    ...state,
    filterExpanded: action.payload.expanded
  };
}

const ACTION_HANDLERS = {
  [actions.SHOW_DELETE_CONFIRMATION_DIALOG]: showDeleteConfirmationDialog,
  [actions.HIDE_DELETE_CONFIRMATION_DIALOG]: hideDeleteConfirmationDialog,
  [actions.SELECT_MOVEMENT]: selectMovement,
  [actions.SET_MOVEMENTS_FILTER_EXPANDED]: setMovementsFilterExpanded,
};

const INITIAL_STATE = {
  deleteConfirmation: null,
  selected: null,
  filterExpanded: false
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
