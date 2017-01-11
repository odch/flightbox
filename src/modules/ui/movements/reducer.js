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

const ACTION_HANDLERS = {
  [actions.SHOW_DELETE_CONFIRMATION_DIALOG]: showDeleteConfirmationDialog,
  [actions.HIDE_DELETE_CONFIRMATION_DIALOG]: hideDeleteConfirmationDialog,
};

const INITIAL_STATE = {
  deleteConfirmation: null,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
