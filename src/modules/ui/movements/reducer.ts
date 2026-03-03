import * as actions from './actions';
import { UiMovementsAction } from './actions';
import reducer from '../../../util/reducer';

interface UiMovementsState {
  deleteConfirmation: unknown | null;
  selected: string | null;
  filterExpanded: boolean;
}

function showDeleteConfirmationDialog(state: UiMovementsState, action: UiMovementsAction & { type: typeof actions.SHOW_DELETE_CONFIRMATION_DIALOG }) {
  return Object.assign({}, state, {
    deleteConfirmation: action.payload.item,
  });
}

function hideDeleteConfirmationDialog(state: UiMovementsState) {
  return Object.assign({}, state, {
    deleteConfirmation: null,
  });
}

function selectMovement(state: UiMovementsState, action: UiMovementsAction & { type: typeof actions.SELECT_MOVEMENT }) {
  return Object.assign({}, state, {
    selected: action.payload.key || null,
  });
}

function setMovementsFilterExpanded(state: UiMovementsState, action: UiMovementsAction & { type: typeof actions.SET_MOVEMENTS_FILTER_EXPANDED }) {
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

const INITIAL_STATE: UiMovementsState = {
  deleteConfirmation: null,
  selected: null,
  filterExpanded: false
};

export type { UiMovementsState };
export default reducer<UiMovementsState, UiMovementsAction>(INITIAL_STATE, ACTION_HANDLERS);
