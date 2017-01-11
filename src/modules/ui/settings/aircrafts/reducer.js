import * as actions from './actions';
import { ADD_AIRCRAFT_SUCCESS } from '../../../settings/aircrafts';
import reducer from '../../../../util/reducer';

const INITIAL_STATE = {
  newItem: {},
};

function changeNewItem(state, action) {
  const newItem = Object.assign({}, state.newItem, {
    [action.payload.type]: action.payload.item.toUpperCase().replace(/[^A-Z]/g, ''),
  });
  return Object.assign({}, state, {
    newItem,
  });
}

function resetNewItem(state, action) {
  const newItem = Object.assign({}, state.newItem, {
    [action.payload.type]: '',
  });
  return Object.assign({}, state, {
    newItem,
  });
}

const ACTION_HANDLERS = {
  [actions.CHANGE_NEW_ITEM]: changeNewItem,
  [ADD_AIRCRAFT_SUCCESS]: resetNewItem,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
