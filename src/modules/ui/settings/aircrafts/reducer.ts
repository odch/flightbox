import * as actions from './actions';
import { UiSettingsAircraftsAction } from './actions';
import { ADD_AIRCRAFT_SUCCESS } from '../../../settings/aircrafts';
import reducer from '../../../../util/reducer';
import { REGISTRATION_REGEX } from '../../../../util/aircrafts';

interface UiSettingsAircraftsState {
  newItem: Record<string, string>;
}

const INITIAL_STATE: UiSettingsAircraftsState = {
  newItem: {},
};

function changeNewItem(state: UiSettingsAircraftsState, action: UiSettingsAircraftsAction & { type: typeof actions.CHANGE_NEW_ITEM }) {
  const newItem = Object.assign({}, state.newItem, {
    [action.payload.type]: action.payload.item.toUpperCase().replace(REGISTRATION_REGEX, ''),
  });
  return Object.assign({}, state, {
    newItem,
  });
}

function resetNewItem(state: UiSettingsAircraftsState, action: any) {
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

export type { UiSettingsAircraftsState };
export default reducer<UiSettingsAircraftsState, UiSettingsAircraftsAction>(INITIAL_STATE, ACTION_HANDLERS);
